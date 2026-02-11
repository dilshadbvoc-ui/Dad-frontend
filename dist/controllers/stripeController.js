"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleWebhook = exports.createPortalSession = exports.createCheckoutSession = void 0;
const StripeService_1 = require("../services/StripeService");
const prisma_1 = __importDefault(require("../config/prisma"));
const createCheckoutSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { planId } = req.body;
        const user = req.user;
        const userEmail = user.email;
        const organisationId = user.organisationId;
        if (!organisationId) {
            return res.status(403).json({ message: 'User has no organisation' });
        }
        const plan = yield prisma_1.default.subscriptionPlan.findUnique({
            where: { id: planId }
        });
        if (!plan)
            return res.status(404).json({ message: 'Plan not found' });
        const session = yield StripeService_1.StripeService.createCheckoutSession(plan, organisationId, userEmail);
        res.json({ url: session.url });
    }
    catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.createCheckoutSession = createCheckoutSession;
const createPortalSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const organisationId = user.organisationId;
        if (!organisationId) {
            return res.status(403).json({ message: 'User has no organisation' });
        }
        const org = yield prisma_1.default.organisation.findUnique({
            where: { id: organisationId }
        });
        if (!org || !org.subscription) {
            return res.status(404).json({ message: 'Organisation or subscription not found' });
        }
        const subscription = org.subscription;
        if (!subscription.stripeCustomerId) {
            return res.status(404).json({ message: 'Stripe Customer ID not found' });
        }
        const session = yield StripeService_1.StripeService.createPortalSession(subscription.stripeCustomerId);
        res.json({ url: session.url });
    }
    catch (error) {
        console.error('Error creating portal session:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.createPortalSession = createPortalSession;
const handleWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sig = req.headers['stripe-signature'];
    try {
        if (!sig)
            throw new Error('No signature');
        // Note: Stripe Webhook requires the RAW body. 
        // Ensure express.raw() is used in routes for this endpoint.
        yield StripeService_1.StripeService.handleWebhook(sig, req.body);
        res.json({ received: true });
    }
    catch (err) {
        console.error('Webhook Error:', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
});
exports.handleWebhook = handleWebhook;
