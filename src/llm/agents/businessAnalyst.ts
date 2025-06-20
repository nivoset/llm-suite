
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { model } from "../model";
import type { AnalysisState } from '../analysis-types';
import { analysisSchema } from '../schemas';
import { PERSONAS } from '../personas';

export async function businessAnalystNode(state: AnalysisState) {
  const systemPrompt = new SystemMessage(`You are a ${PERSONAS.BUSINESS_ANALYST.role} with expertise in:
- ${PERSONAS.BUSINESS_ANALYST.expertise}

Analyze the Jira issue from a business perspective, focusing on:
1.  **Business Value**: What is the core business problem this issue solves?
2.  **User Impact**: How does this change affect the user's workflow or experience?
3.  **Requirements Clarity**: Are the requirements clear, complete, and actionable?
4.  **Success Metrics**: How will we measure the success of this change?
5.  **Stakeholder Alignment**: Does this align with the stated goals of the project stakeholders?

Focus on the 'why' behind the issue and its impact on the business and users.

Context from internal systems:
${state.context}
`);

  const humanPrompt = new HumanMessage(`Please analyze this Jira issue:
Title: ${state.issue.metadata.title}
Description: ${state.issue.metadata.description || 'No description provided'}
Components: ${state.issue.metadata.components?.join(', ') || 'None'}`);

  const response = await model.withStructuredOutput(analysisSchema).invoke([systemPrompt, humanPrompt]);
  
  return {
    businessAnalysis: response.analysis,
    recommendations: response.recommendations,
  };
} 