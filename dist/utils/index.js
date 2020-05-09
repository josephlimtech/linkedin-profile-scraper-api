"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const moment_1 = tslib_1.__importDefault(require("moment"));
exports.formatDate = (date) => {
    if (date === 'Present') {
        return moment_1.default().format();
    }
    return moment_1.default(date, 'MMMY').format();
};
exports.getDurationInDays = (formattedStartDate, formattedEndDate) => {
    if (!formattedStartDate || !formattedEndDate)
        return null;
    return moment_1.default(formattedEndDate).diff(moment_1.default(formattedStartDate), 'days') + 1;
};
exports.getLocationFromText = (text) => {
    if (!text)
        return null;
    const cleanText = text.replace(' Area', '').trim();
    const parts = cleanText.split(', ');
    let city = null;
    let province = null;
    let country = null;
    if (parts.length === 3) {
        city = parts[0];
        province = parts[1];
        country = parts[2];
    }
    if (parts.length === 2) {
        city = parts[0];
        country = parts[1];
    }
    if (parts.length === 1) {
        city = parts[0];
    }
    return {
        city,
        province,
        country
    };
};
exports.getCleanText = (text) => {
    const regexRemoveMultipleSpaces = / +/g;
    const regexRemoveLineBreaks = /(\r\n\t|\n|\r\t)/gm;
    if (!text)
        return null;
    const cleanText = text
        .replace(regexRemoveLineBreaks, '')
        .replace(regexRemoveMultipleSpaces, ' ')
        .replace('...', '')
        .replace('See more', '')
        .replace('See less', '')
        .trim();
    return cleanText;
};
exports.statusLog = (section, message, scraperSessionId) => {
    const sessionPart = (scraperSessionId) ? ` (${scraperSessionId})` : '';
    const messagePart = (message) ? `: ${message}` : null;
    return console.log(`Scraper (${section})${sessionPart}${messagePart}`);
};
//# sourceMappingURL=index.js.map