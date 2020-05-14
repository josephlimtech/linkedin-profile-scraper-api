require('dotenv').config();

import LinkedInProfileScraper from '../index';

(async () => {
  const scraper = new LinkedInProfileScraper({
    sessionCookieValue: `${process.env.LINKEDIN_SESSION_COOKIE_VALUE}`,
    // Keep the scraper alive after each scrape
    // So we can scrape multiple pages
    keepAlive: true
  });

  // Prepare the scraper
  // Loading it in memory
  await scraper.setup()

  // Keep in mind, LinkedIn has usage limits
  // More about that here: https://www.linkedin.com/help/linkedin/answer/52950
  const [jvandenaardweg, natfriedman, williamhgates] = await Promise.all([
    scraper.run('https://www.linkedin.com/in/jvandenaardweg/'),
    scraper.run('https://www.linkedin.com/in/natfriedman/'),
    scraper.run('https://www.linkedin.com/in/williamhgates/'),
  ])

  // Close the scraper to free up memory
  await scraper.close()

  console.log(jvandenaardweg, natfriedman, williamhgates)
})()


