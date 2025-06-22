import {
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { model } from '~/llm/model';
import { AnalysisState } from '../analysis-types';
import { PERSONAS } from '../personas';
import { analysisSchema } from '../schemas';

export async function businessAnalystNode(state: AnalysisState) {
  const llm = model;

  const systemMessage = new SystemMessage(
    `You are a ${PERSONAS.BUSINESS_ANALYST.role}.
Using the provided text, which may include a Jira issue and tool results, perform a detailed business analysis.
Analyze the Jira issue from a business perspective, focusing on:
1.  **Business Value**: What is the core business problem this issue solves?
2.  **User Impact**: How does this change affect the user's workflow or experience?
3.  **Requirements Clarity**: Are the requirements clear, complete, and actionable?
4.  **Success Metrics**: How will we measure the success of this change?
5.  **Stakeholder Alignment**: Does this align with the stated goals of the project stakeholders?
6.  **Risks**: What are the potential risks or dependencies associated with this issue?

When you have all the information you need, provide your analysis. Focus on the 'why' behind the issue and its impact on the business and users.
Format the output as a JSON object matching the required schema.`
  );

  const humanMessage = new HumanMessage(`Please analyze this Jira issue:
Title: ${state.issue.metadata.title}
Description: ${state.issue.metadata.description || 'No description provided'}
Components: ${state.issue.metadata.components?.join(', ') || 'None'}
Context from internal systems: ${state.context}`);

  const modelWithStructuredOutput = llm.withStructuredOutput(analysisSchema);
  const response = await modelWithStructuredOutput.invoke([
    systemMessage,
    humanMessage,
  ]);

  return {
    businessAnalysis: response.analysis,
    recommendations: response.recommendations,
  };
}
