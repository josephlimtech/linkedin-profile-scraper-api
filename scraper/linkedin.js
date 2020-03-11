require('dotenv').config()
const puppeteer = require('puppeteer');
const {
  getDurationInDays,
  formatDate,
  getCleanText,
  getLocationFromText
} = require('../utils');
const path = require('path');

global.appRoot = path.resolve(__dirname + '../../');

const setupScraper = async () => {
  try {
    const blockedResources = ['image', 'stylesheet', 'media', 'font', 'texttrack', 'object', 'beacon', 'csp_report', 'imageset'];
    const logSection = 'setup'

    statusLog(logSection, 'Launching puppeteer in the background...')

    // const ext = global.appRoot + '/ublock-chromium'
    // const datadir = global.appRoot + '/ublock-data'

    const browser = await puppeteer.launch({
      headless: true,
      // userDataDir: datadir,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        "--proxy-server='direct://",
        '--proxy-bypass-list=*',
        // `--load-extension=${ext}`,
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
      // '--no-sandbox', '--disable-setuid-sandbox' -> For the Heroku Buildpack: https://github.com/nguyenkaos/puppeteer-heroku-buildpack . More info: https://github.com/jontewks/puppeteer-heroku-buildpack/issues/24#issuecomment-421789066
      // "--proxy-server='direct://'", '--proxy-bypass-list=*' -> For speed improvements: https://github.com/GoogleChrome/puppeteer/issues/1718#issuecomment-424357709
    })

    statusLog(logSection, 'Puppeteer launched!')

    const page = await browser.newPage()

    statusLog(logSection, `Blocking the following resources: ${blockedResources.join(', ')}`)

    // Block loading of resources, like images and css, we dont need that
    await page.setRequestInterception(true);

    page.on('request', (req) => {
      if (blockedResources.includes(req.resourceType())) {
        req.abort()
      } else {
        req.continue()
      }
    })

    // Speed improvement: https://github.com/GoogleChrome/puppeteer/issues/1718#issuecomment-425618798
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36')

    await page.setViewport({
      width: 1200,
      height: 720
    })

    statusLog(logSection, `Setting session cookie using cookie: ${process.env.LINKEDIN_SESSION_COOKIE_VALUE}`)

    await page.setCookie({
      'name': 'li_at',
      'value': process.env.LINKEDIN_SESSION_COOKIE_VALUE,
      'domain': '.www.linkedin.com'
    })

    statusLog(logSection, 'Session cookie set!')

    statusLog(logSection, 'Browsing to LinkedIn.com in the background using a headless browser...')

    await page.goto('https://www.linkedin.com/')

    statusLog(logSection, 'Adding helper methods to page')
    await page.exposeFunction('getCleanText', getCleanText);
    await page.exposeFunction('formatDate', formatDate);
    await page.exposeFunction('getDurationInDays', getDurationInDays);
    await page.exposeFunction('getLocationFromText', getLocationFromText);

    statusLog(logSection, 'Checking if we are logged in successfully...')

    const isLoggedIn = await checkIfLoggedIn(page);

    if (isLoggedIn) {
      statusLog(logSection, 'Done!')
      return {
        page,
        browser
      }
    } else {
      statusLog(logSection, 'Error! Scraper not logged in into LinkedIn')
      return new Error('Scraper not logged in into LinkedIn')
    }
  } catch (err) {
    throw new Error(err)
  }
};

const statusLog = async (section, message, scraperSessionId) => {
  const sessionPart = (scraperSessionId) ? ` (${scraperSessionId})` : ''
  const messagePart = (message) ? `: ${message}` : null
  return console.log(`Scraper (${section})${sessionPart}${messagePart}`)
}

const checkIfLoggedIn = async (page) => {
  const logSection = 'authentication'

  statusLog(logSection, 'Check if we are still logged in...')

  const isLoggedIn = await page.$('#login-email') === null

  if (isLoggedIn) {
    statusLog(logSection, 'All good. We are still logged in.')
  } else {
    statusLog(logSection, 'Bad news. We are not logged in. Session is expired or our check to see if we are loggedin is not correct anymore.')
  }

  return isLoggedIn
};

const getLinkedinProfileDetails = async (page, profileUrl) => {
  const logSection = 'scraping'

  const scraperSessionId = new Date().getTime();

  statusLog(logSection, `Navigating to LinkedIn profile: ${profileUrl}`, scraperSessionId)

  await page.goto(profileUrl, {
    waitUntil: 'domcontentloaded'
  });

  statusLog(logSection, 'LinkedIn profile page loaded!', scraperSessionId)

  // TODO: first check if the needed selectors are present on the page, or else we need to update it in this script
  // TODO: notifier should be build if LinkedIn changes their selectors

  statusLog(logSection, 'Getting all the LinkedIn profile data by scrolling the page to the bottom, so all the data gets loaded into the page...', scraperSessionId)

  await autoScroll(page);

  statusLog(logSection, 'Parsing data...', scraperSessionId)

  // Only click the expanding buttons when they exist
  const expandButtonsSelectors = [
    '.pv-profile-section.pv-about-section .lt-line-clamp__more', // About
    '#experience-section .pv-profile-section__see-more-inline.link', // Experience
    '.pv-profile-section.education-section button.pv-profile-section__see-more-inline', // Education
    '.pv-skill-categories-section [data-control-name="skill_details"]', // Skills
  ];

  const seeMoreButtonsSelectors = ['.pv-entity__description .lt-line-clamp__line.lt-line-clamp__line--last .lt-line-clamp__more[href="#"]', '.lt-line-clamp__more[href="#"]:not(.lt-line-clamp__ellipsis--dummy)']

  statusLog(logSection, 'Expanding all sections by clicking their "See more" buttons', scraperSessionId)

  for (const buttonSelector of expandButtonsSelectors) {
    if (await page.$(buttonSelector) !== null) {
      statusLog(logSection, `Clicking button ${buttonSelector}`, scraperSessionId)
      await page.click(buttonSelector);
    }
  }

  // To give a little room to let data appear. Setting this to 0 might result in "Node is detached from document" errors
  await page.waitFor(100);

  statusLog(logSection, 'Expanding all descriptions by clicking their "See more" buttons', scraperSessionId)

  for (const seeMoreButtonSelector of seeMoreButtonsSelectors) {
    const buttons = await page.$$(seeMoreButtonSelector)

    for (const button of buttons) {
      if (button) {
        statusLog(logSection, `Clicking button ${seeMoreButtonSelector}`, scraperSessionId)
        await button.click()
      }
    }
  }

  // TODO: check if we need to expand experience, education and skills AGAIN (for the rest of the data)

  // Converting the complete string to a document, so we can querySelector into it instead of using Puppeteer
  // TODO: we can also close this thread now so puppeteer can crawl other profiles, resulting on more pages per minute we can crawl
  // const html = await page.content()
  // const dom = new JSDOM(html);
  // console.log(dom.window.document.querySelector('.pv-entity__description').textContent)

  statusLog(logSection, 'Parsing profile data...', scraperSessionId)

  const userProfile = await page.evaluate(async () => {
    const profileSection = document.querySelector('.pv-top-card')

    const url = window.location.href

    const fullNameElement = profileSection.querySelector('.pv-top-card--list li:first-child')
    const fullName = (fullNameElement && fullNameElement.textContent) ? await window.getCleanText(fullNameElement.textContent) : null

    const titleElement = profileSection.querySelector('h2')
    const title = (titleElement && titleElement.textContent) ? await window.getCleanText(titleElement.textContent) : null

    const locationElement = profileSection.querySelector('.pv-top-card--list.pv-top-card--list-bullet.mt1 li:first-child')
    const locationText = (locationElement && locationElement.textContent) ? await window.getCleanText(locationElement.textContent) : null
    const location = await getLocationFromText(locationText)

    const photoElement = profileSection.querySelector('.pv-top-card__photo') || profileSection.querySelector('.profile-photo-edit__preview')
    const photo = (photoElement && photoElement.getAttribute('src')) ? photoElement.getAttribute('src') : null

    const descriptionElement = document.querySelector('.pv-about__summary-text .lt-line-clamp__raw-line') // Is outside "profileSection"
    const description = (descriptionElement && descriptionElement.textContent) ? await window.getCleanText(descriptionElement.textContent) : null

    return {
      fullName,
      title,
      location,
      photo,
      description,
      url
    }
  })


  statusLog(logSection, `Got user profile data: ${userProfile}`, scraperSessionId)

  statusLog(logSection, `Parsing experiences data...`, scraperSessionId)

  const experiences = await page.$$eval('#experience-section ul > .ember-view', async (nodes) => {
    let data = []

    // Using a for loop so we can use await inside of it
    for (const node of nodes) {
      const titleElement = node.querySelector('h3');
      const title = (titleElement && titleElement.textContent) ? await window.getCleanText(titleElement.textContent) : null

      const companyElement = node.querySelector('.pv-entity__secondary-title');
      const company = (companyElement && companyElement.textContent) ? await window.getCleanText(companyElement.textContent) : null

      const descriptionElement = node.querySelector('.pv-entity__description');
      const description = (descriptionElement && descriptionElement.textContent) ? await window.getCleanText(descriptionElement.textContent) : null

      const dateRangeElement = node.querySelector('.pv-entity__date-range span:nth-child(2)');
      const dateRangeText = (dateRangeElement && dateRangeElement.textContent) ? await window.getCleanText(dateRangeElement.textContent) : null

      const startDatePart = (dateRangeText) ? await window.getCleanText(dateRangeText.split('–')[0]) : null;
      const startDate = (startDatePart) ? await formatDate(startDatePart) : null

      const endDatePart = (dateRangeText) ? await window.getCleanText(dateRangeText.split('–')[1]) : null;
      const endDate = (endDatePart) ? await formatDate(endDatePart) : null

      const durationInDays = (startDate && endDate) ? await getDurationInDays(startDate, endDate) : null

      const locationElement = node.querySelector('.pv-entity__location span:nth-child(2)');
      const locationText = (locationElement && locationElement.textContent) ? await window.getCleanText(locationElement.textContent) : null
      const location = await getLocationFromText(locationText)

      data.push({
        title,
        company,
        location,
        startDate,
        endDate,
        durationInDays,
        description,
      })
    }

    return data;
  });


  statusLog(logSection, `Got experiences data: ${experiences}`, scraperSessionId)

  statusLog(logSection, `Parsing education data...`, scraperSessionId)

  const education = await page.$$eval('#education-section ul > .ember-view', async (nodes) => {
    // Note: the $$eval context is the browser context.
    // So custom methods you define in this file are not available within this $$eval.
    let data = []
    for (const node of nodes) {

      const schoolNameElement = node.querySelector('h3.pv-entity__school-name');
      const schoolName = (schoolNameElement && schoolNameElement.textContent) ? await window.getCleanText(schoolNameElement.textContent) : null;

      const degreeNameElement = node.querySelector('.pv-entity__degree-name .pv-entity__comma-item');
      const degreeName = (degreeNameElement && degreeNameElement.textContent) ? await window.getCleanText(degreeNameElement.textContent) : null;

      const fieldOfStudyElement = node.querySelector('.pv-entity__fos .pv-entity__comma-item');
      const fieldOfStudy = (fieldOfStudyElement && fieldOfStudyElement.textContent) ? await window.getCleanText(fieldOfStudyElement.textContent) : null;

      const gradeElement = node.querySelector('.pv-entity__grade .pv-entity__comma-item');
      const grade = (gradeElement && gradeElement.textContent) ? await window.getCleanText(fieldOfStudyElement.textContent) : null;

      const dateRangeElement = node.querySelectorAll('.pv-entity__dates time');

      const startDatePart = (dateRangeElement && dateRangeElement[0] && dateRangeElement[0].textContent) ? await window.getCleanText(dateRangeElement[0].textContent) : null;
      const startDate = (startDatePart) ? await formatDate(startDatePart) : null

      const endDatePart = (dateRangeElement && dateRangeElement[1] && dateRangeElement[1].textContent) ? await window.getCleanText(dateRangeElement[1].textContent) : null;
      const endDate = (endDatePart) ? await formatDate(endDatePart) : null

      const durationInDays = (startDate && endDate) ? await getDurationInDays(startDate, endDate) : null

      data.push({
        schoolName,
        degreeName,
        fieldOfStudy,
        startDate,
        endDate,
        durationInDays
      })
    }

    return data
  });

  statusLog(logSection, `Got education data: ${education}`, scraperSessionId)

  statusLog(logSection, `Parsing skills data...`, scraperSessionId)

  const skills = await page.$$eval('.pv-skill-categories-section ol > .ember-view', nodes => {
    // Note: the $$eval context is the browser context.
    // So custom methods you define in this file are not available within this $$eval.

    return nodes.map((node) => {
      const skillName = node.querySelector('.pv-skill-category-entity__name-text');
      const endorsementCount = node.querySelector('.pv-skill-category-entity__endorsement-count');

      return {
        skillName: (skillName) ? skillName.textContent.trim() : null,
        endorsementCount: (endorsementCount) ? parseInt(endorsementCount.textContent.trim()) : 0
      }
    })
  });

  statusLog(logSection, `Got skills data: ${skills}`, scraperSessionId)

  statusLog(logSection, `Done! Returned profile details for: ${profileUrl}`, scraperSessionId)

  return {
    userProfile,
    experiences,
    education,
    skills
  }
};

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      var totalHeight = 0;
      var distance = 500;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

module.exports = {
  setupScraper,
  getLinkedinProfileDetails,
  checkIfLoggedIn
}
