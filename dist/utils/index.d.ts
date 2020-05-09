import moment from 'moment';
export interface Location {
    city: string | null;
    province: string | null;
    country: string | null;
}
export declare const formatDate: (date: moment.MomentInput) => string;
export declare const getDurationInDays: (formattedStartDate: string, formattedEndDate: string | Date) => number | null;
export declare const getLocationFromText: (text: string) => Location | null;
export declare const getCleanText: (text: string) => string | null;
export declare const statusLog: (section: string, message: string, scraperSessionId?: string | number | undefined) => void;
