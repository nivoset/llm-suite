import { NextResponse } from 'next/server';
import { getProjects } from '~/llm/jira/client';

export async function GET() {
  try {
    const projects = await getProjects();
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Failed to fetch Jira projects:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: `Failed to fetch Jira projects: ${errorMessage}` }, { status: 500 });
  }
} 