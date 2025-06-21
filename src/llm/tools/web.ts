import puppeteer from 'puppeteer';
import { tool } from '@langchain/core/tools';
import { htmlToText } from 'html-to-text'
import z from 'zod';

/**
 * A tool for fetching documentation for a given library and topic.
 * It uses Context7 to resolve the library ID and then get the documentation.
 */
export const webBrowserTool = tool(
  async ({ url }) => {
    console.log("browsing data for: ", url)

    let browser;
    try {
      browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      const content = await page.content();
      return htmlToText(content).replace(/\\n/g, ' ').replace(/\\s+/g, ' ').trim();
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  },
  {
    name: "web-browser",
    description: "browse the web and fetch the content of a given URL",
    schema: z.object({
      url: z.string().url().describe("The URL to browse"),
    }),
  }
);


export const webSearchTool = tool(
  async ({ query }) => {
    let browser;
    try {
      browser = await puppeteer.launch();
      const page = await browser.newPage();
      console.log("searching for: ", query)
      
      // Use DuckDuckGo's HTML version for simpler scraping
      const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

      const results = await page.$$eval('li[data-layout=\"organic\"]', (items) =>
        items.map((item) => {
          const anchor = item.querySelector('a');
          return {
            text: htmlToText(item.innerHTML).replace(/\\n/g, ' ').replace(/\\s+/g, ' ').trim(),
            href: anchor?.href || '',
          };
        }),
      );
      const relatedSearches = await page.$$eval('li[data-layout=\"related\"]', (items) =>
        items.map((item) => {
          const anchor = item.querySelector('a');
          return {
            text: htmlToText(item.innerHTML).replace(/\\n/g, ' ').replace(/\\s+/g, ' ').trim(),
            href: anchor?.href || '',
          };
        }),
      );

      return `
${results.map((result) => `URL: "${result.href})"\nDescription: "${result.text}"`).join('\n')}

or related searches:
${relatedSearches.map((result) => `- ${result.text} (${result.href})`).join('\n')}
      `;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  },
  {
    name: 'web-search-extractor',
    description: "Performs a web search and extracts text and links from all list items (`<li>`) with a `data-bm` attribute from the results page.",
    schema: z.object({
      query: z.string().describe('The search query to get the specific information'),
    }),
  },
);