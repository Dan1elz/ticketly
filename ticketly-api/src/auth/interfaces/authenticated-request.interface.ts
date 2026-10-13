import type { Request } from 'express';
import type { Admin } from '../../admins/entities/admin.entity';

export interface IJwtPayload {
  sub: string;
}

export interface IAuthenticatedRequest extends Request {
  admin: Admin;
}
