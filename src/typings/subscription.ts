import { Types } from 'mongoose';

// Define price structure
export interface IPrice {
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP';
  billingPeriod: 'monthly' | 'yearly';
}

// Define features available in tiers
export interface ITierFeatures {
  maxMembers: number;
  maxOrganizations: number;
  allowCSAM: boolean;
  maxTransactionsPerMonth: number;
  support: 'email' | 'priority' | '24/7';
  customBranding: boolean;
  apiAccess: boolean;
  dataRetentionMonths: number;
}

// Define the subscription tier model
export interface ISubscriptionTier {
  _id?: string | Types.ObjectId;
  name: string;
  description?: string;
  price: IPrice;
  features: ITierFeatures;
  isActive: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Subscription status enum
export enum ESubscriptionStatus {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  TRIAL = 'trial',
  UNPAID = 'unpaid',
}

// Define organization subscription
export interface IOrganizationSubscription {
  _id?: string | Types.ObjectId;
  organizationId: string | Types.ObjectId;
  tierId: string | Types.ObjectId | ISubscriptionTier;
  status: ESubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialStart?: Date;
  trialEnd?: Date;
  canceledAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
} 