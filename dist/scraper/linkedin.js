"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require('dotenv').config();
const puppeteer_1 = tslib_1.__importDefault(require("puppeteer"));
const utils_1 = require("../utils");
exports.setupScraper = () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const blockedResources = ['image', 'media', 'font', 'texttrack', 'object', 'beacon', 'csp_report', 'imageset'];
        const logSection = 'setup';
        utils_1.statusLog(logSection, 'Launching puppeteer in the background...');
        const browser = yield puppeteer_1.default.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                "--proxy-server='direct://",
                '--proxy-bypass-list=*',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });
        utils_1.statusLog(logSection, 'Puppeteer launched!');
        const page = yield browser.newPage();
        utils_1.statusLog(logSection, `Blocking the following resources: ${blockedResources.join(', ')}`);
        yield page.setRequestInterception(true);
        page.on('request', (req) => {
            if (blockedResources.includes(req.resourceType())) {
                req.abort();
            }
            else {
                req.continue();
            }
        });
        yield page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36');
        yield page.setViewport({
            width: 1200,
            height: 720
        });
        utils_1.statusLog(logSection, `Setting session cookie using cookie: ${process.env.LINKEDIN_SESSION_COOKIE_VALUE}`);
        yield page.setCookie({
            'name': 'li_at',
            'value': `${process.env.LINKEDIN_SESSION_COOKIE_VALUE}`,
            'domain': '.www.linkedin.com'
        });
        utils_1.statusLog(logSection, 'Session cookie set!');
        utils_1.statusLog(logSection, 'Browsing to LinkedIn.com in the background using a headless browser...');
        yield page.goto('https://www.linkedin.com/', {
            waitUntil: 'domcontentloaded'
        });
        utils_1.statusLog(logSection, 'Adding helper methods to page');
        yield Promise.all([
            page.exposeFunction('getCleanText', utils_1.getCleanText),
            page.exposeFunction('formatDate', utils_1.formatDate),
            page.exposeFunction('getDurationInDays', utils_1.getDurationInDays),
            page.exposeFunction('getLocationFromText', utils_1.getLocationFromText)
        ]);
        utils_1.statusLog(logSection, 'Checking if we are logged in successfully...');
        const isLoggedIn = yield exports.checkIfLoggedIn(page);
        if (!isLoggedIn) {
            utils_1.statusLog(logSection, 'Error! Scraper not logged in into LinkedIn');
            throw new Error('Scraper not logged in into LinkedIn');
        }
        utils_1.statusLog(logSection, 'Done!');
        return {
            page,
            browser
        };
    }
    catch (err) {
        throw new Error(err);
    }
});
exports.checkIfLoggedIn = (page) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const logSection = 'authentication';
    utils_1.statusLog(logSection, 'Check if we are still logged in...');
    const isLoggedIn = (yield page.$('#login-email')) === null;
    if (isLoggedIn) {
        utils_1.statusLog(logSection, 'All good. We are still logged in.');
    }
    else {
        utils_1.statusLog(logSection, 'Bad news. We are not logged in. Session is expired or our check to see if we are loggedin is not correct anymore.');
    }
    return isLoggedIn;
});
exports.getLinkedinProfileDetails = (page, profileUrl) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const logSection = 'scraping';
    const scraperSessionId = new Date().getTime();
    utils_1.statusLog(logSection, `Navigating to LinkedIn profile: ${profileUrl}`, scraperSessionId);
    yield page.goto(profileUrl, {
        waitUntil: 'domcontentloaded'
    });
    utils_1.statusLog(logSection, 'LinkedIn profile page loaded!', scraperSessionId);
    utils_1.statusLog(logSection, 'Getting all the LinkedIn profile data by scrolling the page to the bottom, so all the data gets loaded into the page...', scraperSessionId);
    yield autoScroll(page);
    utils_1.statusLog(logSection, 'Parsing data...', scraperSessionId);
    const expandButtonsSelectors = [
        '.pv-profile-section.pv-about-section .lt-line-clamp__more',
        '#experience-section .pv-profile-section__see-more-inline.link',
        '.pv-profile-section.education-section button.pv-profile-section__see-more-inline',
        '.pv-skill-categories-section [data-control-name="skill_details"]',
    ];
    const seeMoreButtonsSelectors = ['.pv-entity__description .lt-line-clamp__line.lt-line-clamp__line--last .lt-line-clamp__more[href="#"]', '.lt-line-clamp__more[href="#"]:not(.lt-line-clamp__ellipsis--dummy)'];
    utils_1.statusLog(logSection, 'Expanding all sections by clicking their "See more" buttons', scraperSessionId);
    for (const buttonSelector of expandButtonsSelectors) {
        if ((yield page.$(buttonSelector)) !== null) {
            utils_1.statusLog(logSection, `Clicking button ${buttonSelector}`, scraperSessionId);
            yield page.click(buttonSelector);
        }
    }
    yield page.waitFor(100);
    utils_1.statusLog(logSection, 'Expanding all descriptions by clicking their "See more" buttons', scraperSessionId);
    for (const seeMoreButtonSelector of seeMoreButtonsSelectors) {
        const buttons = yield page.$$(seeMoreButtonSelector);
        for (const button of buttons) {
            if (button) {
                utils_1.statusLog(logSection, `Clicking button ${seeMoreButtonSelector}`, scraperSessionId);
                yield button.click();
            }
        }
    }
    utils_1.statusLog(logSection, 'Parsing profile data...', scraperSessionId);
    const userProfile = yield page.evaluate(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        const profileSection = document.querySelector('.pv-top-card');
        const url = window.location.href;
        const fullNameElement = profileSection === null || profileSection === void 0 ? void 0 : profileSection.querySelector('.pv-top-card--list li:first-child');
        const fullName = (fullNameElement && fullNameElement.textContent) ? yield window.getCleanText(fullNameElement.textContent) : null;
        const titleElement = profileSection === null || profileSection === void 0 ? void 0 : profileSection.querySelector('h2');
        const title = (titleElement && titleElement.textContent) ? yield window.getCleanText(titleElement.textContent) : null;
        const locationElement = profileSection === null || profileSection === void 0 ? void 0 : profileSection.querySelector('.pv-top-card--list.pv-top-card--list-bullet.mt1 li:first-child');
        const locationText = (locationElement && locationElement.textContent) ? yield window.getCleanText(locationElement.textContent) : null;
        const location = yield utils_1.getLocationFromText(locationText);
        const photoElement = (profileSection === null || profileSection === void 0 ? void 0 : profileSection.querySelector('.pv-top-card__photo')) || (profileSection === null || profileSection === void 0 ? void 0 : profileSection.querySelector('.profile-photo-edit__preview'));
        const photo = (photoElement && photoElement.getAttribute('src')) ? photoElement.getAttribute('src') : null;
        const descriptionElement = document.querySelector('.pv-about__summary-text .lt-line-clamp__raw-line');
        const description = (descriptionElement && descriptionElement.textContent) ? yield window.getCleanText(descriptionElement.textContent) : null;
        return {
            fullName,
            title,
            location,
            photo,
            description,
            url
        };
    }));
    utils_1.statusLog(logSection, `Got user profile data: ${JSON.stringify(userProfile)}`, scraperSessionId);
    utils_1.statusLog(logSection, `Parsing experiences data...`, scraperSessionId);
    const experiences = yield page.$$eval('#experience-section ul > .ember-view', (nodes) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        let data = [];
        for (const node of nodes) {
            const titleElement = node.querySelector('h3');
            const title = (titleElement && titleElement.textContent) ? yield window.getCleanText(titleElement.textContent) : null;
            const employmentTypeElement = node.querySelector('span.pv-entity__secondary-title');
            const employmentType = (employmentTypeElement && employmentTypeElement.textContent) ? yield window.getCleanText(employmentTypeElement.textContent) : null;
            const companyElement = node.querySelector('.pv-entity__secondary-title');
            const companyElementClean = companyElement.removeChild(companyElement.querySelector('span'));
            const company = (companyElementClean && companyElementClean.textContent) ? yield window.getCleanText(companyElementClean.textContent) : null;
            const descriptionElement = node.querySelector('.pv-entity__description');
            const description = (descriptionElement && descriptionElement.textContent) ? yield window.getCleanText(descriptionElement.textContent) : null;
            const dateRangeElement = node.querySelector('.pv-entity__date-range span:nth-child(2)');
            const dateRangeText = (dateRangeElement && dateRangeElement.textContent) ? yield window.getCleanText(dateRangeElement.textContent) : null;
            const startDatePart = (dateRangeText) ? yield window.getCleanText(dateRangeText.split('–')[0]) : null;
            const startDate = (startDatePart) ? yield utils_1.formatDate(startDatePart) : null;
            const endDatePart = (dateRangeText) ? yield window.getCleanText(dateRangeText.split('–')[1]) : null;
            const endDateIsPresent = (endDatePart) ? endDatePart.trim().toLowerCase() === 'present' : false;
            const endDate = (endDatePart && !endDateIsPresent) ? yield utils_1.formatDate(endDatePart) : null;
            const durationInDaysWithEndDate = (startDate && endDate && !endDateIsPresent) ? yield utils_1.getDurationInDays(startDate, endDate) : null;
            const durationInDaysForPresentDate = (endDateIsPresent && startDate) ? yield utils_1.getDurationInDays(startDate, new Date()) : null;
            const durationInDays = endDateIsPresent ? durationInDaysForPresentDate : durationInDaysWithEndDate;
            const locationElement = node.querySelector('.pv-entity__location span:nth-child(2)');
            const locationText = (locationElement && locationElement.textContent) ? yield window.getCleanText(locationElement.textContent) : null;
            const location = yield utils_1.getLocationFromText(locationText);
            data.push({
                title,
                company,
                employmentType,
                location,
                startDate,
                endDate,
                endDateIsPresent,
                durationInDays,
                description
            });
        }
        return data;
    }));
    utils_1.statusLog(logSection, `Got experiences data: ${JSON.stringify(experiences)}`, scraperSessionId);
    utils_1.statusLog(logSection, `Parsing education data...`, scraperSessionId);
    const education = yield page.$$eval('#education-section ul > .ember-view', (nodes) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        let data = [];
        for (const node of nodes) {
            const schoolNameElement = node.querySelector('h3.pv-entity__school-name');
            const schoolName = (schoolNameElement && schoolNameElement.textContent) ? yield window.getCleanText(schoolNameElement.textContent) : null;
            const degreeNameElement = node.querySelector('.pv-entity__degree-name .pv-entity__comma-item');
            const degreeName = (degreeNameElement && degreeNameElement.textContent) ? yield window.getCleanText(degreeNameElement.textContent) : null;
            const fieldOfStudyElement = node.querySelector('.pv-entity__fos .pv-entity__comma-item');
            const fieldOfStudy = (fieldOfStudyElement && fieldOfStudyElement.textContent) ? yield window.getCleanText(fieldOfStudyElement.textContent) : null;
            const dateRangeElement = node.querySelectorAll('.pv-entity__dates time');
            const startDatePart = (dateRangeElement && dateRangeElement[0] && dateRangeElement[0].textContent) ? yield window.getCleanText(dateRangeElement[0].textContent) : null;
            const startDate = (startDatePart) ? yield utils_1.formatDate(startDatePart) : null;
            const endDatePart = (dateRangeElement && dateRangeElement[1] && dateRangeElement[1].textContent) ? yield window.getCleanText(dateRangeElement[1].textContent) : null;
            const endDate = (endDatePart) ? yield utils_1.formatDate(endDatePart) : null;
            const durationInDays = (startDate && endDate) ? yield utils_1.getDurationInDays(startDate, endDate) : null;
            data.push({
                schoolName,
                degreeName,
                fieldOfStudy,
                startDate,
                endDate,
                durationInDays
            });
        }
        return data;
    }));
    utils_1.statusLog(logSection, `Got education data: ${JSON.stringify(education)}`, scraperSessionId);
    utils_1.statusLog(logSection, `Parsing skills data...`, scraperSessionId);
    const skills = yield page.$$eval('.pv-skill-categories-section ol > .ember-view', nodes => {
        return nodes.map((node) => {
            const skillName = node.querySelector('.pv-skill-category-entity__name-text');
            const endorsementCount = node.querySelector('.pv-skill-category-entity__endorsement-count');
            return {
                skillName: (skillName) ? skillName.textContent.trim() : null,
                endorsementCount: (endorsementCount) ? parseInt(endorsementCount.textContent.trim()) : 0
            };
        });
    });
    utils_1.statusLog(logSection, `Got skills data: ${JSON.stringify(skills)}`, scraperSessionId);
    utils_1.statusLog(logSection, `Done! Returned profile details for: ${profileUrl}`, scraperSessionId);
    return {
        userProfile,
        experiences,
        education,
        skills
    };
});
function autoScroll(page) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield page.evaluate(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield new Promise((resolve, reject) => {
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
        }));
    });
}
//# sourceMappingURL=linkedin.js.map