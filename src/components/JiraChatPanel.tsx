'use client';

import { ChatPanel } from './ChatPanel';
import type { JiraDocument } from '~/types/jira';
import { useChat } from '~/hooks/useChat';

interface JiraChatPanelProps {
  jiraCard: JiraDocument;
}

const STARTER_PROMPTS = [
  'Summarize this issue for me.',
  'What is the current status and priority?',
];

export function JiraChatPanel({ jiraCard }: JiraChatPanelProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading, sendMessage } = useChat({
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
        starterPrompts={STARTER_PROMPTS}
        onStarterClick={sendMessage}
      />
    </div>
  );
} 