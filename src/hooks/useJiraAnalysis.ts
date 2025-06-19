import { useQuery } from '@tanstack/react-query';
import { analyzeJiraEpic } from '~/llm/analyze';
import type { JiraDocument } from '~/types/jira';

export function useJiraAnalysis(doc: JiraDocument | undefined) {
  return useQuery({
    queryKey: ['jira-analysis', doc?.metadata.key],
    queryFn: async () => {
      if (!doc) throw new Error('No document provided');
      return analyzeJiraEpic(doc);
    },
    enabled: !!doc,
  });
} 