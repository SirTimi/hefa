import { Injectable, ExecutionContext } from '@nestjs/common';
import {
  ThrottlerGuard,
  ThrottlerException,
  ThrottlerLimitDetail,
} from '@nestjs/throttler';

const LIMITS = {
  ADMIN: { ttl: 60, limit: 300 },
  MERCHANT: { ttl: 60, limit: 120 },
  DRIVER: { ttl: 60, limit: 120 },
  USER: { ttl: 60, limit: 60 },
  GUEST: { ttl: 60, limit: 30 },
} as const;

type RoleKey = keyof typeof LIMITS;

function asRoleKey(v: unknown): RoleKey {
  const s = String(v ?? 'GUEST').toUpperCase();
  return (['ADMIN', 'MERCHANT', 'DRIVER', 'USER', 'GUEST'] as const).includes(
    s as RoleKey,
  )
    ? (s as RoleKey)
    : 'GUEST';
}

@Injectable()
export class RoleAwareThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return (req.user?.id as string) ?? (req.ip as string) ?? 'anon';
  }
  protected async getTTL(
    context: ExecutionContext,
    _limitDetail: ThrottlerLimitDetail,
  ): Promise<number> {
    const req = context.switchToHttp().getRequest();
    const role = asRoleKey(req.user?.role);
    return LIMITS[role].ttl;
  }
  protected async getLimit(
    context: ExecutionContext,
    _limitDetail: ThrottlerLimitDetail,
  ): Promise<number> {
    const req = context.switchToHttp().getRequest();
    const role = asRoleKey(req.user?.role);
    return LIMITS[role].limit;
  }
  protected async throwThrottlingException(
    _context: ExecutionContext,
    _throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    throw new ThrottlerException('Too many requests, slow down.');
  }
}
