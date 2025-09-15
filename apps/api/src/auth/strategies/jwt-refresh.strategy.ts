import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';

function cookieExtractor(req: Request) {
  return req.cookies?.rt || null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    super({
      jwtFromRequest: cookieExtractor,
      secretOrKey: process.env.JWT_SECRET || 'change-me',
      ignoreExpiration: false,
    });
  }
  async validate(payload: any) {
    return { userId: payload.sub, role: payload.role, sid: payload.sid };
  }
}
