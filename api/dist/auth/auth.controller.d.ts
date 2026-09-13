import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../entities';
declare class LoginDto {
    email: string;
    password: string;
}
export declare class AuthController {
    private readonly users;
    private readonly jwt;
    constructor(users: Repository<User>, jwt: JwtService);
    login(body: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: import("../common/enums").AdminRole;
        };
    }>;
}
export {};
