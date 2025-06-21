import {
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { model } from '~/llm/model';
import { webSearchTool } from '~/llm/tools/web';
import { AnalysisState } from '../analysis-types';
import { PERSONAS } from '../personas';
import { analysisSchema } from '../schemas';

export async function businessAnalystNode(state: AnalysisState) {
  const llm = model;
  const modelWithTools = llm.bindTools([webSearchTool]);

  const systemMessage = new SystemMessage(
    `You are a ${PERSONAS.BUSINESS_ANALYST.role}. 
Your task is to analyze the provided Jira issue.
If the issue description is vague or lacks context, use the web search tool to find more information.
Based on the information, first decide if you need to call a tool.
Then, provide a business analysis focusing on Business Value, User Impact, and Success Metrics.`
  );

  const humanMessage = new HumanMessage(`Please analyze this Jira issue:
Title: ${state.issue.metadata.title}
Description: ${state.issue.metadata.description || 'No description provided'}
Components: ${state.issue.metadata.components?.join(', ') || 'None'}
Context from internal systems: ${state.context}`);

  const toolDecision = await modelWithTools.invoke([
    systemMessage,
    humanMessage,
  ]);

  let finalContent: string;

  if (toolDecision.tool_calls && toolDecision.tool_calls.length > 0) {
    const toolCall = toolDecision.tool_calls[0];
    console.log(`Business Analyst is calling a tool: ${toolCall.name}`, toolCall.args)
    const toolResult = await webSearchTool.invoke({ query: toolCall.args.query as string });
    finalContent = `Original Issue:
${humanMessage.content}

Tool Results:
\`\`\`json
${JSON.stringify(toolResult, null, 2)}
\`\`\`

Please now perform the business analysis based on the original issue and these results.`;
  } else {
    finalContent = humanMessage.content as string;
  }

  const finalSystemMessage = new SystemMessage(
    `You are a ${PERSONAS.BUSINESS_ANALYST.role}.
Using the provided text, which may include a Jira issue and tool results, perform a detailed business analysis.
Analyze the Jira issue from a business perspective, focusing on:
1.  **Business Value**: What is the core business problem this issue solves?
2.  **User Impact**: How does this change affect the user's workflow or experience?
3.  **Requirements Clarity**: Are the requirements clear, complete, and actionable?
4.  **Success Metrics**: How will we measure the success of this change?
5.  **Stakeholder Alignment**: Does this align with the stated goals of the project stakeholders?

When you have all the information you need, provide your analysis. Focus on the 'why' behind the issue and its impact on the business and users.
Format the output as a JSON object matching the required schema.`
  );

  const finalHumanMessage = new HumanMessage(finalContent);
  
  const modelWithStructuredOutput = llm.withStructuredOutput(analysisSchema);
  const response = await modelWithStructuredOutput.invoke([
    finalSystemMessage,
    finalHumanMessage,
  ]);

  return {
    businessAnalysis: response.analysis,
    recommendations: response.recommendations,
  };
}
