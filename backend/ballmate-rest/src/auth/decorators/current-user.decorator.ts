import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtUser } from '../types/jwt-user.type';

export const CurrentUser = createParamDecorator(
  <T = JwtUser>(data: unknown, ctx: ExecutionContext): T | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: T }>();
    return request.user;
  },
);
