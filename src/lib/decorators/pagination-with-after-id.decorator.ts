import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from 'src/keycloak/keycloak/keycloak-auth.guard';

export interface PaginationWithAfterId {
  limit?: number;
  startAfterId?: string;
}

export const PaginatedWithAfterId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): PaginationWithAfterId => {
    const request = ctx.switchToHttp().getRequest<
      Request & {
        user: AuthenticatedUser;
        roles: string[];
      }
    >();

    return {
      limit: +request.query.limit || 10,
      startAfterId: (request.query.after as string) || null,
    };
  },
);
