export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StarterPrompt {
  display: string;
  message: string;
} 