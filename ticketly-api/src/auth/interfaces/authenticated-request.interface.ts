import type { Request } from 'express';
import type { Admin } from '../../admins/entities/admin.entity';

export interface JwtPayload {
  sub: string;
}

export interface AuthenticatedRequest extends Request {
  admin: Admin;
}
