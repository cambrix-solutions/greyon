import { EnquiryStatus } from '../common/enums';
export declare class Enquiry {
    id: string;
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
    consent: boolean;
    status: EnquiryStatus;
    internalNotes?: string;
    createdAt: Date;
    updatedAt: Date;
}
