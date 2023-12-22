import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { EcommerceGateway } from 'src/lib/interfaces/ecommerce-gateway.enum';
import { v4 as uuid } from 'uuid';

export type CustomerDocument = HydratedDocument<Customer>;

@Schema({
  timestamps: true,
})
export class Customer {
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
  email: string;

  @Prop({
    type: mongoose.Schema.Types.String,
  })
  fullName: string;

  @Prop({
    type: mongoose.Schema.Types.String,
    enum: EcommerceGateway,
  })
  gateway: EcommerceGateway;

  @Prop({
    type: mongoose.Schema.Types.String,
  })
  gatewayResourceId: string;
}

const CustomerSchema = SchemaFactory.createForClass(Customer);

CustomerSchema.index(
  {
    email: 1,
    gateway: 1,
  },
  { unique: true },
);

CustomerSchema.index(
  {
    gatewayResourceId: 1,
    gateway: 1,
  },
  { unique: true },
);

export { CustomerSchema };
