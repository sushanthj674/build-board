import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { eventBus } from '@/lib/server-events';

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || '';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get('x-hub-signature-256');

    // 1. Verify Webhook Signature (if secret is configured)
    if (WEBHOOK_SECRET && signature) {
      const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
      const digest = `sha256=${hmac.update(payload).digest('hex')}`;
      
      if (signature !== digest) {
        console.error('GitHub Webhook: Invalid signature');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const data = JSON.parse(payload);
    const event = req.headers.get('x-github-event');

    // 2. Handle 'workflow_run' event
    if (event === 'workflow_run') {
      const { action, workflow_run, repository } = data;
      const owner = repository.owner.login;
      const repo = repository.name;

      console.log(`GitHub Webhook [${owner}/${repo}]: Workflow ${workflow_run.name} is ${workflow_run.status}`);

      // Emit the update to the server event bus
      eventBus.emit('workflow_run.update', {
        owner,
        repo,
        workflowRun: {
          id: workflow_run.id,
          name: workflow_run.name,
          status: workflow_run.status,
          conclusion: workflow_run.conclusion,
          html_url: workflow_run.html_url,
          created_at: workflow_run.created_at,
        }
      });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('GitHub Webhook Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
