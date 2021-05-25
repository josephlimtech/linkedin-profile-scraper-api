"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require('dotenv').config();
const index_1 = require("../index");
(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const scraper = new index_1.LinkedInProfileScraper({
        sessionCookieValue: `${process.env.LINKEDIN_SESSION_COOKIE_VALUE}`,
        keepAlive: true
    });
    yield scraper.setup();
    const [jvandenaardweg, natfriedman, williamhgates] = yield Promise.all([
        scraper.run('https://www.linkedin.com/in/jvandenaardweg/'),
        scraper.run('https://www.linkedin.com/in/natfriedman/'),
        scraper.run('https://www.linkedin.com/in/williamhgates/'),
    ]);
    yield scraper.close();
    console.log(jvandenaardweg, natfriedman, williamhgates);
}))();
//# sourceMappingURL=list-of-urls.js.map