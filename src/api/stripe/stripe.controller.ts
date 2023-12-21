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
import { CreateCheckoutUrl } from 'src/lib/dto/create-checkout-url.dto';
import { CreateCustomer } from 'src/lib/dto/create-customer.dto';
import { CreateProductDto } from 'src/lib/dto/create-product.dto';
import { FindAllProductDto } from 'src/lib/dto/find-all-product.dto';
import { UpdateProductDto } from 'src/lib/dto/update-product.dto';

@UseGuards(KeycloakAuthGuard)
@Controller('api/stripe')
export class StripeController {
  constructor(private readonly billingService: BillingService) {}

  @KeycloakAuthIgnore(true)
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

  @KeycloakAuthIgnore(true)
  @Get('product/:id')
  findOne(@Param('id') productId: string) {
    return this.billingService.getOneProduct(productId);
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
  @Post('customer')
  createCustomer(@Body() createCustomer: CreateCustomer) {
    return this.billingService.createCustomer({
      name: createCustomer.fullName,
      email: createCustomer.email,
    });
  }

  @KeycloakAuthIgnore(true)
  @Post('checkout')
  createCheckoutUrl(@Body() createCheckoutUrl: CreateCheckoutUrl) {
    return this.billingService.createCheckoutUrl(createCheckoutUrl);
  }

  @KeycloakAuthIgnore(true)
  @Post('events')
  handleEvents(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.billingService.handleWebhookEvents(signature, req.rawBody);
  }
}
