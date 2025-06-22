'use client';

import { useState } from 'react';
import { useJiraAnalysis } from '~/hooks/useJiraAnalysis';
import type { JiraIssue } from '~/llm/jira';
import { updateJiraFromAnswers } from '~/llm/jira/updater';
import { AnalysisSkeleton } from './AnalysisSkeleton';
import { Markdown } from './Markdown';
import { TypePill } from './TypePill';

interface JiraAnalysisPanelProps {
  jiraCard: JiraIssue;
  onRefresh?: () => void;
}

interface QuestionAnswer {
  question: string;
  answer: string;
  category: string;
  isEditing: boolean;
}

export function JiraAnalysisPanel({ jiraCard, onRefresh }: JiraAnalysisPanelProps) {
  const { data: { results: analysis } = {}, isLoading: isAnalysisLoading } = useJiraAnalysis(jiraCard);
  const [answers, setAnswers] = useState<Record<number, QuestionAnswer>>({});
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAnswerChange = (index: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [index]: {
        ...prev[index] || { 
          question: analysis?.questions[index]?.question || '',
          category: analysis?.questions[index]?.type || 'Other',
          isEditing: true
        },
        answer
      }
    }));
  };

  const toggleAnswerEdit = (index: number) => {
    setAnswers(prev => ({
      ...prev,
      [index]: {
        ...prev[index] || {
          question: analysis?.questions[index]?.question || '',
          category: analysis?.questions[index]?.type || 'Other',
          answer: '',
          isEditing: false
        },
        isEditing: !(prev[index]?.isEditing ?? false)
      }
    }));
  };

  const handleUpdateAllAnswers = async () => {
    const answersToUpdate = Object.values(answers)
      .filter((answer) => answer.answer.trim())
      .map((answer) => ({
        question: answer.question,
        answer: answer.answer.trim(),
        category: answer.category,
      }));

    if (answersToUpdate.length === 0) return;

    setIsUpdating(true);

    try {
      await updateJiraFromAnswers(jiraCard, answersToUpdate);
      
      onRefresh?.();
      
      setAnswers(prev => {
        const newAnswers = { ...prev };
        Object.keys(newAnswers).forEach(key => {
          newAnswers[Number(key)].isEditing = false;
        });
        return newAnswers;
      });

    } catch (error) {
      console.error('Failed to update answers:', error);
      alert('Failed to update Jira issue. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isAnalysisLoading) {
    return <AnalysisSkeleton />;
  }

  if (!analysis) {
    return null;
  }

  const hasModifiedAnswers = Object.values(answers).some(answer => answer.answer.trim());

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="space-y-8">
        {analysis.questions && (
           <section>
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Key Questions</h2>
             {hasModifiedAnswers && (
               <button
                 className={`px-4 py-2 text-sm font-medium rounded-md text-white 
                   ${isUpdating 
                     ? 'bg-slate-400 cursor-not-allowed'
                     : 'bg-blue-600 hover:bg-blue-700'
                   }`}
                 onClick={handleUpdateAllAnswers}
                 disabled={isUpdating}
               >
                 {isUpdating ? (
                   <span className="flex items-center gap-2">
                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                     Updating All...
                   </span>
                 ) : (
                   'Update Answered Questions'
                 )}
               </button>
             )}
           </div>
           <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-transparent">
             <ul className="space-y-6">
               {analysis.questions.map(({ type, question }, i) => {
                 const answer = answers[i];
 
                 return (
                   <li key={i} className="space-y-3">
                     <div className="flex items-start gap-3">
                       <TypePill type={type} />
                       <span className="text-slate-700 dark:text-slate-300">{question}</span>
                       <button
                         onClick={() => toggleAnswerEdit(i)}
                         className="ml-auto text-sm text-blue-600 dark:text-blue-400 hover:underline"
                       >
                         {answer?.isEditing ? 'Cancel' : 'Answer'}
                       </button>
                     </div>
                     
                     {answer?.isEditing && (
                       <textarea
                         className="w-full px-3 py-2 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                         rows={3}
                         placeholder="Enter your answer..."
                         value={answer?.answer || ''}
                         onChange={(e) => handleAnswerChange(i, e.target.value)}
                       />
                     )}
                     {!answer?.isEditing && answer?.answer && (
                       <div className="bg-white dark:bg-slate-700 p-3 rounded-md">
                         <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                           {answer.answer}
                         </p>
                       </div>
                     )}
                   </li>
                 );
               })}
             </ul>
           </div>
         </section>
        )}

        {/* Detailed Analysis section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">Detailed Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analysis.analysis.business && (
              <div className="bg-blue-50 dark:bg-slate-800 p-4 rounded-lg border border-blue-100 dark:border-slate-700">
                <h3 className="text-lg font-medium mb-2 text-blue-700 dark:text-blue-300">Business Impact</h3>
                <Markdown markdown={analysis.analysis.business} />
              </div>
            )}
            {analysis.analysis.architect && (
            <div className="bg-purple-50 dark:bg-slate-800 p-4 rounded-lg border border-purple-100 dark:border-slate-700">
              <h3 className="text-lg font-medium mb-2 text-purple-700 dark:text-purple-300">Architecture</h3>
              <Markdown markdown={analysis.analysis.architect} />
            </div>
            )}
            {analysis.analysis.developer && (
            <div className="bg-green-50 dark:bg-slate-800 p-4 rounded-lg border border-green-100 dark:border-slate-700">
              <h3 className="text-lg font-medium mb-2 text-green-700 dark:text-green-300">Implementation</h3>
              <Markdown markdown={analysis.analysis.developer} />
            </div>
            )}
            {analysis.analysis.qa && (
            <div className="bg-cyan-50 dark:bg-slate-800 p-4 rounded-lg border border-cyan-100 dark:border-slate-700">
              <h3 className="text-lg font-medium mb-2 text-cyan-700 dark:text-cyan-300">Tester's Perspective</h3>
              <Markdown markdown={analysis.analysis.qa} />
            </div>
            )}
          </div>
        </section>

        {analysis.researchTopics && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">Research Topics</h2>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:bg-none dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
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