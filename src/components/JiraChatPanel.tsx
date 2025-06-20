'use client';

import { useChat } from 'ai/react';
import { ChatPanel } from './ChatPanel';
import type { JiraDocument } from '~/types/jira';

interface JiraChatPanelProps {
  jiraCard: JiraDocument;
}

export function JiraChatPanel({ jiraCard }: JiraChatPanelProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: {
      jiraCard,
    },
  });

  return (
    <div className="h-full">
      <ChatPanel
        messages={messages}
        input={input}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        context={jiraCard}
        isLoading={isLoading}
      />
    </div>
  );
} 