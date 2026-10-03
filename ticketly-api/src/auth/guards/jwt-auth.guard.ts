import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@mikro-orm/nestjs';
import { AdminRepository } from '../../admins/admins.repository';
import { Admin } from '../../admins/entities/admin.entity';
import {
  InvalidSessionException,
  InvalidTokenException,
  MissingTokenException,
} from '../auth.exceptions';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type {
  AuthenticatedRequest,
  JwtPayload,
} from '../interfaces/authenticated-request.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    @InjectRepository(Admin)
    private readonly adminRepository: AdminRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new MissingTokenException();
    }

    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new InvalidTokenException();
    }

    const admin = await this.adminRepository.findById(payload.sub);

    if (!admin || !admin.isActive) {
      throw new InvalidSessionException();
    }

    request.admin = admin;
    return true;
  }

  private extractToken(request: AuthenticatedRequest): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
