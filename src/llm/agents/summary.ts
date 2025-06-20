import { PromptTemplate } from "@langchain/core/prompts";
import { model } from "../model";
import type { AnalysisState } from '../analysis-types';

export async function summaryNode(state: AnalysisState) {
  const prompt = PromptTemplate.fromTemplate(`
You are a senior technical product manager tasked with synthesizing analysis from different perspectives into a clear, actionable overview.

Given the following detailed analyses, create a concise executive summary that:
1. Highlights the most important insights across all perspectives
2. Identifies any conflicting recommendations or open questions
3. Provides a clear "so what?" for the reader
4. Is formatted in clean markdown.

Do not simply list the outputs from each role. Synthesize them.

Business Analysis:
{businessAnalysis}

Architectural Analysis:
{architecturalAnalysis}

Development Analysis:
{developmentAnalysis}

QA Analysis:
{qaAnalysis}

Format your response as a concise but comprehensive overview that a stakeholder could quickly read to understand the full scope and implications of this issue.
Focus on synthesizing insights rather than repeating individual points.
`);

  const response = await prompt
    .pipe(model)
    .invoke({
      businessAnalysis: state.businessAnalysis,
      architecturalAnalysis: state.architecturalAnalysis,
      developmentAnalysis: state.developmentAnalysis,
      qaAnalysis: state.qaAnalysis,
    });
  
  return {
    summary: response.content.toString(),
  };
} 