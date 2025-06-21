import { chromium } from '@playwright/test';
import { tool } from '@langchain/core/tools';
import { htmlToText } from 'html-to-text'
import z from 'zod';

/**
 * A tool for fetching documentation for a given library and topic.
 * It uses Context7 to resolve the library ID and then get the documentation.
 */


export const webBrowserTool = tool(
  async ({ url }) => {
    /**
     * Multiply two numbers.
     */

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url);
    const content = await page.content();
    return htmlToText(content).replace(/\n/g, ' ').replace(/\ s+/g, ' ').trim();
  },
  {
    name: "web-browser",
    description: "browse the web and fetch the content of a given URL",
    schema: z.object({
      url: z.string().url().describe("The URL to browse"),
      // lookFor: z.string().describe("The text to look for in the page").nullish(),
    }),
  }
);
