import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Admin } from '../../admins/entities/admin.entity';
import type { IAuthenticatedRequest } from '../interfaces/authenticated-request.interface';

// Admin logado. Em rota @Public() vem undefined quando é cliente sem login
export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Admin =>
    ctx.switchToHttp().getRequest<IAuthenticatedRequest>().admin,
);
