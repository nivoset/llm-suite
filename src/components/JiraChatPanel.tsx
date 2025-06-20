'use client';

import { ChatPanel } from './ChatPanel';
import type { JiraDocument } from '~/types/jira';
import { useChat } from '~/hooks/useChat';
import type { StarterPrompt } from '~/types/chat';

interface JiraChatPanelProps {
  jiraCard: JiraDocument;
  onSuggestUpdate: (newContent: string) => void;
}

const STARTER_PROMPTS: StarterPrompt[] = [
  {
    display: 'Summarize the issue',
    message: 'Can you please provide a concise summary of this Jira issue, including its main objective and current status?',
  },
  {
    display: 'Identify action items',
    message: 'What are the key action items or next steps required to move this issue forward, based on its description and comments?',
  },
  {
    display: 'Explain the current status',
    message: 'Could you explain what the current status of this issue implies and what the typical next phase would be?',
  },
  {
    display: 'Check for blockers',
    message: 'Are there any potential blockers, impediments, or open questions mentioned in the comments or description that need addressing?',
  },
];

export function JiraChatPanel({ jiraCard, onSuggestUpdate }: JiraChatPanelProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading, sendMessage } = useChat({
    body: {
      jiraCard,
    },
    onToolEnd: (output) => {
      try {
        const parsed = JSON.parse(output);
        if (parsed.suggestedContent) {
          onSuggestUpdate(parsed.suggestedContent);
        }
      } catch (e) {
        // Not a JSON object, ignore.
      }
    }
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