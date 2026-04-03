export interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  html_url: string;
  created_at: string;
}

export interface RepoStatus {
  owner: string;
  repo: string;
  workflowRuns: WorkflowRun[];
}

export async function fetchWorkflowStatus(
  owner: string, 
  repo: string, 
  limit: number = 1,
  token?: string
): Promise<RepoStatus> {
  const activeToken = token || process.env.NEXT_PUBLIC_GITHUB_TOKEN;
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=${limit}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: activeToken ? `token ${activeToken}` : '',
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch workflow status: ${response.statusText}`);
    }

    const data = await response.json();
    const workflowRuns = data.workflow_runs || [];

    return {
      owner,
      repo,
      workflowRuns,
    };
  } catch (error) {
    console.error('Error fetching GitHub workflow status:', error);
    return {
      owner,
      repo,
      workflowRuns: [],
    };
  }
}
