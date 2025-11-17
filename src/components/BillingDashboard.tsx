/**
 * SwiftRoute Billing Dashboard Component
 * Uses Stripe Payment Links for client-side checkout (no backend Stripe API calls)
 */

import { useState, useEffect } from 'react';

// Payment Link configuration interface
interface PaymentLinkConfig {
  starter: string;
  professional: string;
  enterprise: string;
}

// Get Payment Links from environment variables
const getPaymentLinks = (): PaymentLinkConfig => {
  return {
    starter: import.meta.env.VITE_STRIPE_PAYMENT_LINK_STARTER || '',
    professional: import.meta.env.VITE_STRIPE_PAYMENT_LINK_PROFESSIONAL || '',
    enterprise: import.meta.env.VITE_STRIPE_PAYMENT_LINK_ENTERPRISE || ''
  };
};

// Build Payment Link URL with user data prefilled
const buildPaymentLinkUrl = (
  baseUrl: string,
  userEmail: string,
  userId: string
): string => {
  if (!baseUrl) return '';
  
  const url = new URL(baseUrl);
  url.searchParams.set('prefilled_email', userEmail);
  url.searchParams.set('client_reference_id', userId);
  return url.toString();
};
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PRICING_TIERS = [
  {
    tier: 'starter',
    name: 'Starter',
    price: 29,
    priceId: import.meta.env.VITE_STRIPE_PRICE_STARTER || 'price_1STStqAWSYvsSgXAhON77o3w',
    features: ['1,000 requests/month', '10 requests/minute', '$0.01 per additional request', 'Email support'],
  },
  {
    tier: 'professional',
    name: 'Professional',
    price: 199,
    priceId: import.meta.env.VITE_STRIPE_PRICE_PROFESSIONAL || 'price_1STSuVAWSYvsSgXArfjVjMpZ',
    features: ['10,000 requests/month', '50 requests/minute', '$0.008 per additional request', 'Priority support', 'Advanced analytics'],
    popular: true,
  },
  {
    tier: 'enterprise',
    name: 'Enterprise',
    price: 999,
    priceId: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE || 'price_1STSwZAWSYvsSgXATt4jPPrH',
    features: ['100,000 requests/month', '200 requests/minute', '$0.005 per additional request', '24/7 support', 'Custom integrations', 'SLA guarantee'],
  },
];

export function BillingDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<any>(null);
  const [upgradingTier, setUpgradingTier] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  // Handle return from Stripe Payment Link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    
    if (paymentStatus === 'success') {
      toast({
        title: 'Payment Successful!',
        description: 'Your subscription has been upgraded. Syncing your account...',
      });
      // Refresh subscription data
      fetchSubscription();
      // Clean URL
      window.history.replaceState({}, '', '/dashboard');
    } else if (paymentStatus === 'canceled') {
      toast({
        title: 'Payment Canceled',
        description: 'Your subscription was not changed.',
        variant: 'default',
      });
      // Clean URL
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  const fetchSubscription = async () => {
    if (!user) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/v1/billing/subscription', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.data);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  // Manual sync function for subscription data
  const syncSubscription = async () => {
    setIsSyncing(true);
    try {
      await fetchSubscription();
      toast({
        title: 'Subscription Synced',
        description: 'Your subscription status has been updated.',
      });
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: 'Sync Failed',
        description: 'Could not sync subscription. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpgrade = async (tier: string) => {
    if (!user) return;
    
    setUpgradingTier(tier);
    
    try {
      // Get Payment Links from environment
      const paymentLinks = getPaymentLinks();
      const paymentLink = paymentLinks[tier as keyof PaymentLinkConfig];
      
      // Validate Payment Link exists
      if (!paymentLink) {
        toast({
          title: 'Configuration Error',
          description: 'Payment system not configured. Please contact support.',
          variant: 'destructive',
        });
        setUpgradingTier(null);
        return;
      }
      
      // Build URL with user data
      const url = buildPaymentLinkUrl(paymentLink, user.email || '', user.id);
      
      // Open in new window (Stripe doesn't allow iframes)
      const width = 600;
      const height = 800;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      
      window.open(
        url,
        'stripe-checkout',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );
      
      setUpgradingTier(null);
      
      // Show info toast
      toast({
        title: 'Checkout Opened',
        description: 'Complete your payment in the new window. This page will update automatically.',
      });
      
    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast({
        title: 'Upgrade Failed',
        description: error.message || 'Failed to start checkout process',
        variant: 'destructive',
      });
      setUpgradingTier(null);
    }
  };

  if (!subscription) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Subscription</CardTitle>
              <CardDescription>Your active plan and usage</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={syncSubscription}
              disabled={isSyncing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold capitalize">{subscription.tier}</p>
                <p className="text-sm text-muted-foreground">
                  {subscription.requests_used || 0} / {subscription.monthly_requests_included} requests used
                </p>
              </div>
              <Badge variant={subscription.payment_status === 'active' ? 'default' : 'secondary'}>
                {subscription.payment_status || 'Active'}
              </Badge>
            </div>
            
            {subscription.requests_remaining !== undefined && (
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, ((subscription.requests_used || 0) / subscription.monthly_requests_included) * 100)}%`
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Tiers */}
      <div className="grid md:grid-cols-3 gap-6">
        {PRICING_TIERS.map((plan) => (
          <Card
            key={plan.tier}
            className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Most Popular
              </Badge>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={subscription?.tier === plan.tier ? 'outline' : 'default'}
                onClick={() => handleUpgrade(plan.tier)}
                disabled={upgradingTier !== null || subscription?.tier === plan.tier}
              >
                {upgradingTier === plan.tier ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : subscription?.tier === plan.tier ? (
                  'Current Plan'
                ) : (
                  `Upgrade to ${plan.name}`
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Test Card Info */}
      <Card className="bg-muted">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            <strong>Test Mode:</strong> Use card 4242 4242 4242 4242 with any future expiry and CVC
          </p>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Checkout opens in a new window. After payment, return here and click Sync to update your subscription.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
