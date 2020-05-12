require('dotenv').config();

import LinkedInProfileScraper from '../index';

(async() => {
  const scraper = new LinkedInProfileScraper({
    sessionCookieValue: `${process.env.LINKEDIN_SESSION_COOKIE_VALUE}`,
    keepAlive: false
  });

  const result = await scraper.run('https://www.linkedin.com/in/jvandenaardweg/')
  
  console.log(result)
})()


