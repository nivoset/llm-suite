'use server'

import z from 'zod';
import type { JiraDocument } from '../types/jira';
import { architectNode } from './agents/architect';
import { businessAnalystNode } from './agents/businessAnalyst';
import { developerNode } from './agents/developer';
import { qaEngineerNode } from './agents/qaEngineer';
import { questionExtractorNode } from './agents/questionExtractor';
import { summaryNode } from './agents/summary';
import type { AnalysisState, AnalysisResult } from './analysis-types';


export async function analyzeJiraEpic(doc: JiraDocument): Promise<AnalysisResult> {
  // Initialize state
  const state: AnalysisState = {
    issue: doc,
    context: "", // We'll get this from Context7 via the UI
    businessAnalysis: "",
    architecturalAnalysis: "",
    developmentAnalysis: "",
    qaAnalysis: "",
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