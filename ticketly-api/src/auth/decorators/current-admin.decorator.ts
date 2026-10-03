import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Admin } from '../../admins/entities/admin.entity';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Admin =>
    ctx.switchToHttp().getRequest<AuthenticatedRequest>().admin,
);
