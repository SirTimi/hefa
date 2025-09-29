import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as Sentry from '@sentry/node';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const req = ctx.switchToHttp().getRequest();

    try {
      const route = req?.route?.path ?? req?.originalUrl ?? req?.url;
      // v8-style: mutate the CURRENT scope
      const scope = (Sentry as any).getCurrentScope?.(); // optional chaining for safety
      if (scope) {
        scope.setTag('route', route || 'unknown');
        scope.setTag('method', req?.method || 'UNKNOWN');
        if (req?.id) scope.setTag('requestId', String(req.id));
        if (req?.ip) scope.setContext('ip', { ip: req.ip });
        if (req?.headers?.['user-agent'])
          scope.setContext('ua', { ua: req.headers['user-agent'] });
        if (req?.user?.userId) scope.setUser({ id: String(req.user.userId) });
      } else {
        // Fallback: set directly on the current scope via top-level API
        if (route) Sentry.setTag('route', route);
        if (req?.method) Sentry.setTag('method', req.method);
        if (req?.id) Sentry.setTag('requestId', String(req.id));
        if (req?.user?.userId) Sentry.setUser({ id: String(req.user.userId) });
      }
    } catch {
      /* best-effort context; never block the request */
    }

    return next.handle().pipe(
      catchError((err) => {
        Sentry.captureException(err);
        return throwError(() => err);
      }),
    );
  }
}
