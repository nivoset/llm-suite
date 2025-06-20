import type { JiraConfig, CustomField, JiraFieldType } from './types';

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