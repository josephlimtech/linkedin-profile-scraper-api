require('dotenv').config();

import express from 'express';
import LinkedInProfileScraper from '../index';

const app = express();

const scraper = new LinkedInProfileScraper({
  sessionCookieValue: `${process.env.LINKEDIN_SESSION_COOKIE_VALUE}`,
  keepAlive: false
})

app.get('/', async (req, res) => {
  const urlToScrape = req.query.url as string;

  const result = await scraper.run(urlToScrape)
  res.json(result)
})

app.listen(process.env.PORT || 3000)
