import { NextResponse } from 'next/server';
import { loadJiraDocuments } from '~/llm/jira';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectKey = searchParams.get('projectKey');
  const epicKey = searchParams.get('epicKey');

  if (!projectKey) {
    return NextResponse.json({ error: 'projectKey is required' }, { status: 400 });
  }

  try {
    const documents = await loadJiraDocuments({ projectKey, epicKey });
    return NextResponse.json(documents);
  } catch (error: any) {
    console.error('Failed to fetch Jira issues:', error);
    return NextResponse.json({ error: 'Failed to fetch Jira issues', details: error.message }, { status: 500 });
  }
} 