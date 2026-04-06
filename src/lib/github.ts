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
      'User-Agent': 'GitHub-Actions-Dashboard',
    };
    if (useToken) {
      // Use Bearer for modern GitHub APIs, though 'token' also works for classic PATs
      headers.Authorization = `Bearer ${useToken.trim()}`;
    }
    return fetch(url, { headers, cache: 'no-store' });
  };

  try {
    let response = await makeRequest(activeToken);

    // If unauthorized (401) with a token, try one more time without a token
    // This handles public repos in other orgs where the global token isn't valid
    if (response.status === 401 && activeToken) {
      response = await makeRequest(undefined);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || response.statusText;

      if (response.status === 403) {
        if (response.headers.get('X-RateLimit-Remaining') === '0') {
          throw new Error('GitHub API Rate limit exceeded. Please wait or use a token with higher limits.');
        }
        // Check for SSO requirement
        if (response.headers.get('X-GitHub-SSO')) {
          throw new Error('SAML SSO authorization required. Please authorize your token for this organization.');
        }
        throw new Error(`Access Denied (403): ${errorMessage}. Ensure your token has 'repo' and 'workflow' scopes.`);
      }
      if (response.status === 404) {
        throw new Error(`Repository not found: ${owner}/${repo}. Check the name and your token permissions.`);
      }
      if (response.status === 401) {
        throw new Error('Unauthorized (401): Invalid token. Please check your credentials.');
      }
      throw new Error(`GitHub Error (${response.status}): ${errorMessage}`);
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
