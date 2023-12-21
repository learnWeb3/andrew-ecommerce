import { Module } from '@nestjs/common';
import { KeycloakService } from './keycloak/keycloak.service';
@Module({
  providers: [KeycloakService],
  exports: [KeycloakService],
})
export class KeycloakModule {}
