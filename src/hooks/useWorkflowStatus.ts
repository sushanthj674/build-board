import useSWR from 'swr';
import { fetchWorkflowStatus, RepoStatus } from '@/lib/github';

export function useWorkflowStatus(owner: string, repo: string, limit: number = 5, token?: string, refreshInterval: number = 0) {
  // Use a hash or a slice of the token in the key to differentiate between different tokens for the same repo
  const tokenFingerprint = token ? token.slice(-4) : 'noauth';
  const { data, error, isLoading, mutate } = useSWR<RepoStatus>(
    `github-workflow-status-${owner}-${repo}-${tokenFingerprint}`,
    () => fetchWorkflowStatus(owner, repo, 5, token),
    {
      // Disable polling entirely. We are now 100% real-time via Webhooks/SSE.
      refreshInterval: 0, 
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  return {
    repoStatus: data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
