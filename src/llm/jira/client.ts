import type { JiraConfig, CustomField, JiraFieldType } from './types';
import type { JiraProjectLoaderParams } from "@langchain/community/document_loaders/web/jira";

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
    
    if (response.status === 200) {
      return response.json();
    } else {
      return response.text() as unknown as T;
    }

  }

  async getIssue(issueKey: string, expand: string[] = []): Promise<any> {
    const expandString = expand.length > 0 ? `&expand=${expand.join(',')}` : '';
    return this.fetch(`/issue/${issueKey}?fields=*all${expandString}`);
  }

  async updateIssue(issueKey: string, fields: Record<string, any>): Promise<void> {
    await this.fetch(`/issue/${issueKey}`, {
      method: 'PUT',
      body: JSON.stringify({ fields }),
    });
  }

  async getCustomFields(): Promise<CustomField[]> {
    const fields = await this.fetch<any[]>('/field');
    return fields
      .filter(field => field.custom)
      .map(field => ({
        id: field.id,
        name: field.name,
        type: this.mapJiraTypeToFieldType(field.schema.type) as JiraFieldType,
        description: field.description,
      }));
  }

  async getTransitions(issueKey: string): Promise<any[]> {
    const response = await this.fetch<any>(`/issue/${issueKey}/transitions`);
    return response.transitions;
  }

  async transitionIssue(issueKey: string, transitionId: string, fields?: Record<string, any>): Promise<void> {
    await this.fetch(`/issue/${issueKey}/transitions`, {
      method: 'POST',
      body: JSON.stringify({
        transition: { id: transitionId },
        fields,
      }),
    });
  }

  async addComment(issueKey: string, body: string): Promise<any> {
    return this.fetch(`/issue/${issueKey}/comment`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
  }

  async addAttachment(issueKey: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.fetch(`/issue/${issueKey}/attachments`, {
      method: 'POST',
      headers: {
        'X-Atlassian-Token': 'no-check',
        'Content-Type': undefined as any,
      },
      body: formData,
    });
  }

  async createIssue(fields: Record<string, any>): Promise<any> {
    return this.fetch('/issue', {
      method: 'POST',
      body: JSON.stringify({ fields }),
    });
  }

  async getProjects(): Promise<any[]> {
    return this.fetch('/project');
  }

  async getEpics(projectKey: string): Promise<any[]> {
    const jql = `project = "${projectKey}" AND issuetype = Epic`;
    const response = await this.fetch<any>(`/search?jql=${encodeURIComponent(jql)}&fields=summary,status,issuetype,assignee,priority`);
    return response.issues;
  }

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
      'status': 'status',
      'priority': 'priority',
      'attachment': 'attachment',
      'sprint': 'sprint',
    };

    return typeMap[jiraType] || 'string';
  }
}

async function getJiraClient() {
  return new JiraClient({
    host: process.env.JIRA_HOST!,
    username: process.env.JIRA_USERNAME!,
    accessToken: process.env.JIRA_ACCESS_TOKEN!,
  });
}

export async function getIssue(issueKey: string, expand: string[] = []) {
  const client = await getJiraClient();
  return client.getIssue(issueKey, expand);
}

export async function updateIssue(issueKey: string, fields: Record<string, any>) {
  const client = await getJiraClient();
  return client.updateIssue(issueKey, fields);
}

export async function addComment(issueKey: string, body: string) {
  const client = await getJiraClient();
  return client.addComment(issueKey, body);
}

export async function getCustomFields() {
  const client = await getJiraClient();
  return client.getCustomFields();
}

export async function getTransitions(issueKey: string) {
  const client = await getJiraClient();
  return client.getTransitions(issueKey);
}

export async function transitionIssue(issueKey: string, transitionId: string, fields?: Record<string, any>) {
  const client = await getJiraClient();
  return client.transitionIssue(issueKey, transitionId, fields);
}

export async function addAttachment(issueKey: string, file: File) {
  const client = await getJiraClient();
  return client.addAttachment(issueKey, file);
}

export async function createIssue(fields: Record<string, any>) {
  const client = await getJiraClient();
  return client.createIssue(fields);
}

export async function getProjects() {
  const client = await getJiraClient();
  return client.getProjects();
}

export async function getEpics(projectKey: string) {
  const client = await getJiraClient();
  return client.getEpics(projectKey);
}

// Define a basic JiraIssue interface based on what the API returns.
// This can be expanded later if more detailed typing is needed.
export interface JiraIssue {
  id: string;
  key: string;
  expand: string;
  self: string;
  fields: Record<string, any>;
}

/**
 * Fetches Jira issues based on a JQL query.
 * This function communicates directly with the Jira REST API.
 *
 * @param jql The JQL query string.
 * @param params Optional parameters to control the fetch, like `limitPerRequest`.
 * @returns An async generator that yields arrays of Jira issues.
 */
export async function* fetchJiraIssues(
  jql: string,
  params?: Omit<JiraProjectLoaderParams, 'host'|'username'|'accessToken'>,
): AsyncGenerator<JiraIssue[]> {
  const { limitPerRequest = 50 } = params || {};

  const host = process.env.JIRA_HOST;
  const username = process.env.JIRA_USERNAME;
  const accessToken = process.env.JIRA_ACCESS_TOKEN;

  if (!host || !username || !accessToken) {
    throw new Error('Jira host, username, and access token are required and must be set in environment variables.');
  }

  // Ensure the host URL is properly formatted
  const formattedHost = host.startsWith('http') ? host : `https://${host}`;

  const auth = Buffer.from(`${username}:${accessToken}`).toString('base64');
  const headers = {
    Authorization: `Basic ${auth}`,
    'Content-Type': 'application/json',
  };

  const fields = '*all';
  let startAt = 0;
  let total = -1;

  while (total === -1 || startAt < total) {
    const url = new URL(`${formattedHost}/rest/api/2/search`);
    url.searchParams.set('jql', jql);
    url.searchParams.set('startAt', startAt.toString());
    url.searchParams.set('maxResults', limitPerRequest.toString());
    url.searchParams.set('fields', fields);

    const res = await fetch(url.toString(), { headers });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Jira API Error:', errorText);
      throw new Error(
        `Failed to fetch from Jira: ${res.status} ${errorText}`,
      );
    }

    const json = await res.json();
    if (total === -1) {
      total = json.total;
    }
    const issues = json.issues as JiraIssue[];
    if (!issues) {
      return;
    }
    yield issues;

    startAt += issues.length;
    if (issues.length === 0) {
      break; 
    }
  }
} 