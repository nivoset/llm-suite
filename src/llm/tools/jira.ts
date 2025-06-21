import { DynamicStructuredTool } from '@langchain/core/tools';
import { getIssue, addComment, updateIssue } from '~/llm/jira/client';
import { z } from 'zod';
import { webBrowserTool } from './web';

export const getJiraIssueCommentsTool = new DynamicStructuredTool({
  name: 'get_jira_issue_comments',
  description: 'Fetches all comments for a specific Jira issue.',
  schema: z.object({
    issueKey: z.string().describe("The key of the Jira issue (e.g., 'PROJ-123')."),
  }),
  func: async ({ issueKey }) => {
    try {
      const issue = await getIssue(issueKey, ['comment']);
      const comments = issue.fields.comment.comments.map((c: any) => ({
        author: c.author.displayName,
        created: c.created,
        body: c.body,
      }));
      return JSON.stringify(comments, null, 2);
    } catch (error: any) {
      return `Failed to get comments for issue ${issueKey}: ${error.message}`;
    }
  },
});

export const addJiraCommentTool = new DynamicStructuredTool({
  name: 'add_jira_comment',
  description: 'Adds a new comment to a specific Jira issue.',
  schema: z.object({
    issueKey: z.string().describe("The key of the Jira issue (e.g., 'PROJ-123')."),
    comment: z.string().describe('The content of the comment to add.'),
  }),
  func: async ({ issueKey, comment }) => {
    try {
      await addComment(issueKey, comment);
      return `Successfully added comment to issue ${issueKey}.`;
    } catch (error: any) {
      return `Failed to add comment to issue ${issueKey}: ${error.message}`;
    }
  },
});

export const updateJiraIssueTool = new DynamicStructuredTool({
  name: 'update_jira_issue_fields',
  description: 'Updates specific fields of a Jira issue, such as summary, priority, or assignee. Do NOT use this to update the main description or to add comments.',
  schema: z.object({
    issueKey: z.string().describe("The key of the Jira issue (e.g., 'PROJ-123')."),
    fields: z.record(z.any()).describe('An object containing the fields to update (e.g., {"summary": "New summary", "priority": {"name": "High"}}).'),
  }),
  func: async ({ issueKey, fields }) => {
    try {
      await updateIssue(issueKey, { fields });
      return `Successfully updated issue ${issueKey}.`;
    } catch (error: any) {
      return `Failed to update issue ${issueKey}: ${error.message}`;
    }
  },
});

export const updateJiraIssueContentTool = new DynamicStructuredTool({
  name: 'update_jira_issue_content',
  description: "Use this tool to suggest a replacement for the main content or description of a Jira issue. The entire description will be overwritten with the new content. The user will be asked to confirm the change.",
  schema: z.object({
    issueKey: z.string().describe("The key of the Jira issue (e.g., 'PROJ-123')."),
    newContent: z.string().describe("The full, new content for the issue's description.")
  }),
  func: async ({ newContent }) => {
    // Instead of updating, we now return a structured message
    // that the client-side code will use to trigger the UI update.
    return JSON.stringify({
      suggestedContent: newContent
    });
  }
});

export const jiraTools = [getJiraIssueCommentsTool, addJiraCommentTool, updateJiraIssueTool, updateJiraIssueContentTool, webBrowserTool];
