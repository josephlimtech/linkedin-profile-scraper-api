import moment from 'moment';
export declare const formatDate: (date: moment.MomentInput) => any;
export declare const getDurationInDays: (formattedStartDate: any, formattedEndDate: any) => number | null;
export declare const getLocationFromText: (text: string) => Promise<{
    city: string | null;
    province: string | null;
    country: string | null;
} | null>;
export declare const getCleanText: (text: string) => Promise<string | null>;
export declare const statusLog: (section: string, message: string, scraperSessionId?: string | number | undefined) => Promise<void>;
