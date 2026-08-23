const { chromium } = require("playwright");

async function sortHackerNewsArticles() {

  // 1. Launch the browser and open a fresh page
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to Hacker News newest articles page
  await page.goto('https://news.ycombinator.com/newest');

  // Initialize an array to store timestamps
  const timestamps = [];

  // 2. Data Collection Loop (Keep going until we have 100 timestamps)
  while (timestamps.length < 100) {

    // Create a locator for the article timestamps
    const articleLocator = page.locator(".age");

    // Wait for the first article to be visible to ensure the page has loaded
    await articleLocator.first().isVisible();

    // Count the number of articles currently loaded on the page
    const countArticles = await articleLocator.count();

    // For loop to extract timestamps from the current page one by one
    for (let i = 0; i < countArticles; i++) {
        
      // Exit immediately if we hit exactly 100
      if (timestamps.length >= 100) break; 

      // Get the timestamp data from the article
      const timestampData = await articleLocator.nth(i).getAttribute("title");
      if (timestampData) {

        // Clean up the timestamp using your split strategy
        const cleanTimestamp = timestampData.split(" ")[0];

        // Convert the cleaned timestamp to a Date object and then to a numeric timestamp
        timestamps.push(new Date(cleanTimestamp).getTime());
      }
    }
    // If we still need more articles, click the "More" button to go to the next page
    if (timestamps.length < 100) {
      const moreButton = page.locator(".morelink");

      // Check if the "More" button is visible before attempting to click it
      if (await moreButton.isVisible()) {
        await moreButton.click();

        // Wait for page to finish loading
        await articleLocator.first().isVisible(); 
      } else {

         // Exit the loop if there are no more articles to load
        console.log("No more articles available to fetch.");
        break;
      }
    }
  }
  // 3. Validation Loop (Verify the collected 100 items are sorted correctly)
  let isChronological = true;

  // Loop through the timestamps array to check if they are sorted from newest to oldest
  for (let i = 1; i < timestamps.length; i++) {
    const previousArticleTime = timestamps[i - 1];
    const currentArticleTime = timestamps[i];

    // An older article (previous index) must have a larger or equal time value than the newer article
    if (previousArticleTime < currentArticleTime) {
      isChronological = false;
      console.log(` Sorting Error found at index ${i}!`);
      break;
    }
  }

  // Final confirmation output
  if (isChronological) {
    console.log(" SUCCESS: First 100 articles are perfectly sorted from newest to oldest!");
  } else {
    console.log(" FAILURE: Articles are out of chronological order.");
  }

  // Clean up and close the browser session
  await browser.close();
}
// Execute the function to sort Hacker News articles
(async () => {
  await sortHackerNewsArticles();
})();
