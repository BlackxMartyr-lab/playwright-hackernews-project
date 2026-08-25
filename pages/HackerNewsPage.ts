import { Page, Locator } from '@playwright/test';
import { StatementSync } from 'node:sqlite';

// Define the HackerNewsArticle interface to represent the structure of an article
export interface HackerNewsArticle {
  title: string;
  author: string;
  timestamp: number;
  comments: number;
}
// The HackerNewsPage class encapsulates interactions with the Hacker News page
export class HackerNewsPage {
    private page: Page;
    private articleRows: Locator;
    private subtextRows: Locator;
    private moreButton: Locator;

    // The constructor initializes the page and locators for articles, subtext, and the "More" button
    constructor(page: Page) {
        this.page = page;
        this.articleRows = page.locator('tr.athing');
        this.subtextRows = page.locator('td.subtext');
        this.moreButton = page.locator('.morelink');
    }
    // Navigate to the Hacker News "newest" page
    async navigateToNewest(): Promise<void> {
        await this.page.goto('https://news.ycombinator.com/newest');
    }
    // Collect articles from the Hacker News page until the specified maximum number of articles is reached
    async collectArticles(maxArticles: number = 100): Promise<HackerNewsArticle[]> {
        const articlesList: HackerNewsArticle[] = [];

        // Loop to collect articles until the desired number is reached or no more articles are available
        while (articlesList.length < maxArticles) {
            await this.page.waitForLoadState('networkidle')
            const countArticles = await this.articleRows.count();

            // Loop through the articles on the current page and extract their details
            for (let i = 0; i < countArticles; i++) {
                if (articlesList.length >= maxArticles) break;

                // Extract the title, author, timestamp, and number of comments for each article
                const row = this.articleRows.nth(i);
                const title = await row.locator('span.titleline > a').first().innerText().catch(() => 'No title');
                const subtextRow = this.subtextRows.nth(i);
                const author = await subtextRow.locator('a.hnuser').first().innerText().catch(() => 'Anonymous');

                // Initialize timestamp to 0 and extract the actual timestamp from the "age" element if available
                let timestamp = 0;
                const age = await subtextRow.locator('span.age');

                // Check if the "age" element is visible and extract the timestamp from its title attribute
                if (await age.isVisible()) {
                    const titleAttr = await age.getAttribute('title');

                    // If the title attribute is present, parse the timestamp from it
                    if (titleAttr) {
                        const actualTime = titleAttr.split(' ')[0];
                        timestamp = new Date(actualTime).getTime();
                    }
                }
                    // Initialize comments to 0 and extract the number of comments from the subtext row if available
                    let comments = 0;
                    const commentElement = await subtextRow.locator('a').filter({ hasText: /comment|discuss/ });
                    if (await commentElement.isVisible()) {
                        const commentText = await commentElement.innerText();

                        // Use a regular expression to extract the number of comments from the comment text
                        const match = commentText.match(/(\d+)\s+comment/);

                        // If a match is found, parse the number of comments as an integer; otherwise, keep it as 0
                        comments = match ? parseInt(match[1], 10) : 0;
                    }
                    articlesList.push({ title, author, timestamp, comments });
                }

                /* If the number of collected articles is less than the maximum,
                 check if the "More" button is visible and click it to load more articles; otherwise, break the loop */
                if (articlesList.length < maxArticles) {
                    if (await this.moreButton.last().isVisible()) {
                        await this.moreButton.click();
                        await this.page.waitForLoadState('networkidle');
                    } else {
                        break;
                    }
                }
            }
            // Return the list of collected articles
            return articlesList;
        }
    }
