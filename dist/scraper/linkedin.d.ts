import puppeteer from 'puppeteer';
interface Location {
    city: string | null;
    province: string | null;
    country: string | null;
}
interface Profile {
    fullName: string;
    title: string;
    location: Location | null;
    photo: string;
    description: string;
    url: string;
}
interface Experience {
    title: string;
    company: string;
    employmentType: string;
    location: Location | null;
    startDate: string;
    endDate: string;
    endDateIsPresent: boolean;
    durationInDays: number | null;
    description: string;
}
interface Education {
    schoolName: string;
    degreeName: string;
    fieldOfStudy: string;
    startDate: string;
    endDate: string;
    durationInDays: number | null;
}
interface Skill {
    skillName: string | null;
    endorsementCount: number | null;
}
export declare const setupScraper: () => Promise<{
    page: puppeteer.Page;
    browser: puppeteer.Browser;
}>;
export declare const checkIfLoggedIn: (page: any) => Promise<boolean>;
export declare const getLinkedinProfileDetails: (page: any, profileUrl: any) => Promise<{
    userProfile: Profile;
    experiences: Experience[];
    education: Education[];
    skills: Skill[];
}>;
export {};
