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
  IAuthenticatedRequest,
  IJwtPayload,
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

    const request = context.switchToHttp().getRequest<IAuthenticatedRequest>();

    // Rota pública: entra com ou sem token. Se veio um token válido (admin
    // logado no painel), identifica o admin, e a rota pode mostrar mais coisa
    // (ex: rascunhos). Token inválido aqui só vira cliente anônimo
    if (isPublic) {
      await this.authenticate(request).catch(() => undefined);
      return true;
    }

    await this.authenticate(request);
    return true;
  }

  private async authenticate(request: IAuthenticatedRequest): Promise<void> {
    const token = this.extractToken(request);

    if (!token) {
      throw new MissingTokenException();
    }

    let payload: IJwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<IJwtPayload>(token);
    } catch {
      throw new InvalidTokenException();
    }

    const admin = await this.adminRepository.findById(payload.sub);

    if (!admin || !admin.isActive) {
      throw new InvalidSessionException();
    }

    request.admin = admin;
  }

  private extractToken(request: IAuthenticatedRequest): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
