'use client';

import { useJiraAnalysis } from '~/hooks/useJiraAnalysis';
import type { JiraDocument } from '~/types/jira';

interface JiraAnalysisPanelProps {
  jiraCard: JiraDocument;
}

export function JiraAnalysisPanel({ jiraCard }: JiraAnalysisPanelProps) {
  const { data: analysis, isLoading: isAnalysisLoading } = useJiraAnalysis(jiraCard);

  if (isAnalysisLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="space-y-8">
        {/* Overview section combining key insights */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2 text-blue-700 dark:text-blue-300">Business Impact</h3>
              <p className="text-gray-700 dark:text-gray-300">{analysis.businessAnalysis}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2 text-purple-700 dark:text-purple-300">Architecture</h3>
              <p className="text-gray-700 dark:text-gray-300">{analysis.architecturalAnalysis}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2 text-green-700 dark:text-green-300">Implementation</h3>
              <p className="text-gray-700 dark:text-gray-300">{analysis.developmentAnalysis}</p>
            </div>
          </div>
        </section>

        {/* Key Questions section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Key Questions</h2>
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <ul className="space-y-3">
              {analysis.questions.map((q, i) => {
                const [category] = q.match(/\[(.*?)\]/) || ['[Other]'];
                const question = q.replace(/\[(.*?)\]\s*/, '');
                return (
                  <li key={i} className="flex items-start gap-3">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                      category.includes('Business') ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' :
                      category.includes('Technical') ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' :
                      category.includes('Implementation') ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      {category.replace(/[\[\]]/g, '')}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">{question}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Recommendations section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Recommendations</h2>
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <ul className="space-y-3">
              {analysis.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">•</span>
                  <span className="text-gray-700 dark:text-gray-300">{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
} 