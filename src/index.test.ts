import { LinkedInProfileScraper } from './index'

const defaultOptions = {
  headless: true,
  keepAlive: false,
  sessionCookieValue: 'test',
  timeout: 10000,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36'
}

describe('LinkedInProfileScraper', () => {

  describe('constructor', () => {
    it('should set the default options', () => {
      const scraper = new LinkedInProfileScraper({
        sessionCookieValue: 'test'
      });

      expect(scraper.options).toMatchObject(defaultOptions)
    });
    
    it('should set the headless option', () => {
      const scraper = new LinkedInProfileScraper({
        headless: false,
        sessionCookieValue: 'test'
      });

      expect(scraper.options).toMatchObject({
        ...defaultOptions,
        headless: false
      })
    });
    
    it('should set the headless option', () => {
      const scraper = new LinkedInProfileScraper({
        keepAlive: true,
        sessionCookieValue: 'test'
      });

      expect(scraper.options).toMatchObject({
        ...defaultOptions,
        keepAlive: true,
      })
    });
    
    it('should set the sessionCookieValue option', () => {
      const scraper = new LinkedInProfileScraper({
        sessionCookieValue: 'test-again'
      });

      expect(scraper.options).toMatchObject({
        ...defaultOptions,
        sessionCookieValue: 'test-again',
      })
    });
    
    it('should set the timeout option', () => {
      const scraper = new LinkedInProfileScraper({
        timeout: 30000,
        sessionCookieValue: 'test'
      });

      expect(scraper.options).toMatchObject({
        ...defaultOptions,
        timeout: 30000,
      })
    });
    
    it('should set the userAgent option', () => {
      const scraper = new LinkedInProfileScraper({
        userAgent: 'test agent',
        sessionCookieValue: 'test'
      });

      expect(scraper.options).toMatchObject({
        ...defaultOptions,
        userAgent: 'test agent',
      })
    });
  })
})
