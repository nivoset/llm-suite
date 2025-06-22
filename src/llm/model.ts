import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai'
import { webBrowserTool, webSearchTool } from './tools/web';


export const model = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // model: ''
})

export const thinkingModel = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o-mini',
})

export const modelWithTools = model.bindTools([
    webBrowserTool,
    webSearchTool,
]);

export const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  // model: ''
})
