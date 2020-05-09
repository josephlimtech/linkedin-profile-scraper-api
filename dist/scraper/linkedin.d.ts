import puppeteer from 'puppeteer';
import { Location } from '../utils';
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
    startDate: string | null;
    endDate: string | null;
    endDateIsPresent: boolean;
    durationInDays: number | null;
    description: string;
}
interface Education {
    schoolName: string;
    degreeName: string;
    fieldOfStudy: string;
    startDate: string | null;
    endDate: string | null;
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
