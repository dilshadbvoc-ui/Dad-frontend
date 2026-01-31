import { Request, Response } from 'express';
import { StripeService } from '../services/StripeService';
import SubscriptionPlan from '../models/SubscriptionPlan';
import Organisation from '../models/Organisation';

export const createCheckoutSession = async (req: Request, res: Response) => {
    try {
        const { planId, organisationId } = req.body;
        const userEmail = (req as any).user.email; // Assuming auth middleware populates this

        const plan = await SubscriptionPlan.findById(planId);
        if (!plan) return res.status(404).json({ message: 'Plan not found' });

        const session = await StripeService.createCheckoutSession(plan, organisationId, userEmail);
        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const createPortalSession = async (req: Request, res: Response) => {
    try {
        const { organisationId } = req.body;

        // Find organisation to get customer ID (Not implemented yet in model, but placeholder logic)
        // const org = await Organisation.findById(organisationId);
        // if (!org || !org.subscription.stripeCustomerId) ...

        // For now, mock error or need to update Organisation model first
        res.status(501).json({ message: 'Portal not implemented yet' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const handleWebhook = async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];

    try {
        if (!sig) throw new Error('No signature');
        await StripeService.handleWebhook(sig as string, req.body);
        res.json({ received: true });
    } catch (err) {
        console.error('Webhook Error:', (err as Error).message);
        res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    }
};
