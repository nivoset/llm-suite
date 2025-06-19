'use client';

import { useState } from 'react';
import { ChatPanel, type ChatMessage } from './ChatPanel';
import type { JiraDocument } from '~/types/jira';

interface JiraChatPanelProps {
  jiraCard: JiraDocument;
}

export function JiraChatPanel({ jiraCard }: JiraChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const handleSendMessage = async (message: string) => {
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: message, 
      timestamp: new Date().toISOString() 
    }]);
    // Add AI response simulation
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'This is a simulated response. The AI integration is coming soon!',
        timestamp: new Date().toISOString()
      }]);
    }, 1000);
  };

  return (
    <div className="h-full">
      <ChatPanel
        messages={messages}
        onSendMessage={handleSendMessage}
        context={jiraCard}
      />
    </div>
  );
} 