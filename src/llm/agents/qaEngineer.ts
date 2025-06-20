import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { model } from "../model";
import type { AnalysisState } from '../analysis-types';
import { qaAnalysisSchema } from '../schemas';
import { PERSONAS } from '../personas';

export async function qaEngineerNode(state: AnalysisState) {
  const systemPrompt = new SystemMessage(`You are a ${PERSONAS.QA_ENGINEER.role} with expertise in:
- ${PERSONAS.QA_ENGINEER.expertise}

Analyze the Jira issue from a testing perspective, focusing on:
1.  **Testability**: How can the proposed changes be effectively tested? Are there any parts that will be difficult to test?
2.  **Test Plan**: Outline a high-level test plan, including types of testing (e.g., unit, integration, end-to-end, regression).
3.  **Acceptance Criteria**: Define a clear, specific, and verifiable list of acceptance criteria that must be met for the issue to be considered 'done'.
4.  **Risks**: What are the primary risks from a quality and regression standpoint?

Your output should provide a clear path for verifying the functionality and quality of the implemented changes.

Context from internal systems:
${state.context}
`);

  const humanPrompt = new HumanMessage(`Please analyze this Jira issue:
Title: ${state.issue.metadata.title}
Description: ${state.issue.metadata.description || 'No description provided'}
Components: ${state.issue.metadata.components?.join(', ') || 'None'}`);

  const response = await model.withStructuredOutput(qaAnalysisSchema).invoke([systemPrompt, humanPrompt]);
  
  return {
    qaAnalysis: `
### Testing Perspective
${response.analysis}

### Test Plan
${response.testPlan}

### Acceptance Criteria
${response.acceptanceCriteria.map((ac: string) => `- ${ac}`).join('\n')}
`,
    recommendations: [], // QA doesn't add to general recommendations, but could add to a specific QA list
  };
} 