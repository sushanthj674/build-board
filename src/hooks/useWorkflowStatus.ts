import useSWR from 'swr';
import { fetchWorkflowStatus, RepoStatus } from '@/lib/github';

export function useWorkflowStatus(owner: string, repo: string, limit: number = 5, token?: string, refreshInterval: number = 0) {
  // Use a hash or a slice of the token in the key to differentiate between different tokens for the same repo
  const tokenFingerprint = token ? token.slice(-4) : 'noauth';
  const { data, error, isLoading, mutate } = useSWR<RepoStatus>(
    `github-workflow-status-${owner}-${repo}-${tokenFingerprint}`,
    () => fetchWorkflowStatus(owner, repo, 5, token),
    {
      // Disable polling and automatic revalidation. 
      // We rely on the initial fetch + Webhooks/SSE for all updates.
      refreshInterval: 0, 
      revalidateOnFocus: false, // STOP fetching when the window is refocused
      revalidateOnReconnect: false, // STOP fetching when network reconnects
      dedupingInterval: 10000, // Increase deduping to 10 seconds
    }
  );

  return {
    repoStatus: data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
