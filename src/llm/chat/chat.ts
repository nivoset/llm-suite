'use server'
import { model } from '~/llm/model';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatMessageHistory } from '@langchain/community/stores/message/in_memory';
import { jiraTools } from '~/llm/tools/jira';
import { JiraIssue } from '../jira';

const messageStore: Map<string, ChatMessageHistory> = new Map();

const prompt = PromptTemplate.fromTemplate(`
You are a proactive and helpful AI assistant embedded within a Jira issue. 
Your primary purpose is to help users understand, analyze, and update the specific Jira issue provided in the context.

Jira Issue Context:
---
{context}
---

Previous Conversation:
---
{chat_history}
---

Your Task:
Based on the user's message, determine the best course of action.
1.  **Use a tool**: If the user asks to add a comment, update the issue, or asks a question you can't answer from the context, use your available tools.
2.  **Answer from context**: If the user asks a question that can be answered from the Jira Issue Context or the Previous Conversation, provide a concise answer.
3.  **Clarify**: If the user's request is ambiguous, ask for clarification.

Do not ask "How can I help you?". You should always be taking one of the actions above.

- any updates to the issue should be done using Atlassian Markdown:
  - Format your output using Atlassian Markdown syntax (e.g., *italic*, **bold**, \`monospace\`, ||table headers||, etc.).
  - Use bullet lists (-), numbered lists (#), and headings (h1. h2. h3.) where appropriate.
  - Use gherkin for all acceptance criteria.
  - All formatting should be done using atlassian markdown syntax.

User Message:
{input}
`);


const chain = prompt.pipe(model.bindTools(
  [... jiraTools]
)).pipe(new StringOutputParser());

const chatWithHistory = new RunnableWithMessageHistory({
  runnable: chain,
  getMessageHistory: (sessionId) => {
    if (!messageStore.has(sessionId)) {
      console.log('setting message store', sessionId)
      messageStore.set(sessionId, new ChatMessageHistory());
    }
    return messageStore.get(sessionId)!;
  },
  inputMessagesKey: 'input',
  historyMessagesKey: 'chat_history',
}); 


export const sendChatMessageAboudJiraIssue = async (sessionId: string, jiraCard: JiraIssue, message: string) => {
  const context = `Key: ${jiraCard.key}\nTitle: ${jiraCard.fields.summary}\nStatus: ${jiraCard.fields.status.name}\nDescription: ${jiraCard.fields.description}`;
  
  return chatWithHistory.stream(
    {
      context,
      input: message,
    } as any,
    {
      configurable: {
        sessionId,
      },
    },
  );
}