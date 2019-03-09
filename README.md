# LinkedIn Profile Scraper
LinkedIn profile scraper using Puppeteer headless browser. So you can use it on a server. Returns structured data in JSON format.

## Getting started
In order to scrape LinkedIn profiles, we need to make sure the scraper is logged in into LinkedIn. For that you need to find your account's session cookie. I suggest creating a new account on LinkedIn and enable all the privacy options so people don't see you visiting their profiles when using the scraper.

### Setup
1. Use your browser to signin into LinkedIn with the account you want to use for scraping.
2. After login, open your browser's Dev Tools and find the cookie with the name `li_at`. Remember the value of that cookie.
3. Create a `.env` file in the root of this project
4. Fill it with `LINKEDIN_SESSION_COOKIE_VALUE="the_value_from_step_2"`

### Starting
1. Run `npm start`
2. Get a LinkedIn profile, like: http://localhost:3000/?url=https://www.linkedin.com/in/barackobama/

Example response:

```json
{
  "userProfile": {
    "fullName": "Barack Obama",
    "title": "Former President of the United States of America",
    "location": {
      "city": "Washington D.C. Metro"
    },
    "photo": "https://media.licdn.com/dms/image/C4E03AQF2C6iUecWOnQ/profile-displayphoto-shrink_800_800/0?e=1552521600&v=beta&t=s7v_meT4DPvYHiKWdhtuHy_XUHq0DcLu-uKGnbImQjc",
    "description": "“It falls to each of us to be those anxious, jealous guardians of our democracy; to embrace the joyous task we’ve been given to continually try to improve this great nation of ours. Because for all our outward differences, we all share the same proud title: Citizen.” https://barackobama.com/ https://obamawhitehouse.archives.gov/",
    "url": "https://www.linkedin.com/in/barackobama/"
  },
  "experiences": [
    {
      "title": "President",
      "company": "United States of America",
      "location": null,
      "startDate": "2009-01-01T00:00:00+01:00",
      "endDate": "2017-01-01T00:00:00+01:00",
      "durationInDays": 2923,
      "description": "I served as the 44th President of the United States of America."
    },
    {
      "title": "US Senator",
      "company": "US Senate (IL-D)",
      "location": null,
      "startDate": "2005-01-01T00:00:00+01:00",
      "endDate": "2008-11-01T00:00:00+01:00",
      "durationInDays": 1401,
      "description": "In the U.S. Senate, I sought to focus on tackling the challenges of a globalized, 21st century world with fresh thinking and a politics that no longer settles for the lowest common denominator."
    },
    {
      "title": "State Senator",
      "company": "Illinois State Senate",
      "location": null,
      "startDate": "1997-01-01T00:00:00+01:00",
      "endDate": "2004-01-01T00:00:00+01:00",
      "durationInDays": 2557,
      "description": "Proudly representing the 13th District on Chicago's south side."
    },
    {
      "title": "Senior Lecturer in Law",
      "company": "University of Chicago Law School",
      "location": null,
      "startDate": "1993-01-01T00:00:00+01:00",
      "endDate": "2004-01-01T00:00:00+01:00",
      "durationInDays": 4018,
      "description": null
    }
  ],
  "education": [
    {
      "schoolName": "Harvard University",
      "degreeName": "Juris Doctor",
      "fieldOfStudy": "Law",
      "startDate": "1988-01-01T00:00:00+01:00",
      "endDate": "1991-01-01T00:00:00+01:00",
      "durationInDays": 1097
    },
    {
      "schoolName": "Columbia University in the City of New York",
      "degreeName": "Bachelor of Arts",
      "fieldOfStudy": "Political Science, concentration in International Relations",
      "startDate": "1981-01-01T00:00:00+01:00",
      "endDate": "1983-01-01T00:00:00+01:00",
      "durationInDays": 731
    },
    {
      "schoolName": "Occidental College",
      "degreeName": null,
      "fieldOfStudy": "Political Science",
      "startDate": "1979-01-01T00:00:00+01:00",
      "endDate": "1981-01-01T00:00:00+01:00",
      "durationInDays": 732
    }
  ],
  "skills": []
}
```

### About using the session cookie
This script uses the session cookie of a succesfull login into LinkedIn, instead of an e-mail and password to set you logged in. I did this because LinkedIn has security measures by blocking login requests from unknown locations or requiring you to fill in Captcha's upon login. So, if you run this from a server and try to login with an e-mail address and password, your login could be blocked. By using a known session, we prevent this from happening and allows you to use this scraper on any server on any location.

So, using a session cookie is the most reliable way that I currently know.

You probably need to follow the setup steps when the scraper logs show it's not logged in anymore.

### About the performance
- Upon start we will open a headless browser session, that session is kept alive and is re-used everytime someone requests profile data. It uses about 400MB memory when in idle.
- Scraping usually takes a few seconds, because the script needs to scroll through the page and expand several elements in order for all the data to appear.

### Usage limits
Read: [LinkedIn Commercial Use Limit](https://www.linkedin.com/help/linkedin/answer/52950)
