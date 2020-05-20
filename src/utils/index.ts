import moment from 'moment-timezone'
import { Location } from '../index';
import { Page } from 'puppeteer';
import countries from 'i18n-iso-countries';
import cities from 'all-the-cities';

export const getIsCountry = (text: string): boolean => {
  const countriesList = Object.values(countries.getNames('en'));
  return !!countriesList.find(country => country.toLowerCase() === text.toLowerCase());
}

export const getIsCity = (text: string): boolean => {
  return !!cities.find(city => city.name.toLowerCase() === text.toLowerCase())
}

export const formatDate = (date: moment.MomentInput | string): string => {
  if (date === 'Present') {
    return moment().format()
  }

  return moment(date, 'MMMY').format()
}

export const getDurationInDays = (formattedStartDate: string, formattedEndDate: Date | string): number | null => {
  if (!formattedStartDate || !formattedEndDate) return null
  // +1 to include the start date
  return moment(formattedEndDate).diff(moment(formattedStartDate), 'days') + 1
}

export const getLocationFromText = (text: string): Location | null => {
  // Text is something like: Amsterdam Oud-West, North Holland Province, Netherlands

  if (!text) return null

  const cleanText = text.replace(' Area', '').trim();
  const parts = cleanText.split(', ');

  let city: null | string = null
  let province: null | string = null
  let country: null | string = null

  // If there are 3 parts, we can be sure of the order of each part
  // So that must be a: city, province/state and country
  if (parts.length === 3) {
    city = parts[0]
    province = parts[1]
    country = parts[2]

    return {
      city,
      province,
      country
    }
  }

  // If we only have 2 parts, we don't know exactly what each part is;
  // it could still be: city, province/state or a country
  // For example: Sacramento, California Area
  if (parts.length === 2) {
    // 2 possible scenario's are most likely. We strictly check for the following:
    // first: city + country
    // second: city + province/state

    if (getIsCity(parts[0]) && getIsCountry(parts[1])) {
      return {
        city: parts[0],
        province,
        country: parts[1]
      }
    }

    // If the second part is NOT a country, it's probably a province/state
    if (getIsCity(parts[0]) && !getIsCountry(parts[1])) {
      return {
        city: parts[0],
        province: parts[1],
        country
      }
    }

    return {
      city,
      province: parts[0],
      country: parts[1]
    }
  }

  // If we only have one part we'll end up here

  // Just find out if it's one of: city, province/state or country
  if (getIsCountry(parts[0])) {
    return {
      city,
      province,
      country: parts[0]
    }
  } 
  
  if (getIsCity(parts[0])) {
    return {
      city: parts[0],
      province,
      country
    }
  }

  // Else, it must be a province/state. We just don't know and assume it is.
  return {
    city,
    province: parts[0],
    country
  }
}

export const getCleanText = (text: string | null) => {
  const regexRemoveMultipleSpaces = / +/g
  const regexRemoveLineBreaks = /(\r\n\t|\n|\r\t)/gm

  if (!text) return null

  const cleanText = text
    .replace(regexRemoveLineBreaks, '')
    .replace(regexRemoveMultipleSpaces, ' ')
    .replace('...', '')
    .replace('See more', '')
    .replace('See less', '')
    .trim()

  return cleanText
}

export const statusLog = (section: string, message: string, scraperSessionId?: string | number) => {
  const sessionPart = (scraperSessionId) ? ` (${scraperSessionId})` : ''
  const messagePart = (message) ? `: ${message}` : null
  return console.log(`Scraper (${section})${sessionPart}${messagePart}`)
}

export const autoScroll = async (page: Page) => {
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

export const getHostname = (url: string) => {
  return new URL(url).hostname;
};
