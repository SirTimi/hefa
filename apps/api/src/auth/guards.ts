import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

export class JwtAccessGuard extends AuthGuard('jwt-access') {}
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', ctx.getHandler()) || [];
    if (!roles.length) return true;
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as { role?: string };
    return !!user && roles.includes(user.role!);
  }
}
