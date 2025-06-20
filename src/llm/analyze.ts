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
  },
  QA_ENGINEER: {
    role: "QA Engineer",
    expertise: "Test planning, test automation, acceptance criteria",
    focus: "Testability, user acceptance testing, regression risks"
  }
} as const;

// Schema for structured output
const analysisSchema = z.object({
  analysis: z.string().describe("Detailed analysis from the expert's perspective"),
  recommendations: z.array(z.string()).describe("List of specific recommendations"),
  risks: z.array(z.string()).describe("List of potential risks or concerns"),
});

const qaAnalysisSchema = z.object({
  analysis: z.string().describe("Detailed analysis from the QA perspective, focusing on testability and risks."),
  acceptanceCriteria: z.array(z.string()).describe("List of specific, verifiable acceptance criteria for the issue."),
  testPlan: z.string().describe("A high-level test plan outlining the testing strategy."),
});

const questionsSchema = z.object({
  questions: z.array(z.object({
    type: z.string().describe("The primary category of the question. Must be one of: Business, Technical, Implementation."),
    question: z.string().describe("The key question that needs to be answered.")
  })).describe("An array of 5-7 key questions that need to be answered, ordered by priority.")
});

// Define the state interface
interface AnalysisState {
  issue: JiraDocument;
  context: string;
  businessAnalysis: string;
  architecturalAnalysis: string;
  developmentAnalysis: string;
  qaAnalysis: string;
  recommendations: string[];
  questions: { type: string; question: string }[];
  summary?: string;
}

// Define expert nodes
async function businessAnalystNode(state: AnalysisState) {
  const systemPrompt = new SystemMessage(`You are an experienced Business Analyst with deep expertise in:

Requirements gathering and analysis

Business process optimization

Stakeholder alignment and communication

Cost-benefit analysis

Risk identification from a business perspective

Analyze the following Jira issue strictly from a business perspective — avoid technical or implementation-level details that fall under architecture or development.

Your analysis should address:

Business Value & Impact:

What tangible value does this issue deliver (e.g., revenue, efficiency, compliance, user satisfaction)?

How does it align with business goals or strategic priorities?

Stakeholder Concerns:

Identify any known or anticipated stakeholder questions, objections, or interests.

Process Improvements:

What business processes are affected?

Will this change improve efficiency, reduce redundancy, or enhance customer experience?

Potential Business Risks:

What are the business-related risks (e.g., operational, reputational, financial)?

Success Metrics:

Define measurable indicators for business success (e.g., KPI improvements, cost savings, adoption rate).

Input:
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
  const systemPrompt = new SystemMessage(`You are a seasoned Software Architect with deep expertise in:

System design and architecture

Managing technical debt and long-term maintainability

Designing for scalability and performance

Defining integration strategies across services and platforms

Security best practices at the architectural level

Analyze the following Jira issue from a high-level architectural perspective.
Avoid business justification or low-level implementation details — focus instead on systemic impacts, architectural strategy, and long-term viability.

Your analysis should cover:

System Design & Technical Approach:

What is the recommended architectural approach?

Does this change align with existing architectural patterns and principles?

Integration & Dependencies:

What systems, services, or APIs are impacted or must be integrated?

Are there potential points of failure or tight coupling introduced?

Scalability & Performance:

Will this change scale with expected usage?

Are there any potential performance bottlenecks or optimization opportunities?

Security Architecture:

What security concerns arise at the architectural level?

Are there any data exposure, access control, or compliance implications?

Technical Risks:

What are the primary risks from a system design perspective?

How might this increase technical debt or reduce flexibility?

Input:
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
  const systemPrompt = new SystemMessage(`You are a Senior Developer with deep expertise in:

Writing high-quality, maintainable code

Estimating and managing implementation complexity

Defining effective testing strategies

Optimizing performance at the code and system level

Managing technical dependencies and reducing fragility

Analyze the following Jira issue from a development perspective.
Your focus should be on practical, code-level considerations that affect implementation, testing, and long-term maintainability.
Do not repeat architectural strategy or business rationale — stay within the scope of hands-on development work.

Your analysis should include:

Implementation Approach & Complexity:

What is the recommended implementation path?

Are there areas of high complexity or ambiguity?

Estimate development effort and any key refactors needed.

Testing Strategy & Requirements:

What types of testing are required (unit, integration, mocking, etc.)?

What edge cases or failure modes need special attention?

Code Maintainability:

How will this impact readability, extensibility, and long-term upkeep?

Are there opportunities to improve modularity or reduce duplication?

Development Risks & Challenges:

What could go wrong during implementation?

Are there blockers, unclear specs, or risky dependencies?

Technical Dependencies:

Identify external systems, libraries, or internal modules that this work relies on.

Note any versioning, compatibility, or stability concerns.

Input:
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

async function qaEngineerNode(state: AnalysisState) {
  const systemPrompt = new SystemMessage(`You are a detail-oriented QA Engineer with deep expertise in:

Designing test strategies and test plans

Manual and automated testing techniques

Writing precise and measurable acceptance criteria

Identifying edge cases, risks, and potential regressions

Conducting performance and security validation

Given a Jira issue, analyze it comprehensively from a QA and test planning perspective.

Instructions:

Testability Assessment: Evaluate how testable the proposed changes are. Identify any components or workflows that may present challenges for effective testing (e.g., lack of observability, 3rd-party dependencies, complexity, etc.).

High-Level Test Plan: Provide a structured test plan outlining:

Relevant test types (unit, integration, system, end-to-end, regression, performance, security, etc.)

Key scenarios or components to be validated under each test type

Acceptance Criteria: Define clear, specific, and verifiable acceptance criteria that must be satisfied for this Jira issue to be considered complete and shippable.

Risk Identification: Highlight major risks and edge cases that could affect quality, regressions, or user experience. Consider data integrity, scalability, performance degradation, backwards compatibility, and test coverage gaps.

Your analysis should provide QA, developers, and product stakeholders with a reliable roadmap to ensure the quality and completeness of the implemented change.

Input: :
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
${response.acceptanceCriteria.map(ac => `- ${ac}`).join('\n')}
`,
  };
}

async function questionExtractorNode(state: AnalysisState) {
  const prompt = PromptTemplate.fromTemplate(`
You are a cross-functional analyst responsible for synthesizing input from business, architecture, development, and QA domains.
Your goal is to surface the most critical, high-impact questions that must be answered to move a project forward.

Instructions:

Input: Analyze the following four perspectives:

Business Analysis: Focus only on business-relevant questions (ignore any tech-specific items).

Architectural Analysis

Development Analysis

QA Analysis

Processing:

Extract all key questions from each analysis.

Group and consolidate similar or duplicate questions.

Highlight questions that bridge multiple disciplines (e.g., where business goals intersect with technical feasibility).

Output:

List the top 5–7 most important questions, sorted by priority.

Prefix each question with its dominant category:

[Business] for strategic, value-driven, or stakeholder-oriented concerns

[Technical] for architecture, scalability, systems, or platform issues

[Implementation] for development, testing, delivery, or execution concerns

The goal is to create a concise list of actionable clarifications that align business intent, technical feasibility, and implementation practicality.

Input Data:

Business Analysis:
{businessAnalysis}

Architectural Analysis:
{architecturalAnalysis}

Development Analysis:
{developmentAnalysis}

QA Analysis:
{qaAnalysis}

List the top 5-7 most important questions that need to be clarified, ordered by priority.
Return the questions as an array of objects, each with a 'type' and 'question' field.
`);

  const response = await prompt
    .pipe(model.withStructuredOutput(questionsSchema))
    .invoke({
      businessAnalysis: state.businessAnalysis,
      architecturalAnalysis: state.architecturalAnalysis,
      developmentAnalysis: state.developmentAnalysis,
      qaAnalysis: state.qaAnalysis,
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

export interface AnalysisRequest {
  issue: JiraIssue;
  persona: keyof typeof PERSONAS;
}

export interface AnalysisResponse {
  analysis: string;
  recommendations: string[];
  risks: string[];
}

export type AnalysisResult = Pick<AnalysisState, 'businessAnalysis' | 'architecturalAnalysis' | 'developmentAnalysis' | 'qaAnalysis' | 'questions' | 'recommendations' | 'summary'>;

export async function analyzeJiraEpic(doc: JiraDocument): Promise<AnalysisResult> {
  // Initialize state
  const state: AnalysisState = {
    issue: doc,
    context: "", // We'll get this from Context7 via the UI
    businessAnalysis: "",
    architecturalAnalysis: "",
    developmentAnalysis: "",
    qaAnalysis: "",
    recommendations: [],
    questions: [],
  };

  // Run parallel analysis
  const [businessResult, architectResult, developerResult, qaResult] = await Promise.all([
    businessAnalystNode(state),
    architectNode(state),
    developerNode(state),
    qaEngineerNode(state),
  ]);

  // Combine results
  const combinedState: AnalysisState = {
    ...state,
    businessAnalysis: businessResult.businessAnalysis,
    architecturalAnalysis: architectResult.architecturalAnalysis,
    developmentAnalysis: developerResult.developmentAnalysis,
    qaAnalysis: qaResult.qaAnalysis,
    recommendations: [
      ...businessResult.recommendations,
      ...architectResult.recommendations,
      ...developerResult.recommendations,
    ],
  };

  // Extract questions and summary
  const questionResult = await questionExtractorNode(combinedState);
  const summaryResult = await summaryNode(combinedState);

  return {
    businessAnalysis: combinedState.businessAnalysis,
    architecturalAnalysis: combinedState.architecturalAnalysis,
    developmentAnalysis: combinedState.developmentAnalysis,
    qaAnalysis: combinedState.qaAnalysis,
    questions: questionResult.questions,
    recommendations: combinedState.recommendations,
    summary: summaryResult.summary,
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