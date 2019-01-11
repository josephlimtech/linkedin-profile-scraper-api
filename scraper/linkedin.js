require('dotenv').config()
const puppeteer = require('puppeteer');

const setupScraper = async () => {
  console.log(`Setup scraper: Launching puppeteer in the background...`)

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // For the Heroku Buildpack: https://github.com/nguyenkaos/puppeteer-heroku-buildpack . More info: https://github.com/jontewks/puppeteer-heroku-buildpack/issues/24#issuecomment-421789066
  })

  console.log(`Setup scraper: Puppeteer launched!`)

  const page = await browser.newPage()
  await page.setViewport({width: 1200, height: 720})

  console.log(`Setup scraper: Setting session cookie...`)

  await page.setCookie({
    'name': process.env.LINKEDIN_SESSION_COOKIE_NAME,
    'value': process.env.LINKEDIN_SESSION_COOKIE_VALUE,
    'domain': '.www.linkedin.com'
  })

  console.log(`Setup scraper: Session cookie set!`)

  console.log('Setup scraper: Browsing to LinkedIn.com in the background using a headless browser...')

  await page.goto('https://www.linkedin.com/', { waitUntil: 'domcontentloaded' })

  console.log(`Setup scraper: Checking if we are logged in successfully...`)

  const isLoggedIn = await checkIfLoggedIn(page);

  if (isLoggedIn) {
    console.log(`Setup scraper: Done!`)
    return {
      page,
      browser
    }
  } else {
    throw new Error('Scraper not logged in into LinkedIn')
  }
};

const checkIfLoggedIn = async (page) => {
  console.log('Scraper: Check if we are still logged in...')
  const isLoggedIn = await page.$('#login-email') === null

  if (isLoggedIn) {
    console.log('Scraper: All good. We are still logged in.')
  } else {
    console.log('Scraper: Bad news. We are not logged in. Session is expired or our check to see if we are loggedin is not correct anymore.')
  }
  return isLoggedIn
};

const getLinkedinProfileDetails = async (page, profileUrl) => {

  const scraperSessionId = new Date().getTime();

    console.log(`Scraper (${scraperSessionId}): Navigating to LinkedIn profile...`);

    await page.goto(profileUrl, { waitUntil: 'domcontentloaded' });

    console.log(`Scraper (${scraperSessionId}): LinkedIn profile page loaded!`);

    // TODO: first check if the needed selectors are present on the page, or else we need to update it in this script
    // TODO: notifier should be build if LinkedIn changes their selectors

    console.log(`Scraper (${scraperSessionId}): Getting all the LinkedIn profile data by scrolling the page to the bottom, so all the data gets loaded into the page...`);

    await autoScroll(page);

    console.log(`Scraper (${scraperSessionId}): Parsing data...`);

    // Only click the expanding buttons when they exist
    const expandButtonsSelectors = [
        '#experience-section .pv-profile-section__see-more-inline.link', // Experience
        '.pv-profile-section.education-section button.pv-profile-section__see-more-inline', // Education
        '.pv-skill-categories-section [data-control-name="skill_details"]', // Skills

    ];

    for (const buttonSelector of expandButtonsSelectors) {
        if (await page.$(buttonSelector) !== null) {
            console.log(`Scraper (${scraperSessionId}): Click ${buttonSelector}`)
            await page.click(buttonSelector);
        };
    };

    // TODO: check if we need to expand experience, education and skills AGAIN (for the rest of the data)

    await page.waitFor(1000);

    const userProfile = await page.evaluate(() => {
        const regexRemoveMultipleSpaces = / +/g
        const regexRemoveLineBreaks = /(\r\n\t|\n|\r\t)/gm

        const profileSection = document.querySelector('.pv-profile-section');

        const fullNameElement = profileSection.querySelector('.pv-top-card-section__name');
        const titleElement = profileSection.querySelector('.pv-top-card-section__headline');
        const locationElement = profileSection.querySelector('.pv-top-card-section__location');
        const photoElement = profileSection.querySelector('img.profile-photo-edit__preview');
        const descriptionElement = profileSection.querySelector('.pv-top-card-section__summary-text');
        const followersCountElement = document.querySelector('.pv-recent-activity-section__follower-count--text');
        const connectionsCountElement = document.querySelector('.pv-top-card-v2-section__connections');

        return {
            fullName: (fullNameElement && fullNameElement.textContent) ? fullNameElement.textContent.trim() : null,
            title: (titleElement && titleElement.textContent) ? titleElement.textContent.trim() : null,
            location: (locationElement && locationElement.textContent) ? locationElement.textContent.trim() : null,
            photo: (photoElement) ? photoElement.getAttribute('src') : null,
            description: (descriptionElement && descriptionElement.textContent) ? descriptionElement.textContent.replace(regexRemoveLineBreaks, '').replace(regexRemoveMultipleSpaces, ' ').trim() : null,
            url: window.location.href,
            followersTotal: (followersCountElement && followersCountElement.textContent) ? followersCountElement.textContent.trim() : null,
            connectionsTotal: (connectionsCountElement && connectionsCountElement.textContent) ? connectionsCountElement.textContent.trim() : null
        }
    });

    console.log(`Scraper (${scraperSessionId}): User:`);
    console.log(`Scraper (${scraperSessionId}): `, userProfile);

    console.log(`Scraper (${scraperSessionId}): Parsing experiences data...`);

    const experiences = await page.$$eval('#experience-section ul > .ember-view', nodes => {
        // Note: the $$eval context is the browser context.
        // So custom methods you define in this file are not available within this $$eval.
        return nodes.map((node) => {
            const title = node.querySelector('h3');
            const company = node.querySelector('.pv-entity__secondary-title');
            const dateRange = node.querySelector('.pv-entity__date-range span:nth-child(2)').textContent;
            const startDate = (dateRange) ? dateRange.split('–')[0] : null;
            const endDate = (dateRange) ? dateRange.split('–')[1] : null;
            const duration = node.querySelector('.pv-entity__bullet-item-v2');
            const location = node.querySelector('.pv-entity__location span:nth-child(2)');

            return {
                title: (title && title.textContent) ? title.textContent.trim() : null,
                company: (company && company.textContent) ? company.textContent.trim() : null,
                dateRange: (dateRange) ? dateRange.trim() : null,
                startDate: (startDate) ? startDate.trim() : null,
                endDate: (endDate) ? endDate.trim() : null,
                duration: (duration && duration.textContent) ? duration.textContent.trim() : null,
                location: (location && location.textContent) ? location.textContent.trim() : null
            }
        })
    });

    console.log(`Scraper (${scraperSessionId}): Got experiences data:`);
    console.log(`Scraper (${scraperSessionId}): `, experiences);

    const education = await page.$$eval('#education-section ul > .ember-view', nodes => {
        // Note: the $$eval context is the browser context.
        // So custom methods you define in this file are not available within this $$eval.

        return nodes.map((node) => {
            const schoolName = node.querySelector('h3.pv-entity__school-name');
            const degreeName = node.querySelector('.pv-entity__degree-name .pv-entity__comma-item');
            const fieldOfStudy = node.querySelector('.pv-entity__fos .pv-entity__comma-item');
            const grade = node.querySelector('.pv-entity__grade .pv-entity__comma-item');
            const dateRange = node.querySelectorAll('.pv-entity__dates time');
            const startDate = dateRange[0];
            const endDate = dateRange[1];

            return {
                schoolName: (schoolName) ? schoolName.textContent.trim() : null,
                degreeName: (degreeName) ? degreeName.textContent.trim() : null,
                fieldOfStudy: (fieldOfStudy) ? fieldOfStudy.textContent.trim() : null,
                startDate: (startDate) ? startDate.textContent.trim() : null,
                endDate: (endDate) ? endDate.textContent.trim() : null,
            }
        })
    });

    console.log(`Scraper (${scraperSessionId}): Got education data:`);
    console.log(`Scraper (${scraperSessionId}): `, education);

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

    console.log(`Scraper (${scraperSessionId}): Got skills data:`);
    console.log(`Scraper (${scraperSessionId}): `, skills);



    console.log(`Scraper (${scraperSessionId}): Done! Returned profile details for: ${profileUrl}`);

    // await browser.close();

    return {
        userProfile,
        experiences,
        education,
        skills
    }

    // page.on("error", function (err) {
    //     theTempValue = err.toString();
    //     console.log("Error: " + theTempValue);
    // })
};

async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 200;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

module.exports = { setupScraper, getLinkedinProfileDetails, checkIfLoggedIn }
