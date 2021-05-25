"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require('dotenv').config();
const index_1 = require("../index");
(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const scraper = new index_1.LinkedInProfileScraper({
        sessionCookieValue: `${process.env.LINKEDIN_SESSION_COOKIE_VALUE}`,
        keepAlive: false
    });
    yield scraper.setup();
    const result = yield scraper.run('https://www.linkedin.com/in/jvandenaardweg/');
    console.log(result);
}))();
//# sourceMappingURL=module.js.map