import { sendChatMessageAboudJiraIssue } from '~/llm/chat/chat';


export async function POST(req: Request) {
  const { message, jiraCard } = await req.json();
  console.log('message', message);
  console.log('jiraCard', jiraCard);
  const sessionId = jiraCard.id;

  const stream = await sendChatMessageAboudJiraIssue(sessionId, jiraCard, message);
  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain' },
  });
} 