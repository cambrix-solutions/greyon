import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { IsEmail, IsString } from 'class-validator';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import { User } from '../entities';

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    const user = await this.users.findOne({ where: { email: body.email } });
    const hash = createHash('sha256').update(body.password).digest('hex');
    if (!user || !user.active || user.passwordHash !== hash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
