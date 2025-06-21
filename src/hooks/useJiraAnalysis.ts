import { useQuery } from '@tanstack/react-query';
import { analyzeJiraEpic } from '~/llm/analyze';
import type { JiraIssue } from '~/llm/jira';

export function useJiraAnalysis(doc: JiraIssue | undefined) {
  return useQuery({
    queryKey: ['jira-analysis', doc?.key],
    queryFn: async () => {
      if (!doc) throw new Error('No document provided');
      return analyzeJiraEpic(doc);
    },
    enabled: !!doc,
  });
} 