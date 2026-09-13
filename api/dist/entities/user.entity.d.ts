import { AdminRole } from '../common/enums';
export declare class User {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role: AdminRole;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}
