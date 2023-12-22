import { Module, forwardRef } from '@nestjs/common';
import { ProductService } from './product/product.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './product/product.schemas';
import { BillingModule } from 'src/billing/billing.module';

@Module({
  providers: [ProductService],
  exports: [ProductService],
  imports: [
    MongooseModule.forFeature([
      {
        name: Product.name,
        schema: ProductSchema,
      },
    ]),
    forwardRef(() => BillingModule),
  ],
})
export class ProductModule {}
