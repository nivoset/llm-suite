import { GithubRepoLoader, GithubRepoLoaderParams } from "@langchain/community/document_loaders/web/github";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

/**
 * Load documents from a GitHub repo.
 * @param repo The GitHub repository URL (e.g. https://github.com/langchain-ai/langchainjs)
 * @param options Loader options: branch, recursive, unknown, maxConcurrency, etc.
 */
export const retrieveGithubRepo = async (
  repo: `${string}/${string}`,
  options?: GithubRepoLoaderParams
) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const loader = new GithubRepoLoader(`https://github.com/${repo}`, {
    baseUrl: "https://github.your.company",
    apiUrl: "https://github.your.company/api/v3",
    accessToken: "ghp_A1B2C3D4E5F6a7b8c9d0",
    branch: "develop",
    ...options,
  });
  const docs = await loader.load();
  return await splitter.splitDocuments(docs);
};