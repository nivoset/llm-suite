import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { embeddings } from "./model";

export const vectorStore = new MemoryVectorStore(embeddings);
