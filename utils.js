const moment = require('moment');
const textMiner = require('text-miner');

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
  // Text is something like: Amsterdam Area, Netherlands

  if (!text) return null

  const cleanText = text.replace(' Area', '')

  const city = (cleanText) ? cleanText.split(', ')[0] : null
  const country = (cleanText) ? cleanText.split(', ')[1] : null

  return {
    city,
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

module.exports = {
  formatDate,
  getDurationInDays,
  getCleanText,
  getLocationFromText
}
