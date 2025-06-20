import { useQuery } from '@tanstack/react-query';
import { loadJiraDocuments } from '~/llm/jira';
import type { JiraDocument } from '~/types/jira';

export function useJiraCards({ projectKey }: { projectKey: string | null }) {
  return useQuery<JiraDocument[], Error>({
    queryKey: ['jira-cards', projectKey],
    queryFn: async () => {
      if (!projectKey) {
        return [];
      }
      return loadJiraDocuments({ projectKey });
    },
    enabled: !!projectKey,
  });
} 