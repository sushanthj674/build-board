import { NextRequest } from 'next/server';
import { eventBus } from '@/lib/server-events';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      // 1. Initial connection keep-alive message
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(': connected\n\n'));

      // 2. Define the listener
      const onUpdate = (data: any) => {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      // 3. Listen to the server-side event bus
      eventBus.on('workflow_run.update', onUpdate);

      // 4. Keep-alive ping every 15 seconds (aggressive for Render/Proxies)
      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(': keep-alive\n\n'));
      }, 15000);

      // 5. Cleanup when the request is closed
      req.signal.addEventListener('abort', () => {
        eventBus.off('workflow_run.update', onUpdate);
        clearInterval(keepAlive);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
