import { JiraProjectLoader, type JiraProjectLoaderParams } from "@langchain/community/document_loaders/web/jira";
import type { JiraDocument } from "~/types/jira";

interface CustomJiraLoaderParams extends JiraProjectLoaderParams {
  epicKey?: string | null;
}

// Define types for Jira API responses
interface JiraComponent {
  name: string;
  [key: string]: any;
}

interface JiraUser {
  displayName: string;
  emailAddress: string;
  avatarUrls: Record<string, string>;
  accountId: string;
  accountType: string;
  active: boolean;
  self: string;
  timeZone: string;
}

interface JiraStatus {
  name: string;
  statusCategory?: {
    key: string;
    name: string;
    colorName?: string;
  };
}

interface JiraPriority {
  name: string;
  iconUrl?: string;
}

interface JiraIssueType {
  name: string;
  iconUrl?: string;
}

interface JiraIssueLink {
  id: string;
  self: string;
  type: {
    id: string;
    name: string;
    inward: string;
    outward: string;
    self: string;
  };
  inwardIssue?: JiraBriefIssue;
  outwardIssue?: JiraBriefIssue;
}

interface JiraBriefIssue {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    status: JiraStatus;
    priority: JiraPriority;
    issuetype: JiraIssueType;
  }
}

interface JiraFields {
  summary: string;
  description?: string;
  status?: JiraStatus;
  assignee?: JiraUser;
  reporter?: JiraUser;
  priority?: JiraPriority;
  labels?: string[];
  created: string;
  updated: string;
  duedate?: string;
  components?: JiraComponent[];
  issuetype?: JiraIssueType;
  parent?: JiraBriefIssue;
  [key: string]: any;
  issuelinks: JiraIssueLink[];
  progress: any; 
  project: any;
  creator: JiraUser;
  subtasks: any[];
}

export interface JiraIssue {
  id: string;
  key: string;
  expand: string;
  self: string;
  fields: JiraFields;
}

export async function* fetchJira(
  jql: string,
  params?: Omit<JiraProjectLoaderParams, 'host'|'username'|'accessToken'>,
): AsyncGenerator<JiraIssue[]> {
  const { limitPerRequest = 50 } = params || {};

  const host = process.env.JIRA_HOST;
  const username = process.env.JIRA_USERNAME;
  const accessToken = process.env.JIRA_ACCESS_TOKEN;

  if (!host || !username || !accessToken) {
    throw new Error('Jira host, username, and accessToken are required and must be set in environment variables.');
  }

  const auth = Buffer.from(`${username}:${accessToken}`).toString('base64');
  const headers = {
    Authorization: `Basic ${auth}`,
    'Content-Type': 'application/json',
  };

  const fields = '*all';
  let startAt = 0;
  let total = -1;
  // Make sure the host URL is properly formatted
  const formattedHost = host.startsWith('http') ? host : `https://${host}`;


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

export class CustomJiraLoader extends JiraProjectLoader {
  epicKey?: string | null;
  private loaderParams: Omit<CustomJiraLoaderParams, 'host'|'username'|'accessToken'>;

  constructor(params: Omit<CustomJiraLoaderParams, 'host'|'username'|'accessToken'>) {
    const host = process.env.JIRA_HOST;
    if (!host) {
      throw new Error('JIRA_HOST environment variable not set');
    }
    super({
      ...params,
      host,
      username: process.env.JIRA_USERNAME!,
      accessToken: process.env.JIRA_ACCESS_TOKEN!,
    });
    this.loaderParams = params;
    this.epicKey = params.epicKey;
  }

  async fetch(query: string) {
    return fetchJira(this.loaderParams, query);
  }


  async load(): Promise<JiraDocument[]> {
    console.log('CustomJiraLoader: Starting to load issues...');
    try {
      const issues = await this.loadAsIssues();

      if (!Array.isArray(issues)) {
        console.error('CustomJiraLoader: Expected array of issues but got:', typeof issues);
        throw new Error('Invalid response format from Jira API');
      }

      // First pass: Create a map of epics and their children
      const epicMap = new Map<string, {
        title: string;
        status: string;
        children: Array<{key: string; title: string; status: string}>;
      }>();

      issues.forEach((issue: JiraIssue) => {
        const fields = issue.fields;
        
        if (fields.issuetype?.name === 'Epic') {
          epicMap.set(issue.key, {
            title: fields.summary,
            status: fields.status?.name || 'To Do',
            children: []
          });
        }

        if (fields.parent?.key && epicMap.has(fields.parent.key)) {
          epicMap.get(fields.parent.key)?.children.push({
            key: issue.key,
            title: fields.summary,
            status: fields.status?.name || 'To Do'
          });
        }
      });

      const docs = issues.map((issue: JiraIssue) => {
        console.log('CustomJiraLoader: Processing issue:', issue.key);
        const fields = issue.fields;
        
        const content = `
Issue Key: ${issue.key}
Summary: ${fields.summary}
${fields.description ? `Description: ${fields.description}` : ''}
Status: ${fields.status?.name || 'To Do'}
Priority: ${fields.priority?.name || 'None'}
Assignee: ${fields.assignee?.displayName || 'Unassigned'}
Reporter: ${fields.reporter?.displayName || 'Unknown'}
Labels: ${(fields.labels || []).join(', ') || 'None'}
Components: ${(fields.components || []).map(c => c.name).join(', ') || 'None'}
Created: ${fields.created || 'Unknown'}
Updated: ${fields.updated || 'Unknown'}
Due Date: ${fields.duedate || 'None'}
${fields.parent?.key ? `Parent Epic: ${fields.parent.key} - ${fields.parent.fields.summary}` : ''}
`.trim();

        const issueUrl = `${this.host}/browse/${issue.key}`;
        const epicKey = fields.parent?.key;
        const epic = epicKey ? epicMap.get(epicKey) : undefined;
        const childIssues = issue.fields.issuetype?.name === 'Epic' 
          ? epicMap.get(issue.key)?.children
          : undefined;

        return {
          pageContent: content,
          metadata: {
            epic,
            id: issue.id,
            key: issue.key,
            title: fields.summary,
            description: fields.description,
            status: fields.status?.name || 'To Do',
            statusCategory: fields.status?.statusCategory?.key,
            assignee: fields.assignee?.displayName,
            assigneeEmail: fields.assignee?.emailAddress,
            assigneeAvatar: fields.assignee?.avatarUrls?.['48x48'],
            reporter: fields.reporter?.displayName,
            reporterEmail: fields.reporter?.emailAddress,
            reporterAvatar: fields.reporter?.avatarUrls?.['48x48'],
            priority: fields.priority?.name,
            priorityIcon: fields.priority?.iconUrl,
            labels: fields.labels || [],
            created: fields.created,
            updated: fields.updated,
            dueDate: fields.duedate,
            components: fields.components?.map(c => c.name) || [],
            issueType: fields.issuetype?.name,
            issueTypeIcon: fields.issuetype?.iconUrl,
            issueUrl,
            epicKey: fields.parent?.key,
            epicTitle: fields.parent?.fields.summary,
            epicColor: fields.parent?.fields.status?.statusCategory?.colorName,
            childIssues,
            rawFields: fields
          }
        };
      });

      console.log('CustomJiraLoader: Successfully converted all issues to documents');
      return docs;
    } catch (error) {
      console.error('CustomJiraLoader: Error in load():', error);
      throw error;
    }
  }
} 