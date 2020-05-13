require('dotenv').config();

import LinkedInProfileScraper from '../index';

(async() => {
  const scraper = new LinkedInProfileScraper({
    sessionCookieValue: `${process.env.LINKEDIN_SESSION_COOKIE_VALUE}`,
    keepAlive: false
  });

  const result = await scraper.run('https://www.linkedin.com/in/jvandenaardweg/')
  
  // When keepAlive: true, you can manually close session using the method below.
  // This will free up your memory, otherwise Puppeteer will sit idle in the background consuming memory.
  // await scraper.close()
  
  console.log(result)
})()


