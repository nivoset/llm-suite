'use server';

import { z } from 'zod';

// Core Jira field types
export const JiraFieldTypes = {
  string: 'string',
  number: 'number',
  date: 'date',
  datetime: 'datetime',
  user: 'user',
  array: 'array',
  option: 'option',
  component: 'component',
  version: 'version',
  sprint: 'sprint',
  status: 'status',
  priority: 'priority',
  attachment: 'attachment',
} as const;

export type JiraFieldType = keyof typeof JiraFieldTypes;

// Schema for custom field definitions
export const CustomFieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(Object.keys(JiraFieldTypes) as [JiraFieldType, ...JiraFieldType[]]),
  description: z.string().optional(),
  required: z.boolean().optional(),
  defaultValue: z.any().optional(),
  options: z.array(z.string()).optional(), // For option/select fields
});

export type CustomField = z.infer<typeof CustomFieldSchema>;

// Configuration for the Jira client
export interface JiraConfig {
  host: string;
  username: string;
  accessToken: string;
  customFields?: CustomField[];
}

class JiraClient {
  private host: string;
  private username: string;
  private accessToken: string;
  private customFields: Map<string, CustomField>;

  constructor(config: JiraConfig) {
    this.host = config.host.startsWith('http') ? config.host : `https://${config.host}`;
    this.username = config.username;
    this.accessToken = config.accessToken;
    this.customFields = new Map(
      (config.customFields || []).map(field => [field.id, field])
    );
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.host}/rest/api/2${endpoint}`;
    const headers = {
      'Authorization': `Basic ${Buffer.from(`${this.username}:${this.accessToken}`).toString('base64')}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Jira API Error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  // Get issue details with custom field support
  async getIssue(issueKey: string, expand: string[] = []): Promise<any> {
    const expandString = expand.length > 0 ? `&expand=${expand.join(',')}` : '';
    return this.fetch(`/issue/${issueKey}?fields=*all${expandString}`);
  }

  // Update issue fields
  async updateIssue(issueKey: string, fields: Record<string, any>): Promise<void> {
    await this.fetch(`/issue/${issueKey}`, {
      method: 'PUT',
      body: JSON.stringify({ fields }),
    });
  }

  // Get custom field information
  async getCustomFields(): Promise<CustomField[]> {
    const fields = await this.fetch<any[]>('/field');
    return fields
      .filter(field => field.custom)
      .map(field => ({
        id: field.id,
        name: field.name,
        type: this.mapJiraTypeToFieldType(field.schema.type),
        description: field.description,
      }));
  }

  // Get available transitions for an issue
  async getTransitions(issueKey: string): Promise<any[]> {
    const response = await this.fetch<any>(`/issue/${issueKey}/transitions`);
    return response.transitions;
  }

  // Transition an issue to a new status
  async transitionIssue(issueKey: string, transitionId: string, fields?: Record<string, any>): Promise<void> {
    await this.fetch(`/issue/${issueKey}/transitions`, {
      method: 'POST',
      body: JSON.stringify({
        transition: { id: transitionId },
        fields,
      }),
    });
  }

  // Add a comment to an issue
  async addComment(issueKey: string, body: string): Promise<any> {
    return this.fetch(`/issue/${issueKey}/comment`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
  }

  // Add an attachment to an issue
  async addAttachment(issueKey: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.fetch(`/issue/${issueKey}/attachments`, {
      method: 'POST',
      headers: {
        'X-Atlassian-Token': 'no-check',
        // Remove Content-Type to let browser set it with boundary
        'Content-Type': undefined as any,
      },
      body: formData,
    });
  }

  // Helper method to map Jira field types to our custom field types
  private mapJiraTypeToFieldType(jiraType: string): JiraFieldType {
    const typeMap: Record<string, JiraFieldType> = {
      'string': 'string',
      'number': 'number',
      'datetime': 'datetime',
      'date': 'date',
      'user': 'user',
      'array': 'array',
      'option': 'option',
      'component': 'component',
      'version': 'version',
      // Add more mappings as needed
    };

    return typeMap[jiraType] || 'string';
  }
}

// Create and export a singleton instance
const jiraClient = new JiraClient({
  host: process.env.JIRA_HOST!,
  username: process.env.JIRA_USERNAME!,
  accessToken: process.env.JIRA_ACCESS_TOKEN!,
});

export default jiraClient; 