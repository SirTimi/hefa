import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'change-me',
      ignoreExpiration: false,
    });
  }
  async validate(payload: any) {
    //payload: {sub, role, sid?, iat, exp}
    return { userId: payload.sub, role: payload.role, sid: payload.sid };
  }
}
