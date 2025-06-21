'use server'

import type { JiraIssue } from '~/llm/jira';
import { architectNode } from './agents/architect';
import { businessAnalystNode } from './agents/businessAnalyst';
import { developerNode } from './agents/developer';
import { qaEngineerNode } from './agents/qaEngineer';
import { summaryNode } from './agents/summary';
import type { AnalysisState, AnalysisResult } from './analysis-types';
import { questionExtractorNode } from './agents/questionExtractor';

export async function analyzeJiraEpic(doc: JiraIssue): Promise<AnalysisResult> {
  const comments =
    doc.fields.comment?.comments
      ?.map((c: any) => `[${c.author.displayName} on ${c.created}]: ${c.body}`)
      .join('\n\n') || 'No comments yet.';

  const pageContent = `
Issue Key: ${doc.key}
Summary: ${doc.fields.summary}
${doc.fields.description ? `Description: ${doc.fields.description}` : ''}
Status: ${doc.fields.status?.name || 'To Do'}
Priority: ${doc.fields.priority?.name || 'None'}
Assignee: ${doc.fields.assignee?.displayName || 'Unassigned'}
Reporter: ${doc.fields.reporter?.displayName || 'Unknown'}

---COMMENTS---
${comments}
  `.trim();

  // Initialize state
  const state: AnalysisState = {
    issue: {
      pageContent,
      metadata: { // Create a minimal metadata object for the agents
        key: doc.key,
        title: doc.fields.summary,
        issueUrl: `${process.env.JIRA_HOST}/browse/${doc.key}`,
      }
    },
    context: '', // We'll get this from Context7 via the UI
    businessAnalysis: '',
    architecturalAnalysis: '',
    developmentAnalysis: '',
    qaAnalysis: '',
    recommendations: [],
    questions: [],
  };

  // Run parallel analysis
  const [businessResult, architectResult, developerResult, qaResult] = await Promise.all([
    businessAnalystNode(state),
    architectNode(state),
    developerNode(state),
    qaEngineerNode(state),
  ]);

  // Combine results
  const combinedState: AnalysisState = {
    ...state,
    businessAnalysis: businessResult.businessAnalysis,
    architecturalAnalysis: architectResult.architecturalAnalysis,
    developmentAnalysis: developerResult.developmentAnalysis,
    qaAnalysis: qaResult.qaAnalysis,
    recommendations: [
      ...businessResult.recommendations,
      ...architectResult.recommendations,
      ...developerResult.recommendations,
    ],
  };

  // Extract questions and summary
  const [questionsResult, summaryResult] = await Promise.all([
    questionExtractorNode(combinedState),
    summaryNode(combinedState),
  ]);

  return {
    businessAnalysis: combinedState.businessAnalysis,
    architecturalAnalysis: combinedState.architecturalAnalysis,
    developmentAnalysis: combinedState.developmentAnalysis,
    qaAnalysis: combinedState.qaAnalysis,
    questions: questionsResult.questions,
    recommendations: combinedState.recommendations,
    summary: summaryResult.summary,
  };
} 