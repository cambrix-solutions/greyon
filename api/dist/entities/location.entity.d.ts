import { ContentStatus } from '../common/enums';
import { Hotel } from './hotel.entity';
export declare class Location {
    id: string;
    name: string;
    slug: string;
    description: string;
    heroImage: string;
    gallery: string[];
    highlights: string[];
    status: ContentStatus;
    seoTitle?: string;
    seoDescription?: string;
    hotels: Hotel[];
    createdAt: Date;
    updatedAt: Date;
}
