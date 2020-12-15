import {LinkedInProfileScraper} from './index';

(async () => {
  const scraper = new LinkedInProfileScraper({
    sessionCookieValue: 'AQEDAQCd1L4AgDvCAAABdknrcUMAAAF2bff1Q1YA0eW1xL-Z7hU-zSGst8bhKcQYkGLX2cokekG-PyFs1f7ewMfF0j3stsI_VCHBGQc9p9d18qQeVTx2AIc7BqSnCrGoN89i3nPdlyX8CingWvEuAiBI',
    keepAlive: false
  });

// Prepare the scraper
// Loading it in memory
  await scraper.setup();

  const result = await scraper.run('https://www.linkedin.com/in/yossi-kahlon-a7a5693/');
  console.log(result);
})();
