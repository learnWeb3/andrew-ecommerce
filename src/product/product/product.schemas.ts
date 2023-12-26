import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { BillingPeriodicity } from 'src/lib/interfaces/billing-periodicity.enum';
import { EcommerceGateway } from 'src/lib/interfaces/ecommerce-gateway.enum';
import { v4 as uuid } from 'uuid';

export type ProductDocument = HydratedDocument<Product>;

@Schema({
  timestamps: true,
})
export class Product {
  @Prop({
    type: mongoose.Schema.Types.String,
    default: function genUUID() {
      return uuid();
    },
  })
  _id: string;

  @Prop({
    type: mongoose.Schema.Types.String,
  })
  name: string;

  @Prop({
    type: mongoose.Schema.Types.String,
  })
  currency: string;

  @Prop({
    type: mongoose.Schema.Types.Number,
  })
  price: number;

  @Prop({
    type: mongoose.Schema.Types.Boolean,
  })
  subscription: boolean;

  @Prop({
    type: mongoose.Schema.Types.String,
    enum: BillingPeriodicity,
  })
  periodicity: BillingPeriodicity;

  @Prop({
    type: mongoose.Schema.Types.String,
  })
  description: string;

  @Prop({
    type: mongoose.Schema.Types.String,
    enum: EcommerceGateway,
  })
  gateway: EcommerceGateway;

  @Prop({
    type: mongoose.Schema.Types.String,
  })
  gatewayResourceId: string;

  @Prop({
    type: mongoose.Schema.Types.Boolean,
    default: true,
  })
  active: boolean;
}

const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index(
  {
    name: 1,
    gateway: 1,
  },
  { unique: true },
);

export { ProductSchema };
