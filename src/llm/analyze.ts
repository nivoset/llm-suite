'use server'

import type { JiraDocument } from '~/types/jira';
import { architectNode } from './agents/architect';
import { businessAnalystNode } from './agents/businessAnalyst';
import { developerNode } from './agents/developer';
import { qaEngineerNode } from './agents/qaEngineer';
import { summaryNode } from './agents/summary';
import type { AnalysisState, AnalysisResult } from './analysis-types';
import { getIssue } from './jira/client';
import { questionExtractorNode } from './agents/questionExtractor';

export async function analyzeJiraEpic(doc: JiraDocument): Promise<AnalysisResult> {
  const issueWithComments = await getIssue(doc.metadata.key, ['comment']);
  const comments =
    issueWithComments.fields.comment?.comments
      .map((c: any) => `[${c.author.displayName} on ${c.created}]: ${c.body}`)
      .join('\n\n') || 'No comments yet.';

  const docWithComments: JiraDocument = {
    ...doc,
    pageContent: `${doc.pageContent}\n\n---COMMENTS---\n${comments}`,
  };

  // Initialize state
  const state: AnalysisState = {
    issue: docWithComments,
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