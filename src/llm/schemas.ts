import { z } from 'zod';

// Schema for structured output
export const analysisSchema = z.object({
  analysis: z.string().describe("Detailed analysis from the expert's perspective"),
  recommendations: z.array(z.string()).describe("List of specific recommendations"),
  risks: z.array(z.string()).describe("List of potential risks or concerns"),
});

export const qaAnalysisSchema = z.object({
  analysis: z.string().describe("Detailed analysis from the QA perspective, focusing on testability and risks."),
  acceptanceCriteria: z.array(z.string()).describe("List of specific, verifiable acceptance criteria for the issue."),
  testPlan: z.string().describe("A high-level test plan outlining the testing strategy."),
});

export const questionsSchema = z.object({
  questions: z.array(z.object({
    type: z.string().describe("The primary category of the question. Must be one of: Business, Technical, Implementation."),
    question: z.string().describe("The key question that needs to be answered.")
  })).describe("An array of 5-7 key questions that need to be answered, ordered by priority.")
}); 