import { ContentStatus } from '../common/enums';
export declare class News {
    id: string;
    title: string;
    slug: string;
    coverImage: string;
    excerpt: string;
    body: string;
    publishedAt?: string;
    status: ContentStatus;
    seoTitle?: string;
    seoDescription?: string;
    createdAt: Date;
    updatedAt: Date;
}
