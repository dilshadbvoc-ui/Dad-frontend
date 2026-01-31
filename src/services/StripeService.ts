import Stripe from 'stripe';
import { ISubscriptionPlan } from '../models/SubscriptionPlan';
import Organisation from '../models/Organisation';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-01-28.clover',
});

export const StripeService = {
    /**
     * Create a Checkout Session for a subscription
     */
    async createCheckoutSession(plan: ISubscriptionPlan, organisationId: string, userEmail: string) {
        if (!plan.price) throw new Error('Plan has no price');

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: plan.currency.toLowerCase(),
                        product_data: {
                            name: plan.name,
                            description: plan.description,
                        },
                        unit_amount: plan.price * 100, // Stripe expects cents
                        recurring: {
                            interval: 'month', // or year, based on durationDays logic
                        },
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                organisationId,
                planId: plan._id.toString(),
            },
            customer_email: userEmail,
            success_url: `${process.env.CLIENT_URL}/settings/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/settings/billing?canceled=true`,
        });

        return session;
    },

    /**
     * Create a Customer Portal Session (for managing subs)
     */
    async createPortalSession(customerId: string) {
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${process.env.CLIENT_URL}/settings/billing`,
        });
        return session;
    },

    /**
     * Handle Webhooks (Simplistic)
     */
    async handleWebhook(signature: string, payload: Buffer) {
        const event = stripe.webhooks.constructEvent(
            payload,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );

        switch (event.type) {
            case 'checkout.session.completed':
                await this.handleCheckoutCompleted(event.data.object);
                break;
            case 'customer.subscription.deleted':
            case 'customer.subscription.updated':
                // Handle status changes
                break;
        }
    },

    async handleCheckoutCompleted(session: any) {
        const orgId = session.metadata?.organisationId;
        const planId = session.metadata?.planId;

        if (orgId && planId) {
            // Update Organisation Subscription
            await Organisation.findByIdAndUpdate(orgId, {
                'subscription.status': 'active',
                'subscription.plan': planId,
                'subscription.startDate': new Date(),
                // 'subscription.stripeCustomerId': session.customer 
                // We need to add stripeCustomerId to Organisation model!
            });
        }
    }
};
