import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { StripeBillingService } from 'src/billing/billing/stripe-billing.service';
import { Subscription, SubscriptionDocument } from './subscription.schemas';
import { CreateSubscriptionDto } from 'src/lib/dto/create-subscription.dto';
import { EcommerceGateway } from 'andrew-events-schema';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<Subscription>,
    @Inject(forwardRef(() => StripeBillingService))
    private readonly stripeBillingService: StripeBillingService,
  ) {}

  async exists(filters: FilterQuery<Subscription>): Promise<boolean> {
    return this.subscriptionModel
      .exists(filters)
      .then((record) => (record?._id ? true : false));
  }

  findOne(filters: FilterQuery<Subscription>): Promise<SubscriptionDocument> {
    return this.subscriptionModel.findOne(filters);
  }

  async create(
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<SubscriptionDocument> {
    const newSubscription = new this.subscriptionModel(createSubscriptionDto);
    return await newSubscription.save();
  }

  async cancel(subscriptionId: string): Promise<SubscriptionDocument> {
    const subscription = await this.findOne({ _id: subscriptionId });
    if (!subscription) {
      throw new BadRequestException(`invalid subscription id`);
    }
    switch (subscription.gateway) {
      case EcommerceGateway.STRIPE:
        await this.stripeBillingService.cancelSubscription(
          subscription.gatewayResourceId,
        );
      default:
        console.log(`ecommerce gateway does not exists`);
        break;
    }

    subscription.active = false;
    return await subscription.save();
  }
}
