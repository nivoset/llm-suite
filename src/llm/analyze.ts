'use server'

import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { PromptTemplate } from '@langchain/core/prompts';
import { JiraIssue, JiraDocument } from '../types/jira';
import { model } from './model';
import { z } from 'zod';

// Expert personas for analysis
const PERSONAS = {
  BUSINESS_ANALYST: {
    role: "Business Analyst",
    expertise: "Requirements analysis, process optimization, stakeholder communication",
    focus: "Business value, user needs, process improvements"
  },
  ARCHITECT: {
    role: "Solution Architect",
    expertise: "System design, technical standards, integration patterns",
    focus: "Architecture, scalability, security, maintainability"
  },
  DEVELOPER: {
    role: "Senior Developer",
    expertise: "Code quality, implementation patterns, technical debt",
    focus: "Code structure, performance, testing, maintainability"
  }
} as const;

// Schema for structured output
const analysisSchema = z.object({
  analysis: z.string().describe("Detailed analysis from the expert's perspective"),
  recommendations: z.array(z.string()).describe("List of specific recommendations"),
  risks: z.array(z.string()).describe("List of potential risks or concerns"),
});

const questionsSchema = z.object({
  questions: z.array(z.string()).describe("An array of 5-7 key questions that need to be answered, ordered by priority. Each question should be prefixed with its primary category: [Business], [Technical], or [Implementation].")
});

// Define the state interface
interface AnalysisState {
  issue: JiraDocument;
  context: string;
  businessAnalysis: string;
  architecturalAnalysis: string;
  developmentAnalysis: string;
  recommendations: string[];
  questions: string[];
  summary?: string;
}

// Define expert nodes
async function businessAnalystNode(state: AnalysisState) {
  const systemPrompt = new SystemMessage(`You are an experienced Business Analyst with expertise in:
- Requirements analysis
- Business process optimization
- Stakeholder management
- Cost-benefit analysis
- Risk assessment

Analyze the Jira issue from a business perspective, focusing on:
1. Business value and impact
2. Stakeholder concerns
3. Process improvements
4. Potential risks
5. Success metrics

Your analysis should be concise and avoid duplicating technical or implementation details that would be better covered by the architect or developer perspectives.

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

async function architectNode(state: AnalysisState) {
  const systemPrompt = new SystemMessage(`You are a seasoned Software Architect with expertise in:
- System design
- Technical debt management
- Scalability planning
- Integration patterns
- Security architecture

Analyze the Jira issue from an architectural perspective, focusing on:
1. Technical approach and system design
2. Integration and dependencies
3. Scalability and performance considerations
4. Security implications
5. Technical risks

Focus on high-level technical decisions and architectural impacts. Avoid duplicating business context or low-level implementation details.

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

async function developerNode(state: AnalysisState) {
  const systemPrompt = new SystemMessage(`You are a Senior Developer with expertise in:
- Code quality
- Implementation complexity
- Testing requirements
- Performance optimization
- Maintainability

Analyze the Jira issue from a development perspective, focusing on:
1. Implementation approach and complexity
2. Testing strategy and requirements
3. Code maintainability considerations
4. Development risks and challenges
5. Technical dependencies

Focus on concrete implementation details and development concerns. Avoid duplicating high-level architectural decisions or business context.

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

async function questionExtractorNode(state: AnalysisState) {
  const prompt = PromptTemplate.fromTemplate(`
Based on the following analyses, identify the key questions that need to be answered.
Group related questions together and eliminate any duplicates.
Focus on questions that bridge multiple perspectives (business, architecture, development).

Business Analysis:
{businessAnalysis}

Architectural Analysis:
{architecturalAnalysis}

Development Analysis:
{developmentAnalysis}

List the top 5-7 most important questions that need to be clarified, ordered by priority.
Each question should be prefixed with its primary category: [Business], [Technical], or [Implementation].
`);

  const response = await prompt
    .pipe(model.withStructuredOutput(questionsSchema))
    .invoke({
      businessAnalysis: state.businessAnalysis,
      architecturalAnalysis: state.architecturalAnalysis,
      developmentAnalysis: state.developmentAnalysis,
    });

  return {
    questions: response.questions,
  };
}

async function summaryNode(state: AnalysisState) {
  const prompt = PromptTemplate.fromTemplate(`
You are a senior technical product manager tasked with synthesizing analysis from different perspectives into a clear, actionable overview.

Given the following detailed analyses, create a concise executive summary that:
1. Highlights the most important insights across all perspectives
2. Identifies key dependencies and relationships
3. Outlines critical success factors
4. Flags major risks or challenges
5. Provides a high-level recommendation

Business Analysis:
{businessAnalysis}

Architectural Analysis:
{architecturalAnalysis}

Development Analysis:
{developmentAnalysis}

Format your response as a concise but comprehensive overview that a stakeholder could quickly read to understand the full scope and implications of this issue.
Focus on synthesizing insights rather than repeating individual points.
`);

  const response = await prompt
    .pipe(model)
    .invoke({
      businessAnalysis: state.businessAnalysis,
      architecturalAnalysis: state.architecturalAnalysis,
      developmentAnalysis: state.developmentAnalysis,
    });

  return {
    summary: response.content.toString(),
  };
}

export interface AnalysisRequest {
  issue: JiraIssue;
  persona: keyof typeof PERSONAS;
}

export interface AnalysisResponse {
  analysis: string;
  recommendations: string[];
  risks: string[];
}

export type AnalysisResult = Pick<AnalysisState, 'businessAnalysis' | 'architecturalAnalysis' | 'developmentAnalysis' | 'questions' | 'recommendations' | 'summary'>;

export async function analyzeJiraEpic(doc: JiraDocument): Promise<AnalysisResult> {
  // Initialize state
  const state: AnalysisState = {
    issue: doc,
    context: "", // We'll get this from Context7 via the UI
    businessAnalysis: "",
    architecturalAnalysis: "",
    developmentAnalysis: "",
    recommendations: [],
    questions: [],
  };

  // Run parallel analysis
  const [businessResult, architectResult, developerResult] = await Promise.all([
    businessAnalystNode(state),
    architectNode(state),
    developerNode(state),
  ]);

  // Update state with results
  state.businessAnalysis = businessResult.businessAnalysis;
  state.architecturalAnalysis = architectResult.architecturalAnalysis;
  state.developmentAnalysis = developerResult.developmentAnalysis;
  state.recommendations = [
    ...businessResult.recommendations,
    ...architectResult.recommendations,
    ...developerResult.recommendations,
  ];

  // Extract questions
  const questionResult = await questionExtractorNode(state);
  state.questions = questionResult.questions;

  // Generate summary
  const summaryResult = await summaryNode(state);
  state.summary = summaryResult.summary;

  return {
    businessAnalysis: state.businessAnalysis,
    architecturalAnalysis: state.architecturalAnalysis,
    developmentAnalysis: state.developmentAnalysis,
    questions: state.questions,
    recommendations: state.recommendations,
    summary: state.summary,
  };
}

export async function analyzeIssue({ issue, persona }: AnalysisRequest): Promise<AnalysisResponse> {
  const selectedPersona = PERSONAS[persona];
  
  const systemPrompt = new SystemMessage(`You are an experienced ${selectedPersona.role} with expertise in ${selectedPersona.expertise}. 
Your task is to analyze this Jira issue from your perspective, focusing on ${selectedPersona.focus}.

Provide your analysis in the following format:
1. A detailed analysis of the issue
2. A list of specific recommendations
3. A list of potential risks or concerns`);

  const humanPrompt = new HumanMessage(`Please analyze this Jira issue:
Title: ${issue.fields.summary}
Description: ${issue.fields.description || 'No description provided'}
Type: ${issue.fields.issuetype.name}
Priority: ${issue.fields.priority?.name || 'Not set'}
Components: ${issue.fields.components?.map(c => c.name).join(', ') || 'None'}`);

  const response = await model.invoke([systemPrompt, humanPrompt]);
  
  if (!(response instanceof AIMessage)) {
    throw new Error('Unexpected response type from model');
  }

  const content = response.content.toString();

  // Parse the response into sections
  const sections = content.split('\n\n');
  const analysis = sections[0] || '';
  const recommendations = sections[1]?.split('\n').filter((line: string) => line.trim().length > 0) || [];
  const risks = sections[2]?.split('\n').filter((line: string) => line.trim().length > 0) || [];

  return {
    analysis,
    recommendations,
    risks
  };
} 