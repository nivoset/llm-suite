"use server";

import type { JiraIssue } from "~/llm/jira";
import { architectNode } from "./agents/architect";
import { businessAnalystNode } from "./agents/businessAnalyst";
import { developerNode } from "./agents/developer";
import { qaEngineerNode } from "./agents/qaEngineer";
import { summaryNode } from "./agents/summary";
import type { AnalysisState, AnalysisResult } from "./analysis-types";
import { questionExtractorNode } from "./agents/questionExtractor";
import {
  developerPipeline,
  architectPipeline,
  anaylystPipeline,
  qaPipeline,
} from "./agents/researcher";
import { pipeline } from "../pipeline";
import { z } from "zod";

const analyzeJiraEpicPipeline = pipeline(
  z.object({
    title: z.string().nullish(),
    description: z.string().nullish(),
    components: z.array(z.string()).nullish(),
    acceptanceCriteria: z.string().array().nullish(),
    linkedIssues: z.array(z.string()).nullish(),
    labels: z.array(z.string()).nullish(),
    priority: z.string().nullish(),
    epicLink: z.string().nullish(),
  })
).parallel({
  businessAnalyst: anaylystPipeline,
  architect: architectPipeline,
  developer: developerPipeline,
  qa: qaPipeline,
}).then(async ({ businessAnalyst, architect, developer, qa }, input) => {
    const { title, description, components, acceptanceCriteria, linkedIssues, labels, priority, epicLink } = input;
    const context = `
    Title: ${title}
    Description: ${description}
    Components: ${components?.join(", ")}
    Acceptance Criteria: ${acceptanceCriteria?.join(", ")}
    Linked Issues: ${linkedIssues?.join(", ")}
    Labels: ${labels?.join(", ")}
    `

  return {
    context,
    input,
    results: {
      acceptanceCriteria: [
        ...(acceptanceCriteria || []),
        ...(businessAnalyst?.acceptanceCriteria || []),
        ...(architect?.acceptanceCriteria || []),
        ...(developer?.acceptanceCriteria || []),
        ...(qa?.acceptanceCriteria || []),
      ],
      questions: [
        ...(businessAnalyst?.questions || []),
        ...(architect?.questions || []),
        ...(developer?.questions || []),
        ...(qa?.questions || []),
      ],
      researchTopics: [
        ...(businessAnalyst?.researchTopics || []),
        ...(architect?.researchTopics || []),
        ...(developer?.researchTopics || []),
        ...(qa?.researchTopics || []),
      ],
      analysis: {
        business: businessAnalyst?.analysis,
        architect: architect?.analysis,
        developer: developer?.analysis,
        qa: qa?.analysis,
      }
    }
  }
})
.compile()

export const analyzeJiraEpicPipeline_invoke = async (input: Parameters<typeof analyzeJiraEpicPipeline.invoke>[0]) => analyzeJiraEpicPipeline.invoke(input);

export async function analyzeJiraEpic(doc: JiraIssue): Promise<AnalysisResult> {
  const comments =
    doc.fields.comment?.comments
      ?.map((c: any) => `[${c.author.displayName} on ${c.created}]: ${c.body}`)
      .join("\n\n") || "No comments yet.";

  const pageContent = `
Issue Key: ${doc.key}
Summary: ${doc.fields.summary}
${doc.fields.description ? `Description: ${doc.fields.description}` : ""}
Status: ${doc.fields.status?.name || "To Do"}
Priority: ${doc.fields.priority?.name || "None"}
Assignee: ${doc.fields.assignee?.displayName || "Unassigned"}
Reporter: ${doc.fields.reporter?.displayName || "Unknown"}

---COMMENTS---
${comments}
  `.trim();

  // Initialize state
  const state: AnalysisState = {
    issue: {
      pageContent,
      metadata: {
        // Create a minimal metadata object for the agents
        key: doc.key,
        title: doc.fields.summary,
        issueUrl: `${process.env.JIRA_HOST}/browse/${doc.key}`,
      },
    },
    context: "", // We'll get this from Context7 via the UI
    businessAnalysis: "",
    architecturalAnalysis: "",
    developmentAnalysis: "",
    qaAnalysis: "",
    recommendations: [],
    questions: [],
  };

  // Run parallel analysis
  const [businessResult, architectResult, developerResult, qaResult] =
    await Promise.all([
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
  const [questionsResult, summaryResult] = await Promise.all([
    questionExtractorNode(combinedState),
    summaryNode(combinedState),
  ]);

  return {
    businessAnalysis: combinedState.businessAnalysis,
    architecturalAnalysis: combinedState.architecturalAnalysis,
    developmentAnalysis: combinedState.developmentAnalysis,
    qaAnalysis: combinedState.qaAnalysis,
    questions: questionsResult.questions,
    recommendations: combinedState.recommendations,
    summary: summaryResult.summary,
  };
}
