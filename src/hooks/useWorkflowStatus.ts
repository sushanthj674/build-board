import useSWR from 'swr';
import { fetchWorkflowStatus, RepoStatus } from '@/lib/github';

export function useWorkflowStatus(owner: string, repo: string, limit: number = 5, token?: string, refreshInterval: number = 0) {
  // Use a hash or a slice of the token in the key to differentiate between different tokens for the same repo
  const tokenFingerprint = token ? token.slice(-4) : 'noauth';
  const { data, error, isLoading, mutate } = useSWR<RepoStatus>(
    `github-workflow-status-${owner}-${repo}-${tokenFingerprint}`,
    () => fetchWorkflowStatus(owner, repo, 5, token),
    {
      // Fallback polling (60s) even if SSE is used, to ensure the UI is eventually correct
      // if any push messages are missed. We use the provided refreshInterval or 60000.
      refreshInterval: refreshInterval || 60000, 
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
