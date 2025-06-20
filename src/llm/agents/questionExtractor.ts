import { PromptTemplate } from "@langchain/core/prompts";
import { model } from "../model";
import { questionsSchema } from '../schemas';
import type { AnalysisState } from "../analysis-types";

export async function questionExtractorNode(state: AnalysisState) {
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