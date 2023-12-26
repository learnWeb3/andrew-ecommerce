import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { EcommerceGateway } from 'src/lib/interfaces/ecommerce-gateway.enum';
import { v4 as uuid } from 'uuid';
import { Customer } from 'src/customer/customer/customer.schemas';

export type SubscriptionDocument = HydratedDocument<Subscription>;

@Schema({
  timestamps: true,
})
export class Subscription {
  @Prop({
    type: mongoose.Schema.Types.String,
    default: function genUUID() {
      return uuid();
    },
  })
  _id: string;

  @Prop({
    type: mongoose.Schema.Types.String,
    ref: Customer.name,
  })
  customer: string;

  @Prop({
    type: mongoose.Schema.Types.String,
  })
  contract: string;

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

const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

export { SubscriptionSchema };
