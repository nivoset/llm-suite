'use client';

import { useRef, useEffect } from 'react';
import type { JiraDocument } from '~/types/jira';
import type { Message } from '~/types/chat';

interface ChatPanelProps {
  messages: Message[];
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  context: JiraDocument;
  isLoading?: boolean;
  starterPrompts?: string[];
  onStarterClick?: (prompt: string) => void;
}

export function ChatPanel({
  messages,
  input,
  onInputChange,
  onSubmit,
  isLoading,
  starterPrompts = [],
  onStarterClick,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && starterPrompts.length > 0 && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-2xl font-semibold text-slate-500 dark:text-slate-400 mb-4">
              Ask about this issue
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {starterPrompts.map((prompt, i) => (
                <button
                  key={i}
                  className="p-4 border rounded-lg text-left bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800/80 text-slate-900 dark:text-slate-100 transition-colors cursor-pointer"
                  onClick={() => onStarterClick?.(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-lg rounded-lg px-4 py-2 border border-slate-200 dark:border-transparent ${
                m.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-lg rounded-lg px-4 py-2 border border-slate-200 dark:border-transparent bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 p-4">
        <form onSubmit={onSubmit} className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={onInputChange}
            placeholder="Ask a question..."
            className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Sending
              </span>
            ) : (
              'Send'
            )}
          </button>
        </form>
      </div>
    </div>
  );
} 