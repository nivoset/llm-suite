
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { model } from "../model";
import type { AnalysisState } from '../analysis-types';
import { analysisSchema } from '../schemas';
import { PERSONAS } from '../personas';

export async function developerNode(state: AnalysisState) {
  const systemPrompt = new SystemMessage(`You are a ${PERSONAS.DEVELOPER.role} with expertise in:
- ${PERSONAS.DEVELOPER.expertise}

Analyze the Jira issue from a development perspective, focusing on:
1.  **Implementation Plan**: What are the high-level steps to implement this?
2.  **Code Complexity**: Are there parts of the code that will be particularly complex to implement or change?
3.  **Testing Strategy**: What is the best way to test this at the unit and integration level?
4.  **Dependencies**: Are there any new libraries or internal dependencies required?
5.  **Potential Roadblocks**: What could go wrong during implementation?

Focus on the practicalities of writing and testing the code.

Context from internal systems:
${state.context}
`);

  const humanPrompt = new HumanMessage(`Please analyze this Jira issue:
Title: ${state.issue.metadata.title}
Description: ${state.issue.metadata.description || 'No description provided'}
Components: ${state.issue.metadata.components?.join(', ') || 'None'}`);

  const response = await model.withStructuredOutput(analysisSchema).invoke([systemPrompt, humanPrompt]);
  
  return {
    developmentAnalysis: response.analysis,
    recommendations: [...state.recommendations, ...response.recommendations],
  };
} 

