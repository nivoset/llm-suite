'use client';

import { useState, useRef } from 'react';
import type { Message } from '~/types/chat';

type UseChatOptions = {
  initialMessages?: Message[];
  body?: Record<string, unknown>;
  onFinish?: (message: Message) => void;
};

export const useChat = ({ initialMessages = [], body, onFinish }: UseChatOptions = {}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesRef = useRef<Message[]>(messages);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
    };

    const newMessages = [...messagesRef.current, userMessage];
    setMessages(newMessages);
    messagesRef.current = newMessages;
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          ...body,
        }),
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = '';
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '',
      };

      const allMessages = [...newMessages, assistantMessage];
      setMessages(allMessages);
      messagesRef.current = allMessages;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantResponse += chunk;

        setMessages(prevMessages => {
          const updatedMessages = [...prevMessages];
          const lastMessage = updatedMessages[updatedMessages.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.content = assistantResponse;
          }
          messagesRef.current = updatedMessages;
          return updatedMessages;
        });
      }

      const finalAssistantMessage: Message = {
        ...assistantMessage,
        content: assistantResponse,
      };

      if (onFinish) {
        onFinish(finalAssistantMessage);
      }
    } catch (error) {
      console.error('Error fetching chat response:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'system',
        content: 'An error occurred. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await sendMessage(input);
    setInput('');
  };

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    sendMessage,
    setInput,
  };
}; 