"use server"
import { JiraProjectLoader, JiraProjectLoaderParams } from "@langchain/community/document_loaders/web/jira";
import type { JiraDocument } from "~/types/jira";

const host = process.env.JIRA_HOST!;
const username = process.env.JIRA_USERNAME!;
const accessToken = process.env.JIRA_ACCESS_TOKEN!;

// Define types for Jira API responses
interface JiraComponent {
  name: string;
  [key: string]: any;
}

interface JiraUser {
  displayName: string;
  emailAddress: string;
  avatarUrls: Record<string, string>;
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

interface JiraFields {
  summary: string;
  description?: string;
  status?: JiraStatus;
  assignee?: JiraUser;
  reporter?: JiraUser;
  priority?: JiraPriority;
  labels?: string[];
  created?: string;
  updated?: string;
  duedate?: string;
  components?: JiraComponent[];
  issuetype?: JiraIssueType;
  parent?: {
    key: string;
    fields: JiraFields;
  };
  [key: string]: any;
}

interface JiraIssue {
  id: string;
  key: string;
  fields: JiraFields;
}

class CustomJiraLoader extends JiraProjectLoader {
  async load(): Promise<JiraDocument[]> {
    console.log('CustomJiraLoader: Starting to load issues...');
    try {
      const issues = await this.loadAsIssues();
      console.log('CustomJiraLoader: Raw issues loaded:', issues);

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
        
        // If this is an epic, initialize its entry in the map
        if (fields.issuetype?.name === 'Epic') {
          epicMap.set(issue.key, {
            title: fields.summary,
            status: fields.status?.name || 'To Do',
            children: []
          });
        }

        // If this issue belongs to an epic, add it to the epic's children
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
        
        // Create a rich text content combining various fields using a readable template
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

        // Construct the issue URL
        const issueUrl = `${this.host}/browse/${issue.key}`;

        // Get epic information if this issue belongs to one
        const epicKey = fields.parent?.key;
        const epic = epicKey ? epicMap.get(epicKey) : undefined;

        // Get child issues if this is an epic
        const childIssues = issue.fields.issuetype?.name === 'Epic' 
          ? epicMap.get(issue.key)?.children
          : undefined;

        // Return a plain object instead of a Document instance
        return {
          pageContent: content,
          metadata: {
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

export async function loadJiraDocuments(
  props: Omit<JiraProjectLoaderParams, "host" | "username" | "accessToken">
): Promise<JiraDocument[]> {

    console.log("Jira Configuration:", {
      host,
      username,
      projectKey: props.projectKey,
      // Don't log the full access token
      hasAccessToken: !!accessToken
    });
  // Validate environment variables
  if (!host) {
    throw new Error("JIRA_HOST must be set in the environment");
  }
  if (!username || !accessToken) {
    throw new Error("JIRA_USERNAME and JIRA_ACCESS_TOKEN must be set in the environment");
  }

    // Make sure the host URL is properly formatted
    const formattedHost = host.startsWith('http') ? host : `https://${host}`;


  const loader = new CustomJiraLoader({
    host: formattedHost,
    username,
    accessToken,
    ...props
  });

  try {
    console.log("Attempting to load Jira documents...");
    const docs = await loader.load();
    console.log(`Successfully loaded ${docs.length} documents`);
    return docs;
  } catch (error) {
    // Log the full error for debugging
    console.error("Error loading Jira documents:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        // Additional error properties that might help
        cause: (error as any).cause,
        response: (error as any).response,
      });
    }
    throw error; // Re-throw to handle it in the UI
  }
} 