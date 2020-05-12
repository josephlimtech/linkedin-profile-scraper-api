require('dotenv').config()

import puppeteer, { Page, Browser } from 'puppeteer'
import treeKill from 'tree-kill';

import { getDurationInDays, formatDate, getCleanText, getLocationFromText, statusLog } from '../utils'

export interface Location {
  city: string | null;
  province: string | null;
  country: string | null
}

interface RawProfile {
  fullName: string | null;
  title: string | null;
  location: string | null;
  photo: string | null;
  description: string | null;
  url: string;
}

export interface Profile {
  fullName: string | null;
  title: string | null;
  location: Location | null;
  photo: string | null;
  description: string | null;
  url: string;
}

interface RawExperience {
  title: string | null;
  company: string | null;
  employmentType: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  endDateIsPresent: boolean;
  description: string | null;
}

export interface Experience {
  title: string | null;
  company: string | null;
  employmentType: string | null;
  location: Location | null;
  startDate: string | null;
  endDate: string | null;
  endDateIsPresent: boolean;
  durationInDays: number | null;
  description: string | null;
}

interface RawEducation {
  schoolName: string | null;
  degreeName: string | null;
  fieldOfStudy: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface Education {
  schoolName: string | null;
  degreeName: string | null;
  fieldOfStudy: string | null;
  startDate: string | null;
  endDate: string | null;
  durationInDays: number | null;
}

export interface Skill {
  skillName: string | null;
  endorsementCount: number | null;
}

interface ScraperOptions {
  sessionCookieValue: string;
  autoClose?: boolean;
  userAgent?: string;
}

async function autoScroll(page: Page) {
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

export default class LinkedInProfileScraper {
  private readonly sessionCookieValue: string = '';
  private readonly autoClose: ScraperOptions['autoClose'];
  private readonly userAgent: string = '';
  private page: Page | null = null;
  private browser: Browser | null = null;

  constructor(options: ScraperOptions) {
    this.sessionCookieValue = options.sessionCookieValue;

    if (!this.sessionCookieValue) {
      throw new Error('Error during setup. A "sessionCookieValue" is required.');
    }

    this.autoClose = !!options.autoClose;

    // Speed improvement: https://github.com/GoogleChrome/puppeteer/issues/1718#issuecomment-425618798
    this.userAgent = options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36';

    this.setup()
  }

  private setup = async () => {
    const logSection = 'setup'

    // Important: Do not block "stylesheet", makes the crawler not work for LinkedIn
    const blockedResources = ['image', 'media', 'font', 'texttrack', 'object', 'beacon', 'csp_report', 'imageset'];

    try {
      statusLog(logSection, 'Launching puppeteer in the background...')

      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          "--proxy-server='direct://",
          '--proxy-bypass-list=*',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--disable-features=site-per-process',
          '--enable-features=NetworkService',
          '--allow-running-insecure-content',
          '--enable-automation',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-web-security',
        ]
      })

      statusLog(logSection, 'Puppeteer launched!')

      this.page = await this.browser.newPage()

      // Use already open page
      // This makes sure we don't have an extra open tab consuming memory
      const firstPage = (await this.browser.pages())[0];
      await firstPage.close();

      // Method to create a faster Page
      // From: https://github.com/shirshak55/scrapper-tools/blob/master/src/fastPage/index.ts#L113
      const session = await this.page.target().createCDPSession()
      await this.page.setBypassCSP(true)
      await session.send('Page.enable');
      await session.send('Page.setWebLifecycleState', {
        state: 'active',
      });

      statusLog(logSection, `Blocking the following resources: ${blockedResources.join(', ')}`)

      // Block loading of resources, like images and css, we dont need that
      await this.page.setRequestInterception(true);

      this.page.on('request', (req) => {
        if (blockedResources.includes(req.resourceType())) {
          req.abort()
        } else {
          req.continue()
        }
      })

      await this.page.setUserAgent(this.userAgent)

      await this.page.setViewport({
        width: 1200,
        height: 720
      })

      statusLog(logSection, `Setting session cookie using cookie: ${process.env.LINKEDIN_SESSION_COOKIE_VALUE}`)

      await this.page.setCookie({
        'name': 'li_at',
        'value': this.sessionCookieValue,
        'domain': '.www.linkedin.com'
      })

      statusLog(logSection, 'Session cookie set!')

      statusLog(logSection, 'Browsing to LinkedIn.com in the background using a headless browser...')

      await this.page.goto('https://www.linkedin.com/', {
        waitUntil: 'domcontentloaded'
      })

      statusLog(logSection, 'Checking if we are logged in successfully...')

      const isLoggedIn = await this.checkIfLoggedIn();

      if (!isLoggedIn) {
        statusLog(logSection, 'Error! Scraper not logged in into LinkedIn')
        throw new Error('Scraper not logged in into LinkedIn')
      }

      statusLog(logSection, 'Done!')

      return {
        page: this.page,
        browser: this.browser
      }
    } catch (err) {
      throw new Error(err)
    }
  };

  public close = (): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      const loggerPrefix = 'close';

      if (this.page) {
        try {
          statusLog(loggerPrefix, 'Closing page...');
          await this.page.close();
          statusLog(loggerPrefix, 'Closed page!');
        } catch (err) {
          reject(err)
        }
      }

      if (this.browser) {
        try {
          statusLog(loggerPrefix, 'Closing browser...');
          await this.browser.close();
          statusLog(loggerPrefix, 'Closed browser!');

          const browserProcessPid = this.browser.process().pid;

          // Completely kill the browser process to prevent zombie processes
          // https://docs.browserless.io/blog/2019/03/13/more-observations.html#tip-2-when-you-re-done-kill-it-with-fire
          if (browserProcessPid) {
            statusLog(loggerPrefix, `Killing browser process pid: ${browserProcessPid}...`);
            
            treeKill(browserProcessPid, 'SIGKILL', (err) => {
              if (err) {
                return reject(`Failed to kill browser process pid: ${browserProcessPid}`);
              }

              statusLog(loggerPrefix, `Killed browser pid: ${browserProcessPid} Closed browser.`);
              resolve()
            });
          }
        } catch (err) {
          reject(err);
        }
      }

      return resolve()
    })

  }

  public checkIfLoggedIn = async () => {
    const logSection = 'checkIfLoggedIn';

    if (!this.page) {
      throw new Error('Page is not set.')
    }

    statusLog(logSection, 'Check if we are still logged in...')

    const isLoggedIn = await this.page.$('#login-email') === null

    if (isLoggedIn) {
      statusLog(logSection, 'All good. We are still logged in.')
    } else {
      const errorMessage = 'Bad news. We are not logged in. Session is expired or our check to see if we are loggedin is not correct anymore.';
      statusLog(logSection, errorMessage)
      throw new Error(errorMessage)
    }

    return isLoggedIn
  };

  public run = async (profileUrl: string) => {
    const logSection = 'run'

    const scraperSessionId = new Date().getTime();

    if (!this.page) {
      throw new Error('Page is not set.')
    }

    if (!profileUrl) {
      throw new Error('No profileUrl given.')
    }

    if (!profileUrl.includes('linkedin.com/')) {
      throw new Error('The given URL to scrape is not a linkedin.com url.')
    }

    statusLog(logSection, `Navigating to LinkedIn profile: ${profileUrl}`, scraperSessionId)

    await this.page.goto(profileUrl, {
      waitUntil: 'domcontentloaded'
    });

    statusLog(logSection, 'LinkedIn profile page loaded!', scraperSessionId)

    statusLog(logSection, 'Getting all the LinkedIn profile data by scrolling the page to the bottom, so all the data gets loaded into the page...', scraperSessionId)

    await autoScroll(this.page);

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
      if (await this.page.$(buttonSelector) !== null) {
        statusLog(logSection, `Clicking button ${buttonSelector}`, scraperSessionId)
        await this.page.click(buttonSelector);
      }
    }

    // To give a little room to let data appear. Setting this to 0 might result in "Node is detached from document" errors
    await this.page.waitFor(100);

    statusLog(logSection, 'Expanding all descriptions by clicking their "See more" buttons', scraperSessionId)

    for (const seeMoreButtonSelector of seeMoreButtonsSelectors) {
      const buttons = await this.page.$$(seeMoreButtonSelector)

      for (const button of buttons) {
        if (button) {
          statusLog(logSection, `Clicking button ${seeMoreButtonSelector}`, scraperSessionId)
          await button.click()
        }
      }
    }

    statusLog(logSection, 'Parsing profile data...', scraperSessionId)

    const rawUserProfileData: RawProfile = await this.page.evaluate(async () => {
      const profileSection = document.querySelector('.pv-top-card')

      const url = window.location.href

      const fullNameElement = profileSection?.querySelector('.pv-top-card--list li:first-child')
      const fullName = fullNameElement?.textContent || null

      const titleElement = profileSection?.querySelector('h2')
      const title = titleElement?.textContent || null

      const locationElement = profileSection?.querySelector('.pv-top-card--list.pv-top-card--list-bullet.mt1 li:first-child')
      const location = locationElement?.textContent || null

      const photoElement = profileSection?.querySelector('.pv-top-card__photo') || profileSection?.querySelector('.profile-photo-edit__preview')
      const photo = photoElement?.getAttribute('src') || null

      const descriptionElement = document.querySelector('.pv-about__summary-text .lt-line-clamp__raw-line') // Is outside "profileSection"
      const description = descriptionElement?.textContent || null

      return {
        fullName,
        title,
        location,
        photo,
        description,
        url
      } as RawProfile
    })

    // Convert the raw data to clean data using our utils
    // So we don't have to inject our util methods inside the browser context, which is too damn difficult using TypeScript
    const userProfile: Profile = {
      ...rawUserProfileData,
      fullName: getCleanText(rawUserProfileData.fullName),
      title: getCleanText(rawUserProfileData.title),
      location: rawUserProfileData.location ? getLocationFromText(rawUserProfileData.location) : null,
      description: getCleanText(rawUserProfileData.description),
    }

    statusLog(logSection, `Got user profile data: ${JSON.stringify(userProfile)}`, scraperSessionId)

    statusLog(logSection, `Parsing experiences data...`, scraperSessionId)

    const rawExperiencesData: RawExperience[] = await this.page.$$eval('#experience-section ul > .ember-view', (nodes) => {
      let data: RawExperience[] = []

      // Using a for loop so we can use await inside of it
      for (const node of nodes) {
        const titleElement = node.querySelector('h3');
        const title = titleElement?.textContent || null

        const employmentTypeElement = node.querySelector('span.pv-entity__secondary-title');
        const employmentType = employmentTypeElement?.textContent || null

        const companyElement = node.querySelector('.pv-entity__secondary-title');
        const companyElementClean = companyElement?.removeChild(companyElement.querySelector('span') as Node);
        const company = companyElementClean?.textContent || null

        const descriptionElement = node.querySelector('.pv-entity__description');
        const description = descriptionElement?.textContent || null

        const dateRangeElement = node.querySelector('.pv-entity__date-range span:nth-child(2)');
        const dateRangeText = dateRangeElement?.textContent || null

        const startDatePart = dateRangeText?.split('–')[0] || null;
        const startDate = startDatePart?.trim() || null;

        const endDatePart = dateRangeText?.split('–')[1] || null;
        const endDateIsPresent = endDatePart?.trim().toLowerCase() === 'present' || false;
        const endDate = (endDatePart && !endDateIsPresent) ? endDatePart.trim() : 'Present';

        const locationElement = node.querySelector('.pv-entity__location span:nth-child(2)');
        const location = locationElement?.textContent || null;

        data.push({
          title,
          company,
          employmentType,
          location,
          startDate,
          endDate,
          endDateIsPresent,
          description
        })
      }

      return data;
    });

    // Convert the raw data to clean data using our utils
    // So we don't have to inject our util methods inside the browser context, which is too damn difficult using TypeScript
    const experiences: Experience[] = rawExperiencesData.map((rawExperience) => {
      const startDate = formatDate(rawExperience.startDate);
      const endDate = formatDate(rawExperience.endDate) || null;
      const endDateIsPresent = rawExperience.endDateIsPresent;

      const durationInDaysWithEndDate = (startDate && endDate && !endDateIsPresent) ? getDurationInDays(startDate, endDate) : null
      const durationInDaysForPresentDate = (endDateIsPresent && startDate) ? getDurationInDays(startDate, new Date()) : null
      const durationInDays = endDateIsPresent ? durationInDaysForPresentDate : durationInDaysWithEndDate;
      
      return {
        ...rawExperience,
        title: getCleanText(rawExperience.title),
        company: getCleanText(rawExperience.company),
        employmentType: getCleanText(rawExperience.employmentType),
        location: rawExperience?.location ? getLocationFromText(rawExperience.location) : null,
        startDate,
        endDate,
        endDateIsPresent,
        durationInDays,
        description: getCleanText(rawExperience.description)
      }
    })
    
    statusLog(logSection, `Got experiences data: ${JSON.stringify(experiences)}`, scraperSessionId)

    statusLog(logSection, `Parsing education data...`, scraperSessionId)

    const rawEducationData: RawEducation[] = await this.page.$$eval('#education-section ul > .ember-view', async (nodes) => {
      // Note: the $$eval context is the browser context.
      // So custom methods you define in this file are not available within this $$eval.
      let data: RawEducation[] = []
      for (const node of nodes) {

        const schoolNameElement = node.querySelector('h3.pv-entity__school-name');
        const schoolName = schoolNameElement?.textContent || null;

        const degreeNameElement = node.querySelector('.pv-entity__degree-name .pv-entity__comma-item');
        const degreeName = degreeNameElement?.textContent || null;

        const fieldOfStudyElement = node.querySelector('.pv-entity__fos .pv-entity__comma-item');
        const fieldOfStudy = fieldOfStudyElement?.textContent || null;

        // const gradeElement = node.querySelector('.pv-entity__grade .pv-entity__comma-item');
        // const grade = (gradeElement && gradeElement.textContent) ? window.getCleanText(fieldOfStudyElement.textContent) : null;

        const dateRangeElement = node.querySelectorAll('.pv-entity__dates time');

        const startDatePart = dateRangeElement && dateRangeElement[0]?.textContent || null;
        const startDate = startDatePart || null

        const endDatePart = dateRangeElement && dateRangeElement[1]?.textContent || null;
        const endDate = endDatePart || null

        data.push({
          schoolName,
          degreeName,
          fieldOfStudy,
          startDate,
          endDate
        })
      }

      return data
    });

    // Convert the raw data to clean data using our utils
    // So we don't have to inject our util methods inside the browser context, which is too damn difficult using TypeScript
    const education: Education[] = rawEducationData.map(rawEducation => {
      const startDate = formatDate(rawEducation.startDate)
      const endDate = formatDate(rawEducation.endDate)

      return {
        ...rawEducation,
        schoolName: getCleanText(rawEducation.schoolName),
        degreeName: getCleanText(rawEducation.degreeName),
        fieldOfStudy: getCleanText(rawEducation.fieldOfStudy),
        startDate,
        endDate,
        durationInDays: getDurationInDays(startDate, endDate),
      }
    })

    statusLog(logSection, `Got education data: ${JSON.stringify(education)}`, scraperSessionId)

    statusLog(logSection, `Parsing skills data...`, scraperSessionId)

    const skills: Skill[] = await this.page.$$eval('.pv-skill-categories-section ol > .ember-view', nodes => {
      // Note: the $$eval context is the browser context.
      // So custom methods you define in this file are not available within this $$eval.

      return nodes.map((node) => {
        const skillName = node.querySelector('.pv-skill-category-entity__name-text');
        const endorsementCount = node.querySelector('.pv-skill-category-entity__endorsement-count');

        return {
          skillName: (skillName) ? skillName.textContent?.trim() : null,
          endorsementCount: (endorsementCount) ? parseInt(endorsementCount.textContent?.trim() || '0') : 0
        } as Skill;
      }) as Skill[]
    });

    statusLog(logSection, `Got skills data: ${JSON.stringify(skills)}`, scraperSessionId)

    statusLog(logSection, `Done! Returned profile details for: ${profileUrl}`, scraperSessionId)
    
    if (this.autoClose) {
      statusLog(logSection, 'Auto closing...')
      await this.close()
    }
  
    return {
      userProfile,
      experiences,
      education,
      skills
    }
  }
}
