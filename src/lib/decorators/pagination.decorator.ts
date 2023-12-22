import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from 'src/keycloak/keycloak/keycloak-auth.guard';

export class PaginatedResults<T> {
  public results: T[];
  public limit: number;
  public start: number;
  public count: number;
}

export interface Pagination {
  start?: number;
  limit?: number;
}

export const Paginated = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Pagination => {
    const request = ctx.switchToHttp().getRequest<
      Request & {
        user: AuthenticatedUser;
        roles: string[];
      }
    >();

    return {
      limit: +request.query.limit || 10,
      start: +request.query.start || 0,
    };
  },
);
