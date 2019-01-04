const express = require('express')
const app = express()
const port = process.env.PORT || 3000

// TODO: this should be a worker process
// We should send an event to the worker process and wait for an update
// So this server can handle more concurrent connections
const { getLinkedinProfileDetails } = require('./scraper/linkedin')

app.get('/', async (req, res) => {
  const urlToScrape = req.query.url

  if (urlToScrape && urlToScrape.includes('linkedin.com/')) {
    const linkedinProfileDetails = await getLinkedinProfileDetails(urlToScrape)
    res.json({ ...linkedinProfileDetails })
  } else {
    res.json({
      message: 'Missing the url parameter. Or given URL is not an LinkedIn URL.'
    })
  }
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
