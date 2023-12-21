import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  RawBodyRequest,
  Req,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { BillingService } from 'src/billing/billing/billing.service';
import {
  KeycloakAuthGuard,
  KeycloakAuthIgnore,
  KeycloakAvailableRoles,
  KeycloakRoles,
} from 'src/keycloak/keycloak/keycloak-auth.guard';
import {
  PaginatedWithAfterId,
  PaginationWithAfterId,
} from 'src/lib/decorators/pagination-with-after-id.decorator';
import { CreateProductDto } from 'src/lib/dto/create-product.dto';
import { FindAllProductDto } from 'src/lib/dto/find-all-product.dto';
import { UpdateProductDto } from 'src/lib/dto/update-product.dto';

@UseGuards(KeycloakAuthGuard)
@Controller('api/stripe')
export class StripeController {
  constructor(private readonly billingService: BillingService) {}
  @KeycloakRoles([
    KeycloakAvailableRoles.SUPERADMIN,
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.USER,
  ])
  @Get('product')
  findAll(
    @PaginatedWithAfterId() pagination: PaginationWithAfterId,
    @Query() findAllProductDto: FindAllProductDto,
  ) {
    const filters = {
      active: true,
    };
    if (findAllProductDto.active === 0) {
      Object.assign(filters, {
        active: false,
      });
    }
    return this.billingService.getAllProducts(
      filters,
      pagination.limit,
      pagination.startAfterId,
    );
  }

  @KeycloakRoles([KeycloakAvailableRoles.SUPERADMIN])
  @Post('product')
  create(@Body() createProductDto: CreateProductDto) {
    return this.billingService.createProductWithPrice(createProductDto);
  }

  @KeycloakRoles([KeycloakAvailableRoles.SUPERADMIN])
  @Patch('product/:id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.billingService.updateProductAndPrice(id, updateProductDto);
  }

  @KeycloakRoles([KeycloakAvailableRoles.SUPERADMIN])
  @Delete('product/:id')
  delete(@Param('id') id: string) {
    return this.billingService.archiveProduct(id);
  }

  @KeycloakAuthIgnore(true)
  @Post('events')
  handleEvents(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    console.log(req.rawBody, signature, req.headers);
    return this.billingService.handleWebhookEvents(signature, req.rawBody);
  }
}
