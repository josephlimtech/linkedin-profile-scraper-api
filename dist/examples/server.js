"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require('dotenv').config();
const express_1 = tslib_1.__importDefault(require("express"));
const index_1 = require("../index");
const app = express_1.default();
(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const scraper = new index_1.LinkedInProfileScraper({
        sessionCookieValue: `${process.env.LINKEDIN_SESSION_COOKIE_VALUE}`,
        keepAlive: true,
    });
    yield scraper.setup();
    app.get('/', (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        const urlToScrape = req.query.url;
        const result = yield scraper.run(urlToScrape);
        return res.json(result);
    }));
    app.listen(process.env.PORT || 3000);
}))();
//# sourceMappingURL=server.js.map