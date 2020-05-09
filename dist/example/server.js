"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require('dotenv').config();
const express_1 = tslib_1.__importDefault(require("express"));
const app = express_1.default();
const port = process.env.PORT || 3000;
const linkedin_1 = require("../scraper/linkedin");
console.log(`Server setup: Setting up...`);
(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page } = yield linkedin_1.setupScraper();
        app.get('/status', (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            const isLoggedIn = yield linkedin_1.checkIfLoggedIn(page);
            if (isLoggedIn) {
                res.json({ status: 'success', message: 'Still logged in into LinkedIn.' });
            }
            else {
                res.json({ status: 'fail', message: 'We are logged out of LinkedIn, or our logged in check is not working anymore.' });
            }
        }));
        app.get('/', (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            const urlToScrape = req.query.url;
            if (urlToScrape === null || urlToScrape === void 0 ? void 0 : urlToScrape.includes('linkedin.com/')) {
                const linkedinProfileDetails = yield linkedin_1.getLinkedinProfileDetails(page, urlToScrape);
                res.json(linkedinProfileDetails);
            }
            else {
                res.json({
                    message: 'Missing the url parameter. Or given URL is not an LinkedIn URL.'
                });
            }
        }));
    }
    catch (err) {
        console.log('Error during setup');
        console.log(err);
        app.get('/', (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            res.json({
                message: 'An error occurred',
                error: (err.message) ? err.message : null
            });
        }));
    }
    app.listen(port, () => console.log(`Server setup: All done. Listening on port ${port}!`));
}))();
//# sourceMappingURL=server.js.map