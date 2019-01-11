const moment = require('moment');

const formatDate = (date) => {
  let formattedDate
  // date = "Present", "2018", "Dec 2018"
  if(date === 'Present') {
    formattedDate = moment().format()
  } else {
    formattedDate = moment(date, 'MMMY').format()
  }

  return formattedDate
}

const getDurationInDays = (formattedStartDate, formattedEndDate) => {
  // +1 to include the start date
  return moment(formattedStartDate).diff(moment(formattedEndDate), 'days') + 1
}

module.exports = {
  formatDate,
  getDurationInDays
}
