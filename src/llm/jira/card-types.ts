import { z } from 'zod';
import { 
  getIssue as getJiraIssue,
  updateIssue as updateJiraIssue,
  addComment as addJiraComment,
  addAttachment as addJiraAttachment,
  transitionIssue as transitionJiraIssue,
  createIssue
} from './client';

// Schema for card creation/update
export const CardSchema = z.object({
  summary: z.string(),
  description: z.string().optional(),
  issueType: z.string(),
  priority: z.string().optional(),
  assignee: z.string().optional(),
  labels: z.array(z.string()).optional(),
  components: z.array(z.string()).optional(),
  customFields: z.record(z.string(), z.any()).optional(),
});

export type CardInput = z.infer<typeof CardSchema>;

export interface CardOperationResult {
  success: boolean;
  message?: string;
  key?: string;
  error?: any;
  [key: string]: any; // To accommodate issue details
}

export class JiraCardService {
  // Get card details with custom fields
  static async getCard(issueKey: string): Promise<CardOperationResult> {
    try {
      const issue = await getJiraIssue(issueKey, ['changelog', 'transitions']);
      return {
        success: true,
        key: issueKey,
        message: 'Card retrieved successfully',
        ...issue,
      };
    } catch (error) {
      console.error('Error getting card:', error);
      return {
        success: false,
        message: 'Failed to get card details',
        error,
      };
    }
  }

  // Create a new card
  static async createCard(projectKey: string, input: CardInput): Promise<CardOperationResult> {
    try {
      const fields: Record<string, any> = {
        project: { key: projectKey },
        summary: input.summary,
        issuetype: { name: input.issueType },
      };

      if (input.description) fields.description = input.description;
      if (input.priority) fields.priority = { name: input.priority };
      if (input.assignee) fields.assignee = { name: input.assignee };
      if (input.labels) fields.labels = input.labels;
      if (input.components) fields.components = input.components.map(name => ({ name }));
      
      if (input.customFields) {
        Object.entries(input.customFields).forEach(([fieldId, value]) => {
          fields[fieldId] = value;
        });
      }

      const response: any = await createIssue({ fields });

      return {
        success: true,
        key: response.key,
        message: 'Card created successfully',
      };
    } catch (error) {
      console.error('Error creating card:', error);
      return {
        success: false,
        message: 'Failed to create card',
        error,
      };
    }
  }

  // Update an existing card
  static async updateCard(issueKey: string, input: Partial<CardInput>): Promise<CardOperationResult> {
    try {
      const fields: Record<string, any> = {};

      if (input.summary) fields.summary = input.summary;
      if (input.description) fields.description = input.description;
      if (input.priority) fields.priority = { name: input.priority };
      if (input.assignee) fields.assignee = { name: input.assignee };
      if (input.labels) fields.labels = input.labels;
      if (input.components) fields.components = input.components.map(name => ({ name }));
      
      if (input.customFields) {
        Object.entries(input.customFields).forEach(([fieldId, value]) => {
          fields[fieldId] = value;
        });
      }

      await updateJiraIssue(issueKey, fields);

      return {
        success: true,
        key: issueKey,
        message: 'Card updated successfully',
      };
    } catch (error) {
      console.error('Error updating card:', error);
      return {
        success: false,
        message: 'Failed to update card',
        error,
      };
    }
  }

  // Other methods would follow a similar pattern, calling the functions from client.ts
  static async transitionCard(issueKey: string, transitionId: string, fields?: Record<string, any>): Promise<CardOperationResult> {
    try {
      await transitionJiraIssue(issueKey, transitionId, fields);
      return { success: true, key: issueKey, message: 'Card transitioned' };
    } catch (error) {
      return { success: false, message: 'Failed to transition', error };
    }
  }

  static async addComment(issueKey: string, comment: string): Promise<CardOperationResult> {
    try {
      await addJiraComment(issueKey, comment);
      return { success: true, key: issueKey, message: 'Comment added' };
    } catch (error) {
      return { success: false, message: 'Failed to add comment', error };
    }
  }

  static async addAttachment(issueKey: string, file: File): Promise<CardOperationResult> {
    try {
      await addJiraAttachment(issueKey, file);
      return { success: true, key: issueKey, message: 'Attachment added' };
    } catch (error) {
      return { success: false, message: 'Failed to add attachment', error };
    }
  }
} 