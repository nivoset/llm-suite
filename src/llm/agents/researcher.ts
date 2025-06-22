import z from "zod";
import { model, thinkingModel } from "../model";
import { addToContext } from "../context";
import { PromptTemplate } from "@langchain/core/prompts";
import { pipeline } from "../../pipeline";
import { PERSONAS } from "../personas";


const personaSchema = z.object({
  role: z.string(),
  expertise: z.string(),
  focus: z.string(),
});

const jiraIssueSchema = z.object({
  title: z.string().nullish(),
  description: z.string().nullish(),
  components: z.array(z.string()).nullish(),
  acceptanceCriteria: z.string().array().nullish(),
  linkedIssues: z.array(z.string()).nullish(),
  labels: z.array(z.string()).nullish(),
  priority: z.string().nullish(),
  epicLink: z.string().nullish(),
})

const questionSchema = z.object({
  type: z.enum(['engineering', 'business', 'testing', 'development', 'architecture']).or(z.string()).describe("the type of question"),
  question: z.string().describe("the question that needs to be answered"),
})


const researchResultsSchema = z.object({
  questions: questionSchema.array().describe("the questions that need to be answered to complete the jira issue"),
  analysis: z.string().describe("a detailed analysis of the jira issue and the research topics and understanding of the jira issue"),
  acceptanceCriteria: z.string().array().describe("the acceptance criteria for the jira issue you think we need to add to the epic"),
  researchTopics: z.string().array().describe("the research topics for the jira issue you think we need to add to the epic"),
});


const researcherStateSchema = z.object({
  persona: personaSchema,
  jiraIssue: jiraIssueSchema,
  researchTopics: z.string().array().optional(),
  context: z.string().array().optional(),
  results: researchResultsSchema.optional()
})

type ResearcherState = z.infer<typeof researcherStateSchema>

const researcherNode = async (state: ResearcherState) => {
  const { persona, jiraIssue } = state;
  const prompt = PromptTemplate.fromTemplate(`
    As a {role} with expertise in {expertise}, focusing on {focus},
    analyze the following Jira issue and identify key research topics to ensure a comprehensive understanding for implementation.

    Jira Issue Details:
    Title: {title}
    Description: {description}
    Components: {components}
    Acceptance Criteria: {acceptanceCriteria}

    Based on your persona, what are the primary questions you would ask, and what specific topics would you research
    to address the requirements and potential challenges of this issue?
  `);

  const { researchTopics, questions } = await prompt.pipe(thinkingModel.withStructuredOutput(z.object({
    researchTopics: z.string().array().describe("topics to research to be used in duckduckgo search"),
    questions: questionSchema.array().describe("the questions that need to be answered to complete the jira issue"),
  }))).invoke({
    role: persona.role!,
    expertise: persona.expertise!,
    focus: persona.focus!,
    title: jiraIssue.title! || '',
    description: jiraIssue.description! || 'no description',
    components: jiraIssue.components?.join(', ') || '',
    acceptanceCriteria: jiraIssue.acceptanceCriteria?.join('\r\n') || '',
  });

  return {
    ...state,
    researchTopics,
    questions,
  };
}

const webSearchIntegration = async (state: ResearcherState) => {
  // const { researchTopics } = state;
  // if (!researchTopics) {
  //   return { ...state, context: [] };
  // }

  // const searchResults = await Promise.allSettled(
  //   researchTopics.map(async (topic) => {
  //     const result = await webSearchTool.invoke({ query: topic });
  //     return { ...state, topic, result };
  //   })
  // );

  // const context = searchResults.map((result) => {
  //   if (result.status === 'fulfilled') {
  //     return `Topic: ${result.value.topic}\n${result.value.result}`;
  //   }
  //   return `Topic failed with error: ${result.reason}`;
  // });
  // return { ...state, context };
  return { ...state, context: [] };
}

const documentLoader = async (state: ResearcherState) => {
  const { context } = state;
  if (!context) {
    return state;
  }
  await Promise.all(
    context.map(async (content) => {
      await addToContext(content, { source: 'web-search' });
    })
  );
  return { ...state, context };
}

const researchPlan = async (state: ResearcherState) => {
  const { persona, jiraIssue, results, context } = state;
  const prompt = `
    As a ${persona.role}, you have conducted initial research on the Jira issue: "${jiraIssue.title}".
    
    Initial Analysis:
    ${results?.analysis}

    Questions:
    ${results?.questions.map(q => `Type: ${q.type}\nQuestion: ${q.question}`).join('\n')}

    Web Search Results:
    ${context?.join('\n\n')}

    Based on this new context, refine your research plan. 
    What are the remaining open questions? 
    What new research topics should be explored?
    Update the analysis and acceptance criteria based on what you have learned.
  `;

  const analysis = await model.withStructuredOutput(researchResultsSchema).invoke(prompt);


  return { ...state, results: analysis };
}

const researchReport = async (state: ResearcherState) => {
  const { results } = state;

  if (!results || !results.questions || results.questions.length === 0) {
    return { results };
  }
  console.log('**** Questions', results.questions)
  const gherkinSchema = z.object({
    acceptanceCriteria: z.string().array().describe("An array of acceptance criteria in Gherkin syntax. e.g. 'Given [some context], When [some action], Then [some outcome].'"),
  });

  const prompt = `Based on the following unanswered research questions, please generate acceptance criteria in clean Gherkin format (Given/When/Then).
These acceptance criteria will be added to a Jira ticket to ensure the research tasks are completed.

Unanswered Questions:
- ${results.questions.map(q => `Type: ${q.type}\nQuestion: ${q.question}`).join('\n- ')}

Generate a list of acceptance criteria based on these questions.`;

  const response = await thinkingModel.withStructuredOutput(gherkinSchema).invoke(prompt);

  const updatedResults: z.infer<typeof researchResultsSchema> = {
    analysis: results.analysis,
    researchTopics: results.researchTopics,
    acceptanceCriteria: [...results.acceptanceCriteria, ...response.acceptanceCriteria],
    questions: results.questions,
  };

  return { ...state, results: updatedResults };
}


const researcherPipeline = pipeline(researcherStateSchema)
  .then('research',researcherNode)
  .parallel({ webSearchIntegration, documentLoader })
  .then(async ({ webSearchIntegration, documentLoader }) => {
    return {
      ...webSearchIntegration,
      context: [...(documentLoader?.context || []),
      ...(webSearchIntegration?.context || [])] };
  })
  .then('researchPlan', researchPlan)
  .then('researchReport', researchReport)
  .compile()
export const generateResearcher = (persona: z.infer<typeof personaSchema>) => {
  return async (jiraIssue: z.infer<typeof jiraIssueSchema>) => {
    const { results } = await researcherPipeline.invoke({
      persona,
      jiraIssue,
    })
    console.log(results)
    return results
  }
}

// export const debugResearcher = generateResearcher({
//   role: 'researcher',
//   expertise: 'researcher',
//   focus: 'researcher',
// })


// const results = await debugResearcher({
//   title: 'Add a new feature to the website',
//   description: 'We need to add a new feature to the website',
//   components: ['website'],
//   acceptanceCriteria: ['The website should have a new feature'],
// })

// console.log('test', results)



export const developerPipeline = generateResearcher(PERSONAS.DEVELOPER)
export const architectPipeline = generateResearcher(PERSONAS.ARCHITECT)
export const anaylystPipeline = generateResearcher(PERSONAS.BUSINESS_ANALYST)
export const qaPipeline = generateResearcher(PERSONAS.QA_ENGINEER)







