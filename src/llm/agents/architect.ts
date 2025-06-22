
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { model } from "../model";
import type { AnalysisState } from '../analysis-types';
import { analysisSchema } from '../schemas';
import { PERSONAS } from '../personas';
import './researcher'

export async function architectNode(state: AnalysisState) {
  const systemPrompt = new SystemMessage(`You are a ${PERSONAS.ARCHITECT.role} with expertise in:
- ${PERSONAS.ARCHITECT.expertise}

Analyze the Jira issue from an architectural perspective, focusing on:
1.  **System Integrity**: How does this change affect the overall system architecture?
2.  **Scalability & Performance**: Are there any potential impacts on scalability or performance?
3.  **Security**: Does this introduce any new security vulnerabilities?
4.  **Maintainability**: How does this affect the long-term maintainability and technical debt of the system?
5.  **Integration**: What are the integration points with other systems or services?

Focus on the high-level technical design and its long-term implications.

Context from internal systems:
${state.context}
`);

  const humanPrompt = new HumanMessage(`Please analyze this Jira issue:
Title: ${state.issue.metadata.title}
Description: ${state.issue.metadata.description || 'No description provided'}
Components: ${state.issue.metadata.components?.join(', ') || 'None'}`);

  const response = await model.withStructuredOutput(analysisSchema).invoke([systemPrompt, humanPrompt]);
  
  return {
    architecturalAnalysis: response.analysis,
    recommendations: [...state.recommendations, ...response.recommendations],
  };
} 