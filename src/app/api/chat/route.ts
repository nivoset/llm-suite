import { model } from '~/llm/model';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

export const runtime = 'edge';

const systemTemplate = `You are a helpful AI assistant embedded in a Jira-like application.
Your goal is to answer questions about the provided Jira issue context.
Be concise and helpful.

Jira Issue Context:
---
Title: {title}
Description: {description}
Status: {status}
---

Previous conversation:
---
{chat_history}
---
`;

export async function POST(req: Request) {
  const { messages, jiraCard } = await req.json();

  const chat_history = messages.map((m: any) => {
    if (m.role === 'user') {
      return new HumanMessage(m.content);
    } else {
      return new SystemMessage(m.content);
    }
  });

  const prompt = PromptTemplate.fromTemplate(systemTemplate);

  const chain = RunnableSequence.from([
    prompt,
    model,
    new StringOutputParser(),
  ]);

  const stream = await chain.stream({
    ...jiraCard.metadata,
    chat_history,
    input: messages[messages.length - 1].content,
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain' },
  });
} 