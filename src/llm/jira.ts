"use server"
import type { JiraProjectLoaderParams } from "@langchain/community/document_loaders/web/jira";
import type { JiraDocument } from "~/types/jira";
import { CustomJiraLoader } from "./jira/loader";

const host = process.env.JIRA_HOST!;
const username = process.env.JIRA_USERNAME!;
const accessToken = process.env.JIRA_ACCESS_TOKEN!;

export async function loadJiraDocuments(
  props: Omit<JiraProjectLoaderParams, "host" | "username" | "accessToken"> & { epicKey?: string | null }
): Promise<JiraDocument[]> {
  const { projectKey, epicKey, ...rest } = props;
  let finalProjectKey = projectKey;
  if (epicKey && projectKey) {
    finalProjectKey = `${projectKey}" AND "Epic Link" = "${epicKey}`;
  }


    console.log("Jira Configuration:", {
      host,
      username,
      projectKey: finalProjectKey,
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
    ...rest,
    projectKey: finalProjectKey,
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