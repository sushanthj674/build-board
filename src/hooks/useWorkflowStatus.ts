import useSWR from 'swr';
import { fetchWorkflowStatus, RepoStatus } from '@/lib/github';

export function useWorkflowStatus(owner: string, repo: string, limit: number = 5, token?: string) {
  const { data, error, isLoading, mutate } = useSWR<RepoStatus>(
    `github-workflow-status-${owner}-${repo}-${token ? 'auth' : 'noauth'}`,
    () => fetchWorkflowStatus(owner, repo, 5, token),
    {
      refreshInterval: 1000,
      revalidateOnFocus: true,
    }
  );

  return {
    repoStatus: data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
