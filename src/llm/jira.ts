"use server"
import type { JiraProjectLoaderParams } from "@langchain/community/document_loaders/web/jira";
import { fetchJiraIssues, type JiraIssue } from "./jira/client";

const host = process.env.JIRA_HOST!;
const username = process.env.JIRA_USERNAME!;
const accessToken = process.env.JIRA_ACCESS_TOKEN!;

export { type JiraIssue };

export async function loadJiraDocuments(
  props: Omit<JiraProjectLoaderParams, "host" | "username" | "accessToken"> & { epicKey?: string | null; jql?: string }
): Promise<JiraIssue[]> {

    console.log("Jira Configuration:", {
      host,
      username,
      projectKey: props.projectKey,
      epicKey: props.epicKey,
      jql: props.jql,
      hasAccessToken: !!accessToken
    });

  if (!host) {
    throw new Error("JIRA_HOST must be set in the environment");
  }
  if (!username || !accessToken) {
    throw new Error("JIRA_USERNAME and JIRA_ACCESS_TOKEN must be set in the environment");
  }

  let jql = props.jql || `project = "${props.projectKey}"`;
  if (!props.jql && props.epicKey) {
    // Include the epic itself in the results, along with its children.
    jql += ` AND (key = "${props.epicKey}" OR parent = "${props.epicKey}")`;
  }

  const loader = fetchJiraIssues(jql, { ...props });

  const docs: JiraIssue[] = [];
  for await (const issueBatch of loader) {
    docs.push(...issueBatch);
  }

  try {
    console.log(`Attempting to load Jira documents...`);
    console.log(`Successfully loaded ${docs.length} documents`);
    return docs;
  } catch (error) {
    console.error("Error loading Jira documents:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        cause: (error as any).cause,
        response: (error as any).response,
      });
    }
    throw error;
  }
} 