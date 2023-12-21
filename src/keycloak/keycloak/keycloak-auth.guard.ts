import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { KeycloakService } from './keycloak.service';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

export enum KeycloakAvailableRoles {
  SUPERADMIN = 'superadmin',
  USER = 'user',
  INSURER = 'supervisor',
}

export const KeycloakAuthIgnore = Reflector.createDecorator<boolean>();

export const KeycloakRoles =
  Reflector.createDecorator<KeycloakAvailableRoles[]>();

export const AuthenticatedUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<
      Request & {
        user: { email: string; authorizationServerUserId: string };
        roles: string[];
      }
    >();

    return request.user;
  },
);

@Injectable()
export class KeycloakAuthGuard implements CanActivate {
  private ACCESS_TOKEN_ROLES_KEY = process.env.KEYCLOAK_ACCESS_TOKEN_ROLES_KEY;
  constructor(
    private keycloakService: KeycloakService,
    private reflector: Reflector,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const roles = this.reflector.get(KeycloakRoles, context.getHandler());
      const authIgnore = this.reflector.get(
        KeycloakAuthIgnore,
        context.getHandler(),
      );

      if (authIgnore) {
        return true;
      }

      const request = context.switchToHttp().getRequest<
        Request & {
          user: { email: string; authorizationServerUserId: string };
          roles: string[];
        }
      >();
      const authorizationHeader = request.headers?.['authorization'] || null;
      if (!authorizationHeader) {
        throw new ForbiddenException(`missing authorization headers`);
      }
      const match = /^Bearer\s.+/.test(authorizationHeader);
      if (!match) {
        throw new UnauthorizedException(
          `Authorization header was malformed, ex`,
        );
      }
      const accessToken = authorizationHeader.replaceAll('Bearer ', '');

      const payload: Record<string, any> = await this.keycloakService.verify(
        accessToken,
        {
          issuer: process.env.KEYCLOAK_ISSUER,
          audience: process.env.KEYCLOAK_AUDIENCE,
        },
      );
      if (!payload[this.ACCESS_TOKEN_ROLES_KEY]) {
        throw new UnauthorizedException(`Bearer access token malformed`);
      }
      const payloadRolesMapping = payload[this.ACCESS_TOKEN_ROLES_KEY].reduce(
        (map, role) => {
          map[role] = true;
          return map;
        },
        {} as Record<string, boolean>,
      );

      let isRoleValid: boolean = false;
      for (const role of roles) {
        if (payloadRolesMapping[role]) {
          isRoleValid = true;
          break;
        }
      }

      if (!isRoleValid) {
        return false;
      }

      request.user = {
        email: payload['email'],
        authorizationServerUserId: payload['sub'],
      };
      request.roles = payload[this.ACCESS_TOKEN_ROLES_KEY];

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}
