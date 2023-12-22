import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { Product, ProductDocument } from './product.schemas';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProductDto } from 'src/lib/dto/create-product.dto';
import { FindAllProductDto } from 'src/lib/dto/find-all-product.dto';
import {
  PaginatedResults,
  Pagination,
} from 'src/lib/decorators/pagination.decorator';
import { EcommerceGateway } from 'src/lib/interfaces/ecommerce-gateway.enum';
import { StripeBillingService } from 'src/billing/billing/stripe-billing.service';
import { UpdateProductDto } from 'src/lib/dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
    @Inject(forwardRef(() => StripeBillingService))
    private readonly stripeBillingService: StripeBillingService,
  ) {}

  async findAll(
    findAllProductDto: FindAllProductDto,
    pagination: Pagination,
  ): Promise<PaginatedResults<ProductDocument>> {
    const filters = {};
    if (findAllProductDto.active) {
      Object.assign(filters, {
        active: findAllProductDto.active ? true : false,
      });
    }
    if (findAllProductDto.gateway) {
      Object.assign(filters, {
        gateway: findAllProductDto.gateway,
      });
    }
    const results = await this.productModel
      .aggregate([
        {
          $match: filters,
        },
        {
          $skip: pagination.start,
        },
        {
          $limit: pagination.limit,
        },
      ])
      .exec();

    const count = await this.productModel.aggregate([
      {
        $match: filters,
      },
      {
        $count: 'count',
      },
    ]);

    return {
      results,
      count: count?.[0]?.count || 0,
      start: pagination.start,
      limit: pagination.limit,
    };
  }

  findOne(productId: string): Promise<ProductDocument> {
    return this.productModel.findOne({
      _id: productId,
    });
  }

  async update(
    productId: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductDocument> {
    const errors = [];
    const product = await this.productModel.findOne({
      _id: productId,
    });

    if (!product) {
      errors.push(`product with id ${productId} does not exists`);
    }

    if (errors.length) {
      throw new BadRequestException(errors.join(', '));
    }

    Object.assign(product, updateProductDto);

    switch (product.gateway) {
      case EcommerceGateway.STRIPE:
        await this.stripeBillingService.updateProductAndPrice(
          product.gatewayResourceId,
          updateProductDto,
        );
      default:
        console.log(`ecommerce gateway does not exists`);
        break;
    }

    return await product.save();
  }

  async create(createProductDto: CreateProductDto): Promise<ProductDocument> {
    let gatewayResource: { id: string } = null;
    switch (createProductDto.gateway) {
      case EcommerceGateway.STRIPE:
        gatewayResource =
          await this.stripeBillingService.createProductWithPrice({
            name: createProductDto.name,
            description: createProductDto.description,
            currency: createProductDto.currency,
            active: createProductDto.active,
            price: createProductDto.price,
            subscription: createProductDto.subscription,
            periodicity: createProductDto.periodicity,
          });
      default:
        console.log(`ecommerce gateway does not exists`);
        break;
    }
    const newProduct = new this.productModel({
      ...createProductDto,
      gatewayResourceId: gatewayResource.id,
    });

    return await newProduct.save();
  }
}
