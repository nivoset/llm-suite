import { chatWithHistory } from '~/llm/chat/chat';


export async function POST(req: Request) {
  const { messages, jiraCard } = await req.json();
  const sessionId = jiraCard.metadata.key;

  const stream = await chatWithHistory.stream(
    {
      ...jiraCard.metadata,
      input: messages[messages.length - 1].content,
    },
    {
      configurable: {
        sessionId,
      },
    },
  );

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain' },
  });
} 