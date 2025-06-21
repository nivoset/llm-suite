import { Tool } from '@langchain/core/tools';
import { chromium, Page } from 'playwright';
import * as cheerio from 'cheerio';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from '@langchain/core/documents';

class WebBrowserTool extends Tool {
  name = 'web-browser';
  description =
    'Access a website, recursively gather content, and perform a similarity search. Input should be a JSON object with "url", "query", and an optional "depth" (default 2).';

  private async getPageContent(page: Page): Promise<string> {
    const html = await page.content();
    const $ = cheerio.load(html);
    // Simple text extraction, can be improved
    return $('body').text();
  }

  private async recursiveScrape(
    url: string,
    depth: number,
    visited: Set<string>,
    maxDepth: number,
  ): Promise<string[]> {
    if (depth > maxDepth || visited.has(url)) {
      return [];
    }
    visited.add(url);

    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      const content = await this.getPageContent(page);
      const links = await this.getLinks(page, new URL(url).hostname);
      
      let contents = [content];
      for (const link of links) {
        contents = contents.concat(await this.recursiveScrape(link, depth + 1, visited, maxDepth));
      }
      return contents;
    } finally {
      await browser.close();
    }
  }

  private async getLinks(page: Page, hostname: string): Promise<string[]> {
    const links = await page.$$eval('a', (anchors) =>
      anchors.map((a) => a.href),
    );
    return links.filter(
      (link) => link && new URL(link, page.url()).hostname === hostname,
    );
  }

  async _call(input: string): Promise<string> {
    try {
      const { url, query, depth = 2 } = JSON.parse(input);

      if (!url || !query) {
        return 'Error: "url" and "query" are required in the input JSON.';
      }

      const rawDocs = await this.recursiveScrape(url, 0, new Set(), depth);

      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      const docs = await textSplitter.createDocuments(rawDocs);

      const vectorStore = await MemoryVectorStore.fromDocuments(
        docs,
        new OpenAIEmbeddings(),
      );

      const result = await vectorStore.similaritySearch(query, 1);
      
      return result.map(res => res.pageContent).join('\n\n');

    } catch (e: any) {
      return `Error processing request: ${e.message}`;
    }
  }
}

export const webBrowserTool = new WebBrowserTool();
