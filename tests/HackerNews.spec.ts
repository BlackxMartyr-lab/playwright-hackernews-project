import { test, expect } from '@playwright/test';
import { HackerNewsPage } from '../pages/HackerNewsPage';

// Test to verify data collection and validation, ensuring that the articles are sorted by timestamp from newest to oldest
test('Hacker News homepage data collection and validation reporting', async ({ page }) => {
  const hackerNewsPage = new HackerNewsPage(page);

  // Navigate to the Hacker News "newest" page and collect articles
  await hackerNewsPage.navigateToNewest();
  const articles = await hackerNewsPage.collectArticles(100);

  // Validate that the number of collected articles is exactly 100
  expect(articles.length).toBe(100);

  // Validate that the articles are sorted by timestamp from newest to oldest
  for (let i = 1; i < articles.length; i++) {
    expect(articles[i - 1].timestamp).toBeGreaterThanOrEqual(articles[i].timestamp);
  }
// Generate a report of the collected articles
console.log('\n=== Hacker News Article Data Collection and Validation Report ===');
console.log(`- Total Articles Collected: ${articles.length}`);
console.log('- Articles are sorted by timestamp from newest to oldest: ✅');
console.log('- Report of Collected Articles:');
console.table(articles.map(a => ({

  /* Format the title to a maximum of 50 characters for better readability 
  in the report and append ellipsis if the title exceeds that length */
  Title: a.title.substring(0, 50) + (a.title.length > 50 ? '...' : ''),
  Author: a.author,
  Time: new Date(a.timestamp).toLocaleString(),
  Comments: a.comments
})));
await page.close();
});
