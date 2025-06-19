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

// Define the state interface
interface AnalysisState {
  issue: JiraDocument;
  context: string;
  businessAnalysis: string;
  architecturalAnalysis: string;
  developmentAnalysis: string;
  recommendations: string[];
  questions: string[];
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
1. Technical approach
2. System dependencies
3. Scalability considerations
4. Security implications
5. Integration points

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
1. Implementation challenges
2. Testing approach
3. Performance considerations
4. Maintenance concerns
5. Development risks

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
Based on the following analyses, identify the key questions that need to be answered:

Business Analysis:
{businessAnalysis}

Architectural Analysis:
{architecturalAnalysis}

Development Analysis:
{developmentAnalysis}

List the top 5-7 most important questions that need to be clarified, ordered by priority.
Format as a JSON array of strings.
`);

  const response = await prompt
    .pipe(model)
    .invoke({
      businessAnalysis: state.businessAnalysis,
      architecturalAnalysis: state.architecturalAnalysis,
      developmentAnalysis: state.developmentAnalysis,
    });

  return {
    questions: JSON.parse(response.content.toString()),
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

export type AnalysisResult = Pick<AnalysisState, 'businessAnalysis' | 'architecturalAnalysis' | 'developmentAnalysis' | 'questions' | 'recommendations'>;

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

  return {
    businessAnalysis: state.businessAnalysis,
    architecturalAnalysis: state.architecturalAnalysis,
    developmentAnalysis: state.developmentAnalysis,
    questions: state.questions,
    recommendations: state.recommendations,
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