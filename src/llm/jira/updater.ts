'use server';

import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { model } from '../model';
import { updateIssue, addComment } from './client';
import { type JiraIssue } from '~/llm/jira';
import { z } from 'zod'

interface QuestionAnswer {
  question: string;
  answer: string;
  category: string;
}

const updateSchema = z.object({
  description: z.string().nullish().describe('The updated description of the issue, use atlassian markdown for all formatting.'),
  comments: z.array(z.string()).nullish().describe('An array of comments to add to the issue.'),
  fields: z.record(z.any()).nullish().describe('An object containing the fields to update (e.g., {"summary": "New summary", "priority": {"name": "High"}}).'),
});

export async function updateJiraFromAnswers(jiraCard: JiraIssue, answers: QuestionAnswer[]) {


  const systemPrompt = new SystemMessage(`
    You are a Jira Integration Specialist responsible for updating Jira issues based on provided answers to key questions.

Your task is to:
1. Analyze the answers to key questions about a Jira issue
2. Generate appropriate updates to the issue description and fields
3. Create relevant comments to document the updates
4. Ensure all important information is properly integrated

Focus on:
- Maintaining existing issue structure and formatting
- Adding new information in a clear, organized way
- Creating concise but informative comments
- Preserving existing content while adding new insights

Output a structured response with:
- Updated description (incorporating new information)
- Comments to be added (explaining changes)
- Fields to be updated (if applicable)
`);

  const answersText = answers.map(a => 
    `[${a.category}] ${a.question}\nAnswer: ${a.answer}`
  ).join('\n\n');

  const humanPrompt = new HumanMessage(`Please process these answers and generate Jira updates:

Current Issue:
Title: ${jiraCard.fields.summary}
Key: ${jiraCard.key}
Description: ${jiraCard.fields.description || 'No description provided'}
Valid fields: ${Object.keys(jiraCard.fields).join(', ')}

Formatting:
- Format your output using Atlassian Markdown syntax (e.g., *italic*, **bold**, \`monospace\`, ||table headers||, etc.).
- Use bullet lists (-), numbered lists (#), and headings (h1. h2. h3.) where appropriate.
- Use gherkin for all acceptance criteria.
- All formatting should be done using atlassian markdown syntax.

Provided Answers:
${answersText}
`);

  const response = await model.withStructuredOutput(updateSchema).invoke([
    systemPrompt,
    humanPrompt
  ]);

  // Apply the updates
  try {
    // Update description and fields
    await updateIssue(jiraCard.key, {
      description: response.description,
      ...response.fields,
    });

    // Add comments
    for (const comment of response.comments || []) {
      await addComment(jiraCard.key, comment);
    }

    return true;
  } catch (error) {
    console.error('Failed to update Jira:', error);
    throw error;
  }
} 