// tests/example.spec.ts
import { test, expect } from '@playwright/test';

test('should navigate to the home page', async ({ page }) => {
  // Start from the index page (the baseURL is set in the playwright.config.ts)
  await page.goto('/');

  // The new page should have an h1 with "Jira Dashboard"
  await expect(page.locator('h1')).toContainText('Jira Dashboard');
}); 