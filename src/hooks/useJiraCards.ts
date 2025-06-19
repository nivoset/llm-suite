import { useQuery } from '@tanstack/react-query';
import { loadJiraDocuments } from '~/llm/jira';
import type { JiraDocument } from '~/types/jira';

export function useJiraCards(projectKey: string = 'SCRUM') {
  return useQuery<JiraDocument[], Error>({
    queryKey: ['jira-cards', projectKey],
    queryFn: async () => loadJiraDocuments({ projectKey }),
  });
} 