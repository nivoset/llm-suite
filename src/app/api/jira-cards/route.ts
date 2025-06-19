import { NextRequest, NextResponse } from 'next/server';
import { loadJiraDocuments } from '~/llm/jira';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectKey = searchParams.get('projectKey') || 'SCRUM';
  try {
    const docs = await loadJiraDocuments({ projectKey });
    return NextResponse.json(docs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load Jira cards' }, { status: 500 });
  }
} 