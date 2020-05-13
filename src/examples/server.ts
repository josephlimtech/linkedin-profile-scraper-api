require('dotenv').config();

import express from 'express';
import LinkedInProfileScraper from '../index';

const app = express();

// Setup environment variables to fill the sessionCookieValue
const scraper = new LinkedInProfileScraper({
  sessionCookieValue: `${process.env.LINKEDIN_SESSION_COOKIE_VALUE}`,
  keepAlive: false
})

// Usage: http://localhost:3000/?url=https://www.linkedin.com/in/jvandenaardweg/
app.get('/', async (req, res) => {
  const urlToScrape = req.query.url as string;

  const result = await scraper.run(urlToScrape)
  
  return res.json(result)
})

app.listen(process.env.PORT || 3000)
