import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom'; // Corrected import
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, CreditCard, Loader2 } from 'lucide-react';
import { billingService } from '@/services/billingService';

// Mock Plans - In a real app, fetch from API
const PLANS = [
    {
        id: '679a8344238e55e00318357a', // Example ID, replace with real DB ID
        name: 'Starter',
        price: 29,
        description: 'Perfect for small teams getting started.',
        features: ['5 Users', 'Basic CRM', 'Email Support'],
        current: false
    },
    {
        id: '679a8344238e55e00318357b', // Example ID
        name: 'Professional',
        price: 99,
        description: 'For growing businesses needing advanced tools.',
        features: ['Unlimited Users', 'Advanced Analytics', 'Priority Support', 'AI Features'],
        popular: true,
        current: false
    }
];

export default function BillingSettingsPage() {
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [currentPlan, setCurrentPlan] = useState<string>('Free'); // Default

    // Get Organisation ID from local storage
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const organisationId = userInfo.organisationId || userInfo.organisation;

    useEffect(() => {
        if (searchParams.get('success')) {
            toast.success('Subscription updated successfully!');
        }
        if (searchParams.get('canceled')) {
            toast.info('Subscription checkout canceled.');
        }
    }, [searchParams]);

    const handleSubscribe = async (planId: string) => {
        try {
            setIsLoading(planId);
            const { url } = await billingService.createCheckoutSession({
                planId,
                organisationId
            });
            window.location.href = url;
        } catch (error) {
            console.error(error);
            toast.error('Failed to start checkout. Please try again.');
        } finally {
            setIsLoading(null);
        }
    };

    const handleManageSubscription = async () => {
        try {
            setIsLoading('portal');
            const { url } = await billingService.createPortalSession(organisationId);
            window.location.href = url;
        } catch (error) {
            console.error(error);
            toast.error('Failed to open billing portal. Feature might not be enabled.');
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Billing & Subscription</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your subscription plan and billing details.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Current Plan: {currentPlan}</CardTitle>
                    <CardDescription>
                        You are currently on the {currentPlan} plan.
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button variant="outline" onClick={handleManageSubscription} disabled={isLoading === 'portal'}>
                        {isLoading === 'portal' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Manage Subscription
                    </Button>
                </CardFooter>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
                {PLANS.map((plan) => (
                    <Card key={plan.id} className={plan.popular ? 'border-primary shadow-lg relative' : ''}>
                        {plan.popular && (
                            <Badge className="absolute -top-2 right-4">Most Popular</Badge>
                        )}
                        <CardHeader>
                            <CardTitle>{plan.name}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                            <div className="mt-4">
                                <span className="text-3xl font-bold">${plan.price}</span>
                                <span className="text-muted-foreground">/month</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center">
                                        <Check className="mr-2 h-4 w-4 text-green-500" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                variant={plan.popular ? 'default' : 'outline'}
                                onClick={() => handleSubscribe(plan.id)}
                                disabled={!!isLoading}
                            >
                                {isLoading === plan.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {plan.current ? 'Current Plan' : 'Upgrade'}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
