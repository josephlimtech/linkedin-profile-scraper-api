# LinkedIn Profile Scraper
LinkedIn profile scraper using Puppeteer headless browser. So you can use it on a server. Returns structured data in JSON format. Works in 2020.

This scraper will extract publicly available data:

**🧑‍🎨 Profile:** name, title, location, picture, description and url

**👨‍💼 Experiences:** title, company name, location, duration, start date, end date and the description

**👨‍🎓 Education:** school name, degree name, start date and end date

**🦸 Volunteer experiences:** title, company, description, start date and end date name

**🏋️‍♂️ Skills:** name and endorsement count

All dates are formatted to a generic format.

## Getting started
In order to scrape LinkedIn profiles, you need to make sure the scraper is logged-in into LinkedIn. For that you need to find your account's session cookie. I suggest creating a new account on LinkedIn and enable all the privacy options so people don't see you visiting their profiles when using the scraper.

1. Create a new account on LinkedIn, or use one you already have
2. Login to that account using your browser
3. Open your browser's Dev Tools to find the cookie with the name `li_at`. Use that value for `sessionCookieValue` when setting up the scraper.
4. Install: `npm install linkedin-profile-scraper`

## Usage
```typescript
// TypeScript
import { LinkedInProfileScraper } from 'linkedin-profile-scraper';

// Plain Javascript
// const { LinkedInProfileScraper } = require('linkedin-profile-scraper')

(async() => {
  const scraper = new LinkedInProfileScraper({
    sessionCookieValue: 'LI_AT_COOKIE_VALUE',
    keepAlive: false
  });

  // Prepare the scraper
  // Loading it in memory
  await scraper.setup()

  const result = await scraper.run('https://www.linkedin.com/in/jvandenaardweg/')
  
  console.log(result)
})()
```

See [src/examples](https://github.com/jvandenaardweg/linkedin-profile-scraper/tree/master/src/examples) for more examples.

See [Example response](#example-response) for an example response.

## Faster recurring scrapes
Set `keepAlive` to `true` to keep Puppeteer running in the background for faster recurring scrapes. This will keep your memory usage high as Puppeteer will sit idle in the background.

By default the scraper will close after a successful scrape. Freeing up your memory.

## Detect when session is expired
Known LinkedIn sessions could expire after some time. This usually happens when you do not use LinkedIn for a while. The scraper can notify you about this specifically, so you can act upon that.

You should obtain a new `li_at` cookie value from the LinkedIn.com website when this error shows and update the `sessionCookieValue` with that new value. For that, follow the [Getting started](#getting-started) steps above in this readme.

```typescript
(async() => {
  try {
    const scraper = new LinkedInProfileScraper({
      sessionCookieValue: 'LI_AT_COOKIE_VALUE'
    });

    await scraper.setup()

    const result = await scraper.run('https://www.linkedin.com/in/jvandenaardweg/')
  
    console.log(result)
  } catch (err) {
    if (err.name === 'SessionExpired) {
      // Do something when the scraper notifies you it's not logged-in anymore
    }
  }
})()
```

## Example response

```json
{
  "userProfile": {
    "fullName": "Nat Friedman",
    "title": "CEO at GitHub",
    "location": {
      "city": "San Francisco",
      "province": "California",
      "country": null
    },
    "photo": "https://media-exp1.licdn.com/dms/image/C5603AQE4l0oJ3jxk9A/profile-displayphoto-shrink_200_200/0?e=1595462400&v=beta&t=Q3Ai4vRCFwUXK_M68mCFaQNn8kZF6QGJnuupJV0lFwo",
    "description": null,
    "url": "https://www.linkedin.com/in/natfriedman/"
  },
  "experiences": [
    {
      "title": "CEO",
      "company": "GitHub",
      "employmentType": null,
      "location": {
        "city": null,
        "province": "San Francisco Bay",
        "country": null
      },
      "startDate": "2018-10-01T00:00:00+02:00",
      "endDate": "2020-05-20T17:23:33+02:00",
      "endDateIsPresent": true,
      "description": null,
      "durationInDays": 598
    },
    {
      "title": "Cofounder",
      "company": "AI Grant",
      "employmentType": null,
      "location": null,
      "startDate": "2017-04-01T00:00:00+02:00",
      "endDate": "2020-05-20T17:23:33+02:00",
      "endDateIsPresent": true,
      "description": "AI Grant is a non-profit distributed research lab. We fund brilliant minds across the world to work on cutting-edge artificial intelligence projects. Almost all of the work we sponsor is open source, and we evaluate applications on the strength of the applicants and their ideas, with no credentials required. To date we have provided over $500,000 in money and resources to more than fifty teams around the world. … see more",
      "durationInDays": 1146
    },
    {
      "title": "Cofounder, Chairman",
      "company": "California YIMBY",
      "employmentType": null,
      "location": {
        "city": "Sacramento",
        "province": "California",
        "country": null
      },
      "startDate": "2017-04-01T00:00:00+02:00",
      "endDate": "2020-05-20T17:23:33+02:00",
      "endDateIsPresent": true,
      "description": "California YIMBY is a statewide housing policy organization I cofounded in 2017. Our goal is to systematically alter state policy to increase the rate of home building and address the statewide housing shortage in California. Denser housing reduces poverty, increases intergenerational socieconomic mobility, reduces carbon emissions, accelerates economic growth, reduces displacement, and improves well-being. … see more",
      "durationInDays": 1146
    },
    {
      "title": "Corporate Vice President, Developer Services",
      "company": "Microsoft",
      "employmentType": null,
      "location": {
        "city": "San Francisco",
        "province": null,
        "country": null
      },
      "startDate": "2016-03-01T00:00:00+01:00",
      "endDate": "2020-05-20T17:23:33+02:00",
      "endDateIsPresent": true,
      "description": "At Microsoft I am responsible for Visual Studio Team Services and App Center, application lifecycle and devops services with more than a million users. I am also responsible for the internal company-wide engineering systems.",
      "durationInDays": 1542
    },
    {
      "title": "Advisor",
      "company": "Stripe",
      "employmentType": null,
      "location": null,
      "startDate": "2011-05-01T00:00:00+02:00",
      "endDate": "2020-05-20T17:23:33+02:00",
      "endDateIsPresent": true,
      "description": "We were one of Stripe's first customers before they launched, and since then I've enjoyed advising them on matters large and small. Patrick and John are amazing and I'm certain I've learned more than I've helped!",
      "durationInDays": 3308
    },
    {
      "title": "CEO and Cofounder",
      "company": "Xamarin",
      "employmentType": null,
      "location": {
        "city": "San Francisco",
        "province": null,
        "country": null
      },
      "startDate": "2011-05-01T00:00:00+02:00",
      "endDate": "2016-03-01T00:00:00+01:00",
      "endDateIsPresent": false,
      "description": "At Xamarin our mission was to make mobile development fast, easy, and fun. Xamarin allows developers to write native apps for iOS and Android using C#. We also built a number of other mobile development tools, including app monitoring and testing services, and a developer training program.In 4.5 years, the company grew to $50M ARR and thousands of paying customers. Xamarin is where I fell in love with go-to-market and sales. We built two successful sales models: a high-velocity, low-touch inside sales model, and a more traditional enterprise model. Both models benefited from strong inbound marketing and thousands of daily signups.The company was 350 people when we were acquired by Microsoft. … see more",
      "durationInDays": 1767
    },
    {
      "title": "Chief Technology Officer, Open Source",
      "company": "Novell",
      "employmentType": null,
      "location": null,
      "startDate": "2003-01-01T00:00:00+01:00",
      "endDate": "2009-01-01T00:00:00+01:00",
      "endDateIsPresent": false,
      "description": "After Novell bought my company, I led all the Linux client efforts and served as CTO for open source. I also ran GroupWise, a $150M collaboration product.",
      "durationInDays": 2193
    },
    {
      "title": "Cofounder, Chairman",
      "company": "GNOME Foundation",
      "employmentType": null,
      "location": null,
      "startDate": "2000-01-01T00:00:00+01:00",
      "endDate": "2003-01-01T00:00:00+01:00",
      "endDateIsPresent": false,
      "description": "The GNOME Foundation works to further the goal of the GNOME project: to create a computing platform for use by the general public that is composed entirely of free software. Many companies were involved in GNOME, so I co-created the GNOME Foundation to provide independent governance for the project. It was one of the first such open source foundations.",
      "durationInDays": 1097
    },
    {
      "title": "Cofounder, CEO",
      "company": "Ximian",
      "employmentType": null,
      "location": null,
      "startDate": "1999-01-01T00:00:00+01:00",
      "endDate": "2003-01-01T00:00:00+01:00",
      "endDateIsPresent": false,
      "description": null,
      "durationInDays": 1462
    }
  ],
  "education": [
    {
      "schoolName": "Massachusetts Institute of Technology",
      "degreeName": "Bachelor of Science",
      "fieldOfStudy": "Mathematics",
      "startDate": "1995-01-01T00:00:00+01:00",
      "endDate": "1999-01-01T00:00:00+01:00",
      "durationInDays": 1462
    },
    {
      "schoolName": "Massachusetts Institute of Technology",
      "degreeName": "Bachelor of Science",
      "fieldOfStudy": "Computer Science",
      "startDate": "1995-01-01T00:00:00+01:00",
      "endDate": "1999-01-01T00:00:00+01:00",
      "durationInDays": 1462
    }
  ],
  "volunteerExperiences": [],
  "skills": [
    {
      "skillName": "Mobile Applications",
      "endorsementCount": 99
    },
    {
      "skillName": "Software Development",
      "endorsementCount": 99
    },
    {
      "skillName": "Cloud Computing",
      "endorsementCount": 96
    },
    {
      "skillName": "Software Engineering",
      "endorsementCount": 57
    },
    {
      "skillName": "Start-ups",
      "endorsementCount": 40
    },
    {
      "skillName": "Agile Methodologies",
      "endorsementCount": 25
    },
    {
      "skillName": "Product Management",
      "endorsementCount": 24
    },
    {
      "skillName": "Web Applications",
      "endorsementCount": 20
    },
    {
      "skillName": "Web Services",
      "endorsementCount": 13
    },
    {
      "skillName": "Entrepreneurship",
      "endorsementCount": 12
    },
    {
      "skillName": "User Experience",
      "endorsementCount": 9
    },
    {
      "skillName": "Startups",
      "endorsementCount": 5
    },
    {
      "skillName": "Strategy",
      "endorsementCount": 1
    },
    {
      "skillName": "SaaS",
      "endorsementCount": 63
    },
    {
      "skillName": "Open Source",
      "endorsementCount": 46
    },
    {
      "skillName": "Linux",
      "endorsementCount": 30
    },
    {
      "skillName": "C#",
      "endorsementCount": 24
    },
    {
      "skillName": "Git",
      "endorsementCount": 5
    },
    {
      "skillName": "AJAX",
      "endorsementCount": 3
    },
    {
      "skillName": "jQuery",
      "endorsementCount": 2
    },
    {
      "skillName": "Ruby",
      "endorsementCount": 1
    },
    {
      "skillName": "Strategic Partnerships",
      "endorsementCount": 20
    },
    {
      "skillName": "Leadership",
      "endorsementCount": 0
    },
    {
      "skillName": "Management",
      "endorsementCount": 0
    }
  ]
}
```

### About using the session cookie
This module uses the session cookie of a succesfull login into LinkedIn, instead of an e-mail and password to set you logged-in. I did this because LinkedIn has security measures by blocking login requests from unknown locations or requiring you to fill in Captcha's upon login. So, if you run this from a server and try to login with an e-mail address and password, your login could be blocked. By using a known session, we prevent this from happening and allows you to use this scraper on any server on any location.

So, using a session cookie is the most reliable way that I currently know.

You probably need to follow the setup steps when the scraper logs show it's not logged-in anymore.

### About the performance
- Upon start the module will open a headless browser session using Chromium. That session could be kept alive using the `keepAlive` option. Chromium uses about 75MB memory when in idle.
- Scraping usually takes a few seconds, because the script needs to scroll through the page and expand several elements in order for all the data to appear.

### Usage limits
LinkedIn has some usage limits in place. Please respect those and use their options to increase limits. More info: [LinkedIn Commercial Use Limit](https://www.linkedin.com/help/linkedin/answer/52950)
