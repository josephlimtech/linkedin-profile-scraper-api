require('dotenv').config()

const puppeteer = require('puppeteer');

const exampleProfileUrl = 'https://www.linkedin.com/in/jvandenaardweg/';

(async () => {

    const browser = await puppeteer.launch({
        headless: false
    });

    const page = await browser.newPage();

    console.log('Browsing to LinkedIn.com in the background using a headless browser...');
    await page.setViewport({width: 1200, height: 720})
    await page.goto('https://www.linkedin.com/', { waitUntil: 'domcontentloaded' }); // wait until page load

    console.log('Logging in with the credentials...')
    await page.type('#login-email', process.env.LINKEDIN_LOGIN_EMAIL);
    await page.type('#login-password', process.env.LINKEDIN_LOGIN_PASSWORD);

    await Promise.all([
        await page.click('#login-submit'),
        await page.waitForNavigation({ waitUntil: 'domcontentloaded' })
    ]);

    console.log('Logged in!');

    console.log('Navigating to LinkedIn profile...');

    await page.goto(exampleProfileUrl, { waitUntil: 'domcontentloaded' });

    console.log('LinkedIn profile page loaded!');

    console.log('Getting all the LinkedIn profile data by scrolling the page to the bottom, so all the data gets loaded into the page...');

    await autoScroll(page);

    console.log('Parsing data...');

    // Clicking the "Show X more experiences" button
    // TODO: make dynamic, check if exists, check if need to be clicked again
    await page.click('#experience-section .pv-profile-section__see-more-inline.link'); // Expand "Experience"
    await page.click('[data-control-name="skill_details"]'); // Expand "Skills" section
    await page.click('#education-section .pv-profile-section__text-truncate-toggle.link'); // Expand "Education" section
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

    console.log('User:');
    console.log(userProfile);

    console.log('Parsing experiences data...');

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

    console.log('Got experiences data:');
    console.log(experiences);

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

    console.log('Got education data:');
    console.log(education);



    const skills = await page.$$eval('.pv-skill-categories-section ol > .ember-view', nodes => {
        // Note: the $$eval context is the browser context.
        // So custom methods you define in this file are not available within this $$eval.

        return nodes.map((node) => {
            const skillName = node.querySelector('.pv-skill-category-entity__name-text');
            const endorsementCount = node.querySelector('.pv-skill-category-entity__endorsement-count');

            return {
                skillName: (skillName) ? skillName.textContent.trim() : null,
                endorsementCount: (endorsementCount) ? endorsementCount.textContent.trim() : 0
            }
        })
    });

    console.log('Got skills data:');
    console.log(skills);



    console.log('WE ARE DONE! GOODBYE!');

    await browser.close();

    page.on("error", function (err) {
        theTempValue = err.toString();
        console.log("Error: " + theTempValue);
    })
})();

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