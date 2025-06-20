'use server';

import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { PromptTemplate } from '@langchain/core/prompts';
import { model } from '../model';
import { updateIssue, addComment } from './client';
import type { JiraDocument } from '~/types/jira';

interface QuestionAnswer {
  question: string;
  answer: string;
  category: string;
}

export async function updateJiraFromAnswers(jiraCard: JiraDocument, answers: QuestionAnswer[]) {
  // Define schema inside the function to avoid exporting it
  const updateSchema = {
    description: "string",
    comments: "string[]",
    fields: "Record<string, any>"
  };

  const systemPrompt = new SystemMessage(`You are a Jira Integration Specialist responsible for updating Jira issues based on provided answers to key questions.

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
Title: ${jiraCard.metadata.title}
Key: ${jiraCard.metadata.key}
Description: ${jiraCard.metadata.description || 'No description provided'}

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
    await updateIssue(jiraCard.metadata.key, {
      description: response.description,
      ...response.fields
    });

    // Add comments
    for (const comment of response.comments) {
      await addComment(jiraCard.metadata.key, comment);
    }

    return true;
  } catch (error) {
    console.error('Failed to update Jira:', error);
    throw error;
  }
} 