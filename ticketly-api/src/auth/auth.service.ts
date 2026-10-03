import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@mikro-orm/nestjs';
import { compare } from 'bcrypt';
import { AdminRepository } from '../admins/admins.repository';
import { Admin } from '../admins/entities/admin.entity';
import { InvalidCredentialsException } from './auth.exceptions';
import { LoginDto } from './dto/login.dto';
import type { JwtPayload } from './interfaces/authenticated-request.interface';

// Hash qualquer: quando o e-mail não existe, comparamos com ele mesmo assim,
// pra resposta demorar igual e não denunciar quais e-mails estão cadastrados
const DUMMY_HASH =
  '$2b$10$5srCtFfJOsTisaVtlVKz1e.0k33H8b6gexLuXHfkd5/ZedDSVIJwq';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(Admin)
    private readonly adminRepository: AdminRepository,
  ) {}

  async login({
    email,
    password,
  }: LoginDto): Promise<{ accessToken: string; user: Admin }> {
    const admin = await this.adminRepository.findOne({ email });
    const passwordMatches = await compare(
      password,
      admin?.password ?? DUMMY_HASH,
    );

    if (!admin || !passwordMatches || !admin.isActive) {
      throw new InvalidCredentialsException();
    }

    admin.lastLoginAt = new Date();
    await this.adminRepository.saveChanges();

    const payload: JwtPayload = { sub: admin.id };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: admin,
    };
  }
}
