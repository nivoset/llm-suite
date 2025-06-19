'use server';

import { z } from 'zod';
import jiraClient from './client';
import type { CustomField } from './client';

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
}

export class JiraCardService {
  // Get card details with custom fields
  static async getCard(issueKey: string): Promise<CardOperationResult> {
    try {
      const issue = await jiraClient.getIssue(issueKey, ['changelog', 'transitions']);
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
      
      // Handle custom fields
      if (input.customFields) {
        Object.entries(input.customFields).forEach(([fieldId, value]) => {
          fields[fieldId] = value;
        });
      }

      const response = await jiraClient.fetch('/issue', {
        method: 'POST',
        body: JSON.stringify({ fields }),
      });

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
      
      // Handle custom fields
      if (input.customFields) {
        Object.entries(input.customFields).forEach(([fieldId, value]) => {
          fields[fieldId] = value;
        });
      }

      await jiraClient.updateIssue(issueKey, fields);

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

  // Transition a card to a new status
  static async transitionCard(issueKey: string, transitionId: string, fields?: Record<string, any>): Promise<CardOperationResult> {
    try {
      await jiraClient.transitionIssue(issueKey, transitionId, fields);
      return {
        success: true,
        key: issueKey,
        message: 'Card transitioned successfully',
      };
    } catch (error) {
      console.error('Error transitioning card:', error);
      return {
        success: false,
        message: 'Failed to transition card',
        error,
      };
    }
  }

  // Add a comment to a card
  static async addComment(issueKey: string, comment: string): Promise<CardOperationResult> {
    try {
      await jiraClient.addComment(issueKey, comment);
      return {
        success: true,
        key: issueKey,
        message: 'Comment added successfully',
      };
    } catch (error) {
      console.error('Error adding comment:', error);
      return {
        success: false,
        message: 'Failed to add comment',
        error,
      };
    }
  }

  // Add an attachment to a card
  static async addAttachment(issueKey: string, file: File): Promise<CardOperationResult> {
    try {
      await jiraClient.addAttachment(issueKey, file);
      return {
        success: true,
        key: issueKey,
        message: 'Attachment added successfully',
      };
    } catch (error) {
      console.error('Error adding attachment:', error);
      return {
        success: false,
        message: 'Failed to add attachment',
        error,
      };
    }
  }
}

export default JiraCardService; 