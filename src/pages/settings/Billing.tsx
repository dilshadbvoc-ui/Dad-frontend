import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Check, CreditCard, Loader2, Sparkles } from 'lucide-react';
import { billingService } from '@/services/billingService';
import { getSubscriptionPlans, type SubscriptionPlan } from '@/services/subscriptionPlanService';
import { getUserInfo } from '@/lib/utils';

export default function BillingSettingsPage() {
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [currentPlanName, setCurrentPlanName] = useState<string>('Free / Trial');

    // Get Organisation info from local storage
    const user = getUserInfo();
    const organisationId = user?.organisationId || user?.organisation;
    // In a real app, this should come from a user/org context or API
    const currentPlanId = user?.planId;

    // Fetch Plans from API
    const { data, isLoading: arePlansLoading } = useQuery({
        queryKey: ['subscriptionPlans'],
        queryFn: getSubscriptionPlans
    });

    const plans = useMemo(() => data?.plans || [], [data]);

    useEffect(() => {
        if (plans.length > 0 && currentPlanId) {
            const plan = plans.find((p: SubscriptionPlan) => p.id === currentPlanId);
            if (plan) setCurrentPlanName(plan.name);
        }
    }, [plans, currentPlanId]);

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
        } catch (error: unknown) {
            console.error(error);
            const err = error as { response?: { status: number } };
            if (err.response?.status === 404) {
                toast.error('No active subscription found to manage.');
            } else {
                toast.error('Failed to open billing portal. Ensure Stripe Portal URL is configured in backend settings.');
            }
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Billing & Subscription</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your subscription plan and billing details.
                    </p>
                </div>
            </div>

            {/* Current Plan Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Current Subscription</CardTitle>
                            <CardDescription>
                                You are currently on the <span className="font-semibold text-foreground">{currentPlanName}</span> plan.
                            </CardDescription>
                        </div>
                        <CreditCard className="h-8 w-8 text-primary/20" />
                    </div>
                </CardHeader>
                <CardFooter className="bg-muted/50 border-t pt-4">
                    <Button variant="outline" onClick={handleManageSubscription} disabled={isLoading === 'portal'}>
                        {isLoading === 'portal' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Manage Billing & Invoices
                    </Button>
                </CardFooter>
            </Card>

            <div className="space-y-4">
                <h4 className="text-lg font-semibold">Available Plans</h4>

                {arePlansLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : plans.length === 0 ? (
                    <div className="text-center py-12 border rounded-xl bg-muted/20">
                        <p className="text-muted-foreground">No subscription plans available at the moment.</p>
                    </div>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-3">
                        {plans.map((plan: SubscriptionPlan) => {
                            const isCurrent = currentPlanId === plan.id;
                            const isPopular = plan.name.toLowerCase().includes('pro') || plan.name.toLowerCase().includes('business');

                            return (
                                <Card key={plan.id} className={`flex flex-col transition-all duration-200 hover:shadow-lg ${isPopular ? 'border-primary shadow-sm scale-[1.02] relative' : 'border-border'}`}>
                                    {isPopular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold shadow-sm flex items-center gap-1">
                                            <Sparkles className="h-3 w-3" /> Most Popular
                                        </div>
                                    )}
                                    <CardHeader>
                                        <CardTitle>{plan.name}</CardTitle>
                                        <CardDescription>{plan.description || `${plan.durationDays} days access`}</CardDescription>
                                        <div className="mt-4 flex items-baseline gap-1">
                                            <span className="text-3xl font-bold">₹{plan.price}</span>
                                            <span className="text-muted-foreground text-sm">/{plan.durationDays} days</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <ul className="space-y-3 text-sm">
                                            <li className="flex items-center gap-2">
                                                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                    <Check className="h-3 w-3 text-primary" />
                                                </div>
                                                <span className="text-muted-foreground">
                                                    Up to {plan.maxUsers} Users
                                                </span>
                                            </li>
                                            {plan.billingType === 'per_user' && (
                                                <li className="flex items-center gap-2">
                                                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                        <Check className="h-3 w-3 text-primary" />
                                                    </div>
                                                    <span className="text-muted-foreground">
                                                        Billed per user
                                                    </span>
                                                </li>
                                            )}
                                        </ul>
                                    </CardContent>
                                    <CardFooter className="mt-auto pt-6">
                                        <Button
                                            className={`w-full ${isPopular ? 'bg-primary hover:bg-primary/90' : ''}`}
                                            variant={isPopular ? 'default' : 'outline'}
                                            onClick={() => handleSubscribe(plan.id)}
                                            disabled={!!isLoading || isCurrent}
                                        >
                                            {isLoading === plan.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {isCurrent ? 'Current Plan' : `Upgrade to ${plan.name}`}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
