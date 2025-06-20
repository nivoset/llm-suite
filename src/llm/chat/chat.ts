import { model } from '~/llm/model';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatMessageHistory } from '@langchain/community/stores/message/in_memory';
import { jiraTools } from '~/llm/tools/jira';

const messageStore: Map<string, ChatMessageHistory> = new Map();

const prompt = PromptTemplate.fromTemplate(`
You are a concise, helpful AI assistant integrated into a Jira-like issue tracking system.  
Your task is to answer user questions based strictly on the context of a specific Jira issue.

Jira Issue Context:
---
Title: {title}
Description: {description}
Status: {status}
---

Previous Conversation:
---
{chat_history}
---

Instructions:
- Only respond using information from the Jira issue context or prior conversation.
- If information is missing or unclear, ask a brief follow-up question or indicate the gap clearly.
- If the user asks a question that is not related to the Jira issue, politely inform them that you are an assistant for this specific issue and cannot answer questions about other topics.
`);


const chain = prompt.pipe(model.bindTools(
  [... jiraTools]
)).pipe(new StringOutputParser());

export const chatWithHistory = new RunnableWithMessageHistory({
  runnable: chain,
  getMessageHistory: (sessionId) => {
    if (!messageStore.has(sessionId)) {
      messageStore.set(sessionId, new ChatMessageHistory());
    }
    return messageStore.get(sessionId)!;
  },
  inputMessagesKey: 'input',
  historyMessagesKey: 'chat_history',
}); 