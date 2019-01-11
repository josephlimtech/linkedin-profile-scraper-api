require('dotenv').config();
const puppeteer = require('puppeteer');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const { getLinkedinProfileDetails, setupScraper, checkIfLoggedIn } = require('./scraper/linkedin');

(async () => {
  try {
    const { page } = await setupScraper()

    app.get('/status', async (req, res) => {
      const isLoggedIn = await checkIfLoggedIn(page)

      if (isLoggedIn) {
        res.json({ status: 'success', message: 'Still logged in into LinkedIn.' })
      } else {
        res.json({ status: 'fail', message: 'We are logged out of LinkedIn, or our logged in check is not working anymore.' })
      }
    })

    app.get('/', async (req, res) => {
      const urlToScrape = req.query.url

      if (urlToScrape && urlToScrape.includes('linkedin.com/')) {
        const linkedinProfileDetails = await getLinkedinProfileDetails(page, urlToScrape)
        res.json({ ...linkedinProfileDetails })
      } else {
        res.json({
          message: 'Missing the url parameter. Or given URL is not an LinkedIn URL.'
        })
      }
    })
  } catch (err) {
    app.get('/', async (req, res) => {
      res.json({
        message: 'Missing the url parameter. Or given URL is not an LinkedIn URL.',
        error: err
      })
    })
  }

  app.listen(port, () => console.log(`Example app listening on port ${port}!`))

})()


// const express = require('express')
// const app = express()
// const port = process.env.PORT || 3000

// TODO: this should be a worker process
// We should send an event to the worker process and wait for an update
// So this server can handle more concurrent connections



