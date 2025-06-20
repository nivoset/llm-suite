import type { JiraDocument } from '../types/jira';

// Define the state interface
export interface AnalysisState {
  issue: JiraDocument;
  context: string;
  businessAnalysis: string;
  architecturalAnalysis: string;
  developmentAnalysis: string;
  qaAnalysis: string;
  recommendations: string[];
  questions: { type: string; question: string }[];
  summary?: string;
}

export type AnalysisResult = Pick<AnalysisState, 'businessAnalysis' | 'architecturalAnalysis' | 'developmentAnalysis' | 'qaAnalysis' | 'questions' | 'recommendations' | 'summary'>; 