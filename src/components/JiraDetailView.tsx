'use client';

import { useQuery } from '@tanstack/react-query';
import { loadJiraDocuments } from '~/llm/jira';
import { JiraCard } from './JiraCard';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useQueryParameter } from '~/hooks/useQueryParameter';
import { JiraChatPanel } from './JiraChatPanel';
import { JiraAnalysisPanel } from './JiraAnalysisPanel';
import type { JiraDocument } from '~/types/jira';

interface JiraDetailViewProps {
  issueKey: string;
}

export function JiraDetailView({ issueKey }: JiraDetailViewProps) {
  const [activeTab, setActiveTab] = useQueryParameter('tab', 'chat');

  const { data: jiraCards, isLoading, refetch: refetchCard } = useQuery({
    queryKey: ['jira-cards', 'SCRUM'],
    queryFn: async () => {
      const docs = await loadJiraDocuments({ 
        projectKey: 'SCRUM',
      });
      return docs;
    },
  });

  const jiraCard = jiraCards?.find(doc => doc.metadata.key === issueKey);

  const handleRefresh = async () => {
    await refetchCard();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[100dvh] dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  if (!jiraCard) {
    return (
      <div className="flex items-center justify-center h-[100dvh] dark:bg-gray-900">
        <div className="bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Card Not Found</h3>
          <p>Could not find card with key: {issueKey}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full bg-white dark:bg-gray-900">
      <div className="grid lg:grid-cols-2 grid-cols-1 h-[100dvh]">
        {/* Left panel - Jira details */}
        <div className="p-6 lg:border-r border-b lg:border-b-0 border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="mb-4">
            <Link href="/" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline">
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Back to List</span>
            </Link>
          </div>
          <JiraCard 
            doc={jiraCard} 
            isDetailView 
            onRefresh={handleRefresh}
            isRefreshing={isLoading}
          />
        </div>

        {/* Right panel - Chat interface */}
        <div className="flex flex-col h-[100dvh]">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              role="tab"
              aria-selected={activeTab === 'chat'}
              aria-controls="chat-panel"
              className={`flex-1 py-4 px-6 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                activeTab === 'chat'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              onClick={() => setActiveTab('chat')}
            >
              Chat
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'analysis'}
              aria-controls="analysis-panel"
              className={`flex-1 py-4 px-6 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                activeTab === 'analysis'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              onClick={() => setActiveTab('analysis')}
            >
              Analysis
            </button>
          </div>

          {/* Tab panels */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' ? (
              <div id="chat-panel" role="tabpanel" aria-labelledby="chat-tab" className="h-full">
                <JiraChatPanel jiraCard={jiraCard} />
              </div>
            ) : (
              <div id="analysis-panel" role="tabpanel" aria-labelledby="analysis-tab" className="h-full">
                <JiraAnalysisPanel jiraCard={jiraCard} onRefresh={handleRefresh} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 