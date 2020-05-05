const moment = require('moment');

const formatDate = (date) => {
  let formattedDate
  // date = "Present", "2018", "Dec 2018"
  if (date === 'Present') {
    formattedDate = moment().format()
  } else {
    formattedDate = moment(date, 'MMMY').format()
  }

  return formattedDate
}

const getDurationInDays = (formattedStartDate, formattedEndDate) => {
  if (!formattedStartDate || !formattedEndDate) return null
  // +1 to include the start date
  return moment(formattedEndDate).diff(moment(formattedStartDate), 'days') + 1
}

const getLocationFromText = async (text) => {
  // Text is something like: Amsterdam Oud-West, North Holland Province, Netherlands

  if (!text) return null

  const cleanText = text.replace(' Area', '').trim();

  const parts = cleanText.split(', ');

  let city = null
  let province = null
  let country = null

  if (parts.length === 3) {
    city = parts[0]
    province = parts[1]
    country = parts[2]
  }

  if (parts.length === 2) {
    city = parts[0]
    country = parts[1]
  }

  if (parts.length === 1) {
    city = parts[0]
  }

  return {
    city,
    province,
    country
  }
}

const getCleanText = async (text) => {
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

const statusLog = async (section, message, scraperSessionId) => {
  const sessionPart = (scraperSessionId) ? ` (${scraperSessionId})` : ''
  const messagePart = (message) ? `: ${message}` : null
  return console.log(`Scraper (${section})${sessionPart}${messagePart}`)
}

module.exports = {
  formatDate,
  getDurationInDays,
  getCleanText,
  getLocationFromText,
  statusLog
}
