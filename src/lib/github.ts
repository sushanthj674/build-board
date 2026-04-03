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

  const makeRequest = async (useToken: string | undefined) => {
    const headers: HeadersInit = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (useToken) {
      headers.Authorization = `token ${useToken}`;
    }
    return fetch(url, { headers, cache: 'no-store' });
  };

  try {
    let response = await makeRequest(activeToken);

    // If unauthorized with a token, try one more time without a token
    // This handles public repos in other orgs where the global token isn't valid
    if (response.status === 401 && activeToken) {
      response = await makeRequest(undefined);
    }

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Rate limit exceeded or access denied. Please check your token.');
      }
      if (response.status === 404) {
        throw new Error('Repository not found.');
      }
      if (response.status === 401) {
        throw new Error('Unauthorized. This repository may be private.');
      }
      throw new Error(`GitHub Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const workflowRuns = data.workflow_runs || [];

    return {
      owner,
      repo,
      workflowRuns,
    };
  } catch (error: any) {
    console.error('GitHub API Error:', error.message);
    throw error;
  }
}
