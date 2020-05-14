import { formatDate, getDurationInDays, getLocationFromText, getCleanText } from './index'

// Make sure our CI uses the same timezone
import moment from 'moment-timezone'
moment.tz.setDefault('Europe/Amsterdam');

describe('utils', () => {

  describe('formatDate()', () => {

    it('should return a formatted date', () => {
      const formattedDate = formatDate(new Date('2020-12-31T01:11:00'));

      expect(formattedDate).toBe('2020-12-31T01:11:00+01:00')
    })

    it('should return the Present date', () => {
      const formattedDate = formatDate('Present');

      expect(formattedDate).toBeTruthy()
    })
  })

  describe('getDurationInDays()', () => {

    it('should return the duration in days between two dates', () => {
      const durationInDays = getDurationInDays('2019-12-31', '2020-12-31');

      expect(durationInDays).toBe(367)
    })
  })

  describe('getLocationFromText()', () => {

    it('should return a location object with a city from a string', () => {
      const location = getLocationFromText('Amsterdam');

      expect(location).toMatchObject({
        city: 'Amsterdam',
        country: null,
        province: null
      })
    })

    it('should return a location object with a city and country from a string', () => {
      const location = getLocationFromText('Amsterdam, The Netherlands');

      expect(location).toMatchObject({
        city: 'Amsterdam',
        country: 'The Netherlands',
        province: null
      })
    })

    it('should return a location object with a city, province and country from a string', () => {
      const location = getLocationFromText('Amsterdam, North-Holland, The Netherlands');

      expect(location).toMatchObject({
        city: 'Amsterdam',
        country: 'The Netherlands',
        province: 'North-Holland'
      })
    })
  })

  describe('getCleanText()', () => {

    it('should return a clean text', () => {
      const cleanText = getCleanText('Some text. See more');

      expect(cleanText).toBe('Some text.')
    })

    it('should return a clean text', () => {
      const cleanText = getCleanText('Some text. See less');

      expect(cleanText).toBe('Some text.')
    })

    it('should return a clean text', () => {
      const cleanText = getCleanText('Some text...');

      expect(cleanText).toBe('Some text')
    })

    it('should return a clean text', () => {
      const cleanText = getCleanText('Some text.\nOn a new line.');

      // TODO: fix space between dot
      expect(cleanText).toBe('Some text.On a new line.')
    })

    it('should return a clean text', () => {
      const cleanText = getCleanText('Some text with  more   spacing.');

      expect(cleanText).toBe('Some text with more spacing.')
    })
  })
})
