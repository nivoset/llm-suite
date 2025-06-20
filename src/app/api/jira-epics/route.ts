import { NextResponse } from 'next/server';
import { getEpics } from '~/llm/jira/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectKey = searchParams.get('projectKey');

  if (!projectKey) {
    return NextResponse.json({ message: 'Missing projectKey parameter' }, { status: 400 });
  }

  try {
    const epics = await getEpics(projectKey);
    return NextResponse.json(epics);
  } catch (error) {
    console.error(`Failed to fetch Jira epics for project ${projectKey}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: `Failed to fetch Jira epics: ${errorMessage}` }, { status: 500 });
  }
} 