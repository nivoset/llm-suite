import { readFileSync } from 'fs';
import { join } from 'path';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from '@langchain/core/documents';

// Size of each context chunk in characters
const CHUNK_SIZE = 1000;

// Overlap between chunks to maintain context
const CHUNK_OVERLAP = 200;

export interface ContextChunk {
  content: string;
  metadata: {
    source: string;
    section: string;
    startChar: number;
    endChar: number;
  };
}

let vectorStore: MemoryVectorStore | null = null;

export async function initializeVectorStore(): Promise<void> {
  if (vectorStore) return;

  const contextPath = join(process.cwd(), 'src', 'llm', 'context', 'internal-systems.txt');
  const content = readFileSync(contextPath, 'utf-8');

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
    separators: ['\n\n', '\n', ' ', ''],
    keepSeparator: false
  });

  const docs = await textSplitter.createDocuments([content], [{
    source: 'internal-systems',
    created_at: new Date().toISOString()
  }]);

  const embeddings = new OpenAIEmbeddings();
  vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
}

export async function searchContext(query: string, maxResults: number = 3): Promise<Document[]> {
  if (!vectorStore) {
    await initializeVectorStore();
  }

  if (!vectorStore) {
    throw new Error('Failed to initialize vector store');
  }

  const results = await vectorStore.similaritySearch(query, maxResults);
  return results;
}

export async function addToContext(content: string, metadata: Record<string, any>): Promise<void> {
  if (!vectorStore) {
    await initializeVectorStore();
  }

  if (!vectorStore) {
    throw new Error('Failed to initialize vector store');
  }

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
    separators: ['\n\n', '\n', ' ', ''],
    keepSeparator: false
  });

  const docs = await textSplitter.createDocuments([content], [metadata]);
  await vectorStore.addDocuments(docs);
}

// Function to search chunks based on query
export function searchContextChunks(chunks: ContextChunk[], query: string): ContextChunk[] {
  // Simple keyword matching for now - could be enhanced with embeddings
  const queryTerms = query.toLowerCase().split(' ');
  
  return chunks.filter(chunk => {
    const content = chunk.content.toLowerCase();
    return queryTerms.every(term => content.includes(term));
  });
}

// Function to get relevant context for a query
export async function getRelevantContext(query: string, k: number = 3): Promise<string> {
  const docs = await searchContext(query, k);
  return docs.map(doc => doc.pageContent).join('\n\n');
}

/**
 * Resolves a library name to a Context7-compatible library ID.
 * This is a placeholder for the actual tool call.
 * 
 * @param params - The parameters for resolving the library ID.
 * @param params.libraryName - The name of the library to resolve.
 * @returns A promise that resolves to the library ID response.
 */
export async function mcp_context7_resolve_library_id(params: { libraryName: string }): Promise<any> {
  // In a real environment, this would be a tool call.
  // We're mocking the structure for type-checking.
  console.log(`Resolving library ID for: ${params.libraryName}`);
  return Promise.resolve({
    result: [{ id: `/mock/${params.libraryName}` }],
  });
}

/**
 * Fetches documentation for a given library from Context7.
 * This is a placeholder for the actual tool call.
 * 
 * @param params - The parameters for getting library docs.
 * @param params.context7CompatibleLibraryID - The resolved library ID.
 * @param params.topic - The documentation topic to fetch.
 * @returns A promise that resolves to the documentation content.
 */
export async function mcp_context7_get_library_docs(params: { context7CompatibleLibraryID: string; topic: string }): Promise<any> {
  // In a real environment, this would be a tool call.
  // We're mocking the structure for type-checking.
  console.log(`Fetching docs for ${params.context7CompatibleLibraryID} on topic "${params.topic}"`);
  return Promise.resolve({
    result: `Mock documentation for ${params.topic} from ${params.context7CompatibleLibraryID}.`,
  });
}