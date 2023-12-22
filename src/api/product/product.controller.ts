import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  forwardRef,
} from '@nestjs/common';
import {
  KeycloakAuthGuard,
  KeycloakAuthIgnore,
  KeycloakAvailableRoles,
  KeycloakRoles,
} from 'src/keycloak/keycloak/keycloak-auth.guard';
import { Paginated, Pagination } from 'src/lib/decorators/pagination.decorator';
import { CreateProductDto } from 'src/lib/dto/create-product.dto';
import { FindAllProductDto } from 'src/lib/dto/find-all-product.dto';
import { UpdateProductDto } from 'src/lib/dto/update-product.dto';
import { ProductService } from 'src/product/product/product.service';

@UseGuards(KeycloakAuthGuard)
@Controller('api/product')
export class ProductController {
  constructor(
    @Inject(forwardRef(() => ProductService))
    private readonly productService: ProductService,
  ) {}

  @KeycloakAuthIgnore(true)
  @Get('')
  findAll(
    @Paginated() pagination: Pagination,
    @Query() findAllProductDto: FindAllProductDto,
  ) {
    return this.productService.findAll(findAllProductDto, pagination);
  }

  @KeycloakAuthIgnore(true)
  @Get(':id')
  findOne(@Param('id') productId: string) {
    return this.productService.findOne(productId);
  }

  @KeycloakRoles([KeycloakAvailableRoles.SUPERADMIN])
  @Patch(':id')
  update(
    @Param('id') productId: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(productId, updateProductDto);
  }

  @KeycloakRoles([KeycloakAvailableRoles.SUPERADMIN])
  @Post('')
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }
}
