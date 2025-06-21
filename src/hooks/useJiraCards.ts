import { useQuery } from '@tanstack/react-query';
import type { JiraDocument } from '~/types/jira';

export function useJiraCards({ projectKey, epicKey }: { projectKey: string | null, epicKey: string | null }) {
  return useQuery<JiraDocument[], Error>({
    queryKey: ['jira-cards', projectKey, epicKey],
    queryFn: async () => {
      if (!projectKey) {
        return [];
      }
      const params = new URLSearchParams({ projectKey });
      if (epicKey) {
        params.append('epicKey', epicKey);
      }
      const response = await fetch(`/api/jira-issues?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
    enabled: !!projectKey,
  });
} 