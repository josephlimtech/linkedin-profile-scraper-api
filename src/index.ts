import puppeteer, { Page, Browser } from 'puppeteer'
import treeKill from 'tree-kill';

import blockedHostsList from './blocked-hosts';

import { getDurationInDays, formatDate, getCleanText, getLocationFromText, statusLog, getHostname } from './utils'

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
  /**
   * The LinkedIn `li_at` session cookie value. Get this value by logging in to LinkedIn with the account you want to use for scraping.
   * Open your browser's Dev Tools and find the cookie with the name `li_at`. Use that value here.
   * 
   * This script uses a known session cookie of a successful login into LinkedIn, instead of an e-mail and password to set you logged in. 
   * I did this because LinkedIn has security measures by blocking login requests from unknown locations or requiring you to fill in Captcha's upon login.
   * So, if you run this from a server and try to login with an e-mail address and password, your login could be blocked. 
   * By using a known session, we prevent this from happening and allows you to use this scraper on any server on any location.
   * 
   * You probably need to get a new session cookie value when the scraper logs show it's not logged in anymore.
   */
  sessionCookieValue: string;
  /**
   * Set to true if you want to keep the scraper session alive. This results in faster recurring scrapes.
   * But keeps your memory usage high.
   * 
   * Default: `false`
   */
  keepAlive?: boolean;
  /**
   * Set a custom user agent if you like.
   * 
   * Default: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36`
   */
  userAgent?: string;
  /**
   * Use a custom timeout to set the maximum time you want to wait for the scraper 
   * to do his job.
   * 
   * Default: `10000` (10 seconds)
   */
  timeout?: number;
  /**
   * Start the scraper in headless mode, or not.
   * 
   * Default: `true`
   */
  headless?: boolean;
}

async function autoScroll(page: Page) {
  await page.evaluate(() => {
    return new Promise((resolve, reject) => {
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

class LinkedInProfileScraper {
  private readonly sessionCookieValue: string = '';
  private readonly keepAlive: boolean;
  private readonly userAgent: string = '';
  private readonly timeout: number;
  private readonly headless: boolean;

  private browser: Browser | null = null;

  constructor(options: ScraperOptions) {
    this.sessionCookieValue = options.sessionCookieValue;

    if (!this.sessionCookieValue) {
      throw new Error('Error during setup. Option "sessionCookieValue" is required.');
    }
    
    if (this.sessionCookieValue && typeof options.sessionCookieValue !== 'string') {
      throw new Error('Error during setup. Option "sessionCookieValue" needs to be a string.');
    }
    
    if (this.userAgent && typeof options.userAgent !== 'string') {
      throw new Error('Error during setup. Option "userAgent" needs to be a string.');
    }

    if (options.keepAlive !== undefined && typeof options.keepAlive !== 'boolean') {
      throw new Error('Error during setup. Options "keepAlive" needs to be a number.');
    }
   
    if (options.timeout !== undefined && typeof options.timeout !== 'number') {
      throw new Error('Error during setup. Options "timeout" needs to be a number.');
    }
    
    if (options.headless !== undefined && typeof options.headless !== 'boolean') {
      throw new Error('Error during setup. Option "headless" needs to be a boolean.');
    }

    // Defaults to: false
    this.keepAlive = options.keepAlive === undefined ? false : options.keepAlive;

    // Defaults to: 10000
    this.timeout = options.timeout === undefined ? 10000 : options.timeout;

    // Defaults to: true
    this.headless = options.headless === undefined ? true : options.headless;

    // Speed improvement: https://github.com/GoogleChrome/puppeteer/issues/1718#issuecomment-425618798
    this.userAgent = options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36';
  }

  /**
   * Method to load Puppeteer in memory so we can re-use the browser instance.
   */
  public setup = async () => {
    const logSection = 'setup'

    try {
      statusLog(logSection, `Launching puppeteer in the ${this.headless ? 'background' : 'foreground'}...`)

      this.browser = await puppeteer.launch({
        headless: this.headless,
        args: [
          ...(this.headless ? '---single-process' : '---start-maximized'),
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
          '--autoplay-policy=user-gesture-required',
          '--disable-background-networking',
          '--disable-breakpad',
          '--disable-client-side-phishing-detection',
          '--disable-component-update',
          '--disable-default-apps',
          '--disable-domain-reliability',
          '--disable-extensions',
          '--disable-features=AudioServiceOutOfProcess',
          '--disable-hang-monitor',
          '--disable-ipc-flooding-protection',
          '--disable-notifications',
          '--disable-offer-store-unmasked-wallet-cards',
          '--disable-popup-blocking',
          '--disable-print-preview',
          '--disable-prompt-on-repost',
          '--disable-speech-api',
          '--disable-sync',
          '--disk-cache-size=33554432',
          '--hide-scrollbars',
          '--ignore-gpu-blacklist',
          '--metrics-recording-only',
          '--mute-audio',
          '--no-default-browser-check',
          '--no-first-run',
          '--no-pings',
          '--no-zygote',
          '--password-store=basic',
          '--use-gl=swiftshader',
          '--use-mock-keychain'
        ],
        timeout: this.timeout
      })

      statusLog(logSection, 'Puppeteer launched!')

      const page = await this.createPage();

      statusLog(logSection, 'Browsing to LinkedIn.com in the background using a headless browser...')

      await page.goto('https://www.linkedin.com/', {
        waitUntil: 'domcontentloaded',
        timeout: this.timeout
      })

      statusLog(logSection, 'Checking if we are logged in successfully...')

      const isLoggedIn = await this.checkIfLoggedIn(page);

      if (!isLoggedIn) {
        statusLog(logSection, 'Error! Scraper not logged in into LinkedIn')
        throw new Error('Scraper not logged in into LinkedIn')
      }

      statusLog(logSection, 'Done!')

      return {
        page,
        browser: this.browser
      }
    } catch (err) {
      // Kill Puppeteer
      await this.close();

      statusLog(logSection, 'An error occurred during setup.')

      throw err
    }
  };

  /**
   * Create a Puppeteer page with some extra settings to speed up the crawling process.
   */
  private createPage = async (): Promise<Page> => {
    const logSection = 'setup page'

    if (!this.browser) {
      throw new Error('Browser not set.');
    }

    // Important: Do not block "stylesheet", makes the crawler not work for LinkedIn
    const blockedResources = ['image', 'media', 'font', 'texttrack', 'object', 'beacon', 'csp_report', 'imageset'];

    try {
      const page = await this.browser.newPage()

      // Use already open page
      // This makes sure we don't have an extra open tab consuming memory
      const firstPage = (await this.browser.pages())[0];
      await firstPage.close();

      // Method to create a faster Page
      // From: https://github.com/shirshak55/scrapper-tools/blob/master/src/fastPage/index.ts#L113
      const session = await page.target().createCDPSession()
      await page.setBypassCSP(true)
      await session.send('Page.enable');
      await session.send('Page.setWebLifecycleState', {
        state: 'active',
      });

      statusLog(logSection, `Blocking the following resources: ${blockedResources.join(', ')}`)

      // A list of hostnames that are trackers
      // By blocking those requests we can speed up the crawling
      // This is kinda what a normal adblocker does, but really simple
      const blockedHosts = this.getBlockedHosts();
      const blockedResourcesByHost = ['script', 'xhr', 'fetch', 'document']

      statusLog(logSection, `Should block scripts from ${Object.keys(blockedHosts).length} unwanted hosts to speed up the crawling.`);

      // Block loading of resources, like images and css, we dont need that
      await page.setRequestInterception(true);

      page.on('request', (req) => {
        if (blockedResources.includes(req.resourceType())) {
          return req.abort()
        }

        const hostname = getHostname(req.url());

        // Block all script requests from certain host names
        if (blockedResourcesByHost.includes(req.resourceType()) && hostname && blockedHosts[hostname] === true) {
          statusLog('blocked script', `${req.resourceType()}: ${hostname}: ${req.url()}`);
          return req.abort();
        }

        return req.continue()
      })

      await page.setUserAgent(this.userAgent)

      await page.setViewport({
        width: 1200,
        height: 720
      })

      statusLog(logSection, `Setting session cookie using cookie: ${process.env.LINKEDIN_SESSION_COOKIE_VALUE}`)

      await page.setCookie({
        'name': 'li_at',
        'value': this.sessionCookieValue,
        'domain': '.www.linkedin.com'
      })

      statusLog(logSection, 'Session cookie set!')

      statusLog(logSection, 'Done!')

      return page;
    } catch (err) {
      // Kill Puppeteer
      await this.close();

      statusLog(logSection, 'An error occurred during page setup.')

      throw err
    }
  };

  /**
   * Method to block know hosts that have some kind of tracking.
   * By blocking those hosts we speed up the crawling.
   * 
   * More info: http://winhelp2002.mvps.org/hosts.htm
   */
  private getBlockedHosts = (): object => {
    const blockedHostsArray = blockedHostsList.split('\n');

    let blockedHostsObject = blockedHostsArray.reduce((prev, curr) => {
      const frags = curr.split(' ');

      if (frags.length > 1 && frags[0] === '0.0.0.0') {
        prev[frags[1].trim()] = true;
      }

      return prev;
    }, {});

    blockedHostsObject = {
      ...blockedHostsObject,
      'static.chartbeat.com': true,
      'scdn.cxense.com': true,
      'api.cxense.com': true,
      'www.googletagmanager.com': true,
      'connect.facebook.net': true,
      'platform.twitter.com': true,
      'tags.tiqcdn.com': true,
      'dev.visualwebsiteoptimizer.com': true,
      'smartlock.google.com': true,
      'cdn.embedly.com': true
    }

    return blockedHostsObject;
  }

  /**
   * Method to complete kill any Puppeteer process still active.
   * Freeing up memory.
   */
  public close = (page?: Page): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      const loggerPrefix = 'close';

      if (page) {
        try {
          statusLog(loggerPrefix, 'Closing page...');
          await page.close();
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

  /**
   * Simple method to check if the session is still active.
   */
  public checkIfLoggedIn = async (page: Page) => {
    const logSection = 'checkIfLoggedIn';

    if (!page) {
      throw new Error('Page is not set.')
    }

    statusLog(logSection, 'Check if we are still logged in...')

    const isLoggedIn = await page.$('#login-email') === null

    if (isLoggedIn) {
      statusLog(logSection, 'All good. We are still logged in.')
    } else {
      const errorMessage = 'Bad news. We are not logged in. Session is expired or our check to see if we are loggedin is not correct anymore.';
      statusLog(logSection, errorMessage)
      throw new Error(errorMessage)
    }

    return isLoggedIn
  };

  /**
   * Method to scrape a user profile.
   */
  public run = async (profileUrl: string) => {
    const logSection = 'run'

    const scraperSessionId = new Date().getTime();

    if (!this.browser) {
      throw new Error('Browser is not set. Please run the setup method first.')
    }

    if (!profileUrl) {
      throw new Error('No profileUrl given.')
    }

    if (!profileUrl.includes('linkedin.com/')) {
      throw new Error('The given URL to scrape is not a linkedin.com url.')
    }

    try {
      // Eeach run has it's own page
      const page = await this.createPage();

      statusLog(logSection, `Navigating to LinkedIn profile: ${profileUrl}`, scraperSessionId)

      await page.goto(profileUrl, {
        // Use "networkidl2" here and not "domcontentloaded". 
        // As with "domcontentloaded" some elements might not be loaded correctly, resulting in missing data.
        waitUntil: 'networkidle2',
        timeout: this.timeout
      });

      statusLog(logSection, 'LinkedIn profile page loaded!', scraperSessionId)

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

      statusLog(logSection, 'Parsing profile data...', scraperSessionId)

      const rawUserProfileData: RawProfile = await page.evaluate(() => {
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

      const rawExperiencesData: RawExperience[] = await page.$$eval('#experience-section ul > .ember-view', (nodes) => {
        let data: RawExperience[] = []

        // Using a for loop so we can use await inside of it
        for (const node of nodes) {
          const titleElement = node.querySelector('h3');
          const title = titleElement?.textContent || null

          const employmentTypeElement = node.querySelector('span.pv-entity__secondary-title');
          const employmentType = employmentTypeElement?.textContent || null

          const companyElement = node.querySelector('.pv-entity__secondary-title');
          const companyElementClean = companyElement ? companyElement?.querySelector('span') && companyElement?.removeChild(companyElement.querySelector('span') as Node) && companyElement : null;
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

      const rawEducationData: RawEducation[] = await page.$$eval('#education-section ul > .ember-view', (nodes) => {
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

      const skills: Skill[] = await page.$$eval('.pv-skill-categories-section ol > .ember-view', nodes => {
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

      if (!this.keepAlive) {
        statusLog(logSection, 'Not keeping the session alive.')
        await this.close(page)
        statusLog(logSection, 'Done. Puppeteer is closed.')
      } else {
        statusLog(logSection, 'Done. Puppeteer is being kept alive in memory.')
        // Only close the current page, we do not need it anymore
        await page.close()
      }

      return {
        userProfile,
        experiences,
        education,
        skills
      }
    } catch (err) {
      // Kill Puppeteer
      await this.close()

      statusLog(logSection, 'An error occurred during a run.')

      // Throw the error up, allowing the user to handle this error himself.
      throw err;
    }
  }
}

export default LinkedInProfileScraper;
module.exports = LinkedInProfileScraper;
