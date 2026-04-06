'use client';

import { useEffect } from 'react';
import { useSWRConfig } from 'swr';

export function useRealTimeUpdates() {
  const { mutate } = useSWRConfig();

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      if (eventSource) eventSource.close();
      
      eventSource = new EventSource('/api/status/stream');

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { owner, repo, workflowRun } = data;

          mutate(
            (key: any) => typeof key === 'string' && key.startsWith(`github-workflow-status-${owner}-${repo}-`),
            (currentData: any) => {
              if (!currentData) return currentData;
              
              const existingRuns = currentData.workflowRuns || [];
              const otherRuns = existingRuns.filter((run: any) => run.id !== workflowRun.id);
              
              return {
                ...currentData,
                workflowRuns: [workflowRun, ...otherRuns].slice(0, 5)
              };
            },
            { revalidate: false }
          );

          console.log(`Live Update: ${owner}/${repo} - ${workflowRun.status}`);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE Connection Error, retrying in 5s...', error);
        eventSource?.close();
        // Custom retry logic in case browser's built-in retry fails
        reconnectTimeout = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      if (eventSource) eventSource.close();
      clearTimeout(reconnectTimeout);
    };
  }, [mutate]);
}
