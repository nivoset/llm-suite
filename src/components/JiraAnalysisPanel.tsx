'use client';

import { useJiraAnalysis } from '~/hooks/useJiraAnalysis';
import type { JiraIssue } from '~/llm/jira';
import { AnalysisSkeleton } from './AnalysisSkeleton';
import { Markdown } from './Markdown';
import { TypePill } from './TypePill';

interface JiraAnalysisPanelProps {
  jiraCard: JiraIssue;
  onRefresh?: () => void;
}

export function JiraAnalysisPanel({ jiraCard, onRefresh }: JiraAnalysisPanelProps) {
  const { data: { results: analysis } = {}, isLoading: isAnalysisLoading } = useJiraAnalysis(jiraCard);

  if (isAnalysisLoading) {
    return <AnalysisSkeleton />;
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="space-y-8">

        {analysis.researchTopics && (
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">Questions</h2>
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-transparent">
              <ul className="space-y-3">
                {analysis.questions.map(({ type, question }, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <TypePill type={type} />
                    <Markdown markdown={question} />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Detailed Analysis section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">Detailed Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analysis.analysis.business && (
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-100 dark:border-transparent">
                <h3 className="text-lg font-medium mb-2 text-blue-700 dark:text-blue-300">Business Impact</h3>
                <Markdown markdown={analysis.analysis.business} />
              </div>
            )}
            {analysis.analysis.architect && (
            <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg border border-purple-100 dark:border-transparent">
              <h3 className="text-lg font-medium mb-2 text-purple-700 dark:text-purple-300">Architecture</h3>
              <Markdown markdown={analysis.analysis.architect} />
            </div>
            )}
            {analysis.analysis.developer && (
            <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-100 dark:border-transparent">
              <h3 className="text-lg font-medium mb-2 text-green-700 dark:text-green-300">Implementation</h3>
              <Markdown markdown={analysis.analysis.developer} />
            </div>
            )}
            {analysis.analysis.qa && (
            <div className="bg-cyan-50 dark:bg-cyan-900/30 p-4 rounded-lg border border-cyan-100 dark:border-transparent">
              <h3 className="text-lg font-medium mb-2 text-cyan-700 dark:text-cyan-300">Tester's Perspective</h3>
              <Markdown markdown={analysis.analysis.qa} />
            </div>
            )}
          </div>
        </section>

        {analysis.researchTopics && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">Research Topics</h2>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 p-6 rounded-lg border border-slate-200 dark:border-transparent">
            <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed">
              <Markdown markdown={analysis.researchTopics.join("\n")} />
            </p>
          </div>
        </section>
        )}
      </div>
    </div>
  );
} 