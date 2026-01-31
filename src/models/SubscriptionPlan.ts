import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscriptionPlan extends Document {
    name: string;
    description?: string;
    features: string[];
    price: number;
    billingType: 'flat_rate' | 'per_user';
    currency: 'USD' | 'INR';
    durationDays: number;
    maxUsers: number;
    maxLeads: number;
    maxContacts: number;
    maxStorage: number; // MB
    isActive: boolean;
}

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>({
    name: { type: String, required: true, unique: true },
    description: String,
    features: [String],
    price: { type: Number, required: true },
    billingType: { type: String, enum: ['flat_rate', 'per_user'], default: 'flat_rate' },
    currency: { type: String, enum: ['USD', 'INR'], default: 'INR' },
    durationDays: { type: Number, required: true },
    maxUsers: { type: Number, default: 1 },
    maxLeads: { type: Number, default: 100 },
    maxContacts: { type: Number, default: 500 },
    maxStorage: { type: Number, default: 1024 }, // in MB
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true,
});

export default mongoose.model<ISubscriptionPlan>('SubscriptionPlan', subscriptionPlanSchema);
