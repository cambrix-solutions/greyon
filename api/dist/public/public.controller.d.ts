import { Repository } from 'typeorm';
import { Enquiry, Hotel, Location, News } from '../entities';
import { MailService } from '../mail/mail.service';
declare class CreateEnquiryDto {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
    consent: boolean;
}
export declare class PublicController {
    private readonly hotels;
    private readonly locations;
    private readonly news;
    private readonly enquiries;
    private readonly mail;
    constructor(hotels: Repository<Hotel>, locations: Repository<Location>, news: Repository<News>, enquiries: Repository<Enquiry>, mail: MailService);
    listHotels(): Promise<Hotel[]>;
    hotel(slug: string): Promise<Hotel | null>;
    listLocations(): Promise<Location[]>;
    location(slug: string): Promise<Location | null>;
    listNews(): Promise<News[]>;
    newsItem(slug: string): Promise<News | null>;
    createEnquiry(body: CreateEnquiryDto): Promise<Enquiry>;
}
export {};
