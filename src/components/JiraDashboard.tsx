'use client';

import { JiraCard } from './JiraCard';
import { useJiraCards } from '~/hooks/useJiraCards';

export default function JiraDashboard() {
  const { data: jiraCards, isLoading, error } = useJiraCards();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[100dvh] dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[100dvh] dark:bg-gray-900">
        <div className="bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg shadow max-w-lg">
          <h3 className="text-lg font-semibold mb-2">Error Loading Jira Cards</h3>
          <p className="whitespace-pre-wrap">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!jiraCards?.length) {
    return (
      <div className="flex items-center justify-center h-[100dvh] dark:bg-gray-900">
        <div className="bg-yellow-50 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">No Jira Cards Found</h3>
          <p>No cards were found in the project. Please check your project settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 container mx-auto px-4 py-8 bg-white dark:bg-gray-900">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Jira Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jiraCards.map((card, index) => (
          <JiraCard key={card.metadata.key || index} doc={card} />
        ))}
      </div>
    </div>
  );
} 