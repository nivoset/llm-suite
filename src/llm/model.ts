import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai'


export const model = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // model: ''
})

export const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  // model: ''
})
