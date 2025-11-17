/**
 * Pricing Selection Page - Choose tier before registration
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Payment Link configuration
interface PaymentLinkConfig {
  starter: string;
  professional: string;
  enterprise: string;
}

const getPaymentLinks = (): PaymentLinkConfig => {
  return {
    starter: import.meta.env.VITE_STRIPE_PAYMENT_LINK_STARTER || '',
    professional: import.meta.env.VITE_STRIPE_PAYMENT_LINK_PROFESSIONAL || '',
    enterprise: import.meta.env.VITE_STRIPE_PAYMENT_LINK_ENTERPRISE || ''
  };
};

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

const PRICING_TIERS = [
  {
    tier: 'trial',
    name: 'Free Trial',
    price: 0,
    description: 'Evaluate the API for 14 days',
    isTrial: true,
    features: [
      '100 API requests (14 days)',
      '2 requests per minute',
      'Up to 3 stops per route',
      'Car vehicle type only',
      'A* & Dijkstra algorithms',
      'Interactive map testing',
      'Full API documentation',
    ],
  },
  {
    tier: 'starter',
    name: 'Starter',
    price: 29,
    description: 'Perfect for small projects',
    features: [
      '1,000 API requests/month',
      '10 requests per minute',
      'Up to 10 stops per route',
      'All vehicle types',
      'GNN-enhanced optimization',
      '$0.01 per additional request',
      'Email support',
    ],
  },
  {
    tier: 'professional',
    name: 'Professional',
    price: 199,
    description: 'For growing businesses',
    popular: true,
    features: [
      '10,000 API requests/month',
      '50 requests per minute',
      'Up to 25 stops per route',
      'All vehicle types',
      'GNN-enhanced optimization',
      'Real-time traffic data',
      '$0.008 per additional request',
      'Priority support',
      'Advanced analytics',
    ],
  },
  {
    tier: 'enterprise',
    name: 'Enterprise',
    price: 999,
    description: 'For high-volume applications',
    features: [
      '100,000 API requests/month',
      '200 requests per minute',
      '$0.005 per additional request',
      '24/7 phone & email support',
      'Advanced analytics & reporting',
      'Custom rate limits',
      'Dedicated account manager',
      'SLA guarantee',
    ],
  },
];

export default function PricingSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const handleSelectTier = (tier: string) => {
    setSelectedTier(tier);
    
    // If trial tier, redirect to signup
    if (tier === 'trial') {
      navigate('/auth', { state: { selectedTier: 'trial', from: location } });
      return;
    }
    
    // If user is logged in, open payment checkout
    if (user) {
      const paymentLinks = getPaymentLinks();
      const paymentLink = paymentLinks[tier as keyof PaymentLinkConfig];
      
      if (!paymentLink) {
        toast({
          title: 'Configuration Error',
          description: 'Payment system not configured. Please contact support.',
          variant: 'destructive',
        });
        setSelectedTier(null);
        return;
      }
      
      // Build URL with user data
      const url = buildPaymentLinkUrl(paymentLink, user.email || '', user.id);
      
      // Open in popup window
      const width = 600;
      const height = 800;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      
      window.open(
        url,
        'stripe-checkout',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );
      
      toast({
        title: 'Checkout Opened',
        description: 'Complete your payment in the new window.',
      });
      
      setSelectedTier(null);
    } else {
      // If not logged in, redirect to auth with selected tier
      navigate('/auth', { state: { selectedTier: tier, from: location } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground">
            Select a subscription tier to get started with SwiftRoute
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Payment required to complete registration
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {PRICING_TIERS.map((plan) => (
            <Card
              key={plan.tier}
              className={`relative ${
                plan.popular ? 'border-primary shadow-lg' : ''
              } ${plan.isTrial ? 'border-green-500' : ''}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              {plan.isTrial && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600">
                  Start Here
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  {plan.price === 0 ? (
                    <span className="text-4xl font-bold">Free</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.isTrial ? 'default' : plan.popular ? 'default' : 'outline'}
                  onClick={() => handleSelectTier(plan.tier)}
                  disabled={selectedTier === plan.tier}
                >
                  {selectedTier === plan.tier ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Opening...
                    </>
                  ) : plan.isTrial ? (
                    <>
                      Start Free Trial
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      {user ? 'Subscribe Now' : 'Sign Up & Subscribe'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            All plans include GNN-enhanced route optimization and secure API access
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Test mode: Use card 4242 4242 4242 4242 for testing
          </p>
        </div>
      </div>
    </div>
  );
}
