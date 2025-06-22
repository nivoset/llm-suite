import { useQuery } from '@tanstack/react-query';
import { analyzeJiraEpicPipeline_invoke } from '~/llm/analyze';
import type { JiraIssue } from '~/llm/jira';

export function useJiraAnalysis(doc: JiraIssue | undefined) {
  return useQuery({
    queryKey: ['jira-analysis', doc?.key],
    queryFn: async () => {
      if (!doc) throw new Error('No document provided');
      const res = await analyzeJiraEpicPipeline_invoke({
        title: doc.fields.summary,
        description: doc.fields.description,
        components: doc.fields.components,
        acceptanceCriteria: doc.fields.acceptanceCriteria,
        linkedIssues: doc.fields.linkedIssues,
        labels: doc.fields.labels,
        priority: doc.fields.priority?.name,
        epicLink: doc.fields.epicLink,
      })
      return res;
    },
    enabled: !!doc,
  });
} 