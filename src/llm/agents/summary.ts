import { PromptTemplate } from "@langchain/core/prompts";
import { model } from "../model";
import type { AnalysisState } from '../analysis-types';
import { z } from "zod";

const summarySchema = z.object({
  executiveSummary: z.string().describe("A concise executive summary of all analyses."),
  conflictingRecommendations: z.array(z.string()).describe("Any conflicting recommendations or open questions."),
  actionableTakeaway: z.string().describe("The clear 'so what?' for the reader."),
});

export async function summaryNode(state: AnalysisState) {
  const prompt = PromptTemplate.fromTemplate(`
You are a senior technical product manager tasked with synthesizing analysis from different perspectives into a clear, actionable overview.

Given the following detailed analyses, create a concise executive summary that:
1. Highlights the most important insights across all perspectives
2. Identifies any conflicting recommendations or open questions
3. Provides a clear "so what?" for the reader

Do not simply list the outputs from each role. Synthesize them.

Business Analysis:
{businessAnalysis}

Architectural Analysis:
{architecturalAnalysis}

Development Analysis:
{developmentAnalysis}

QA Analysis:
{qaAnalysis}

Format your response as a JSON object that strictly follows the provided schema.
`);

  const structuredLLM = model.withStructuredOutput(summarySchema);

  const response = await prompt
    .pipe(structuredLLM)
    .invoke({
      businessAnalysis: state.businessAnalysis,
      architecturalAnalysis: state.architecturalAnalysis,
      developmentAnalysis: state.developmentAnalysis,
      qaAnalysis: state.qaAnalysis,
    });
  
  return {
    summary: `
### Executive Summary
${response.executiveSummary}

### Conflicting Recommendations
${response.conflictingRecommendations.map(r => `- ${r}`).join('\\n')}

### Actionable Takeaway
${response.actionableTakeaway}
    `.trim(),
  };
} 