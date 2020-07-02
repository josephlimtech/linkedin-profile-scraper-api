require('dotenv').config();

import { LinkedInProfileScraper } from '../index';

(async() => {
  const scraper = new LinkedInProfileScraper({
    sessionCookieValue: `${process.env.LINKEDIN_SESSION_COOKIE_VALUE}`,
    keepAlive: false
  });

  // Prepare the scraper
  // Loading it in memory
  await scraper.setup()

  const result = await scraper.run('https://www.linkedin.com/in/jvandenaardweg/')
  
  // When keepAlive: true, you can manually close the session using the method below.
  // This will free up your system's memory. Otherwise Puppeteer will sit idle in the background consuming memory.
  // await scraper.close()
  
  console.log(result)
})()


