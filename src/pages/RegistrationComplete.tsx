/**
 * Registration Complete Page - Success page after payment
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function RegistrationComplete() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);

  const sessionId = searchParams.get('session_id');
  const tier = searchParams.get('tier') || 'starter';

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Simulate processing subscription activation
    const timer = setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: 'Registration Complete!',
        description: `Your ${tier} subscription is now active.`,
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, navigate, tier, toast]);

  const handleContinue = () => {
    navigate('/dashboard');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            {isProcessing ? (
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            ) : (
              <CheckCircle className="h-16 w-16 text-green-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {isProcessing ? 'Processing...' : 'Welcome to SwiftRoute!'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isProcessing ? (
            <p className="text-muted-foreground">
              Setting up your {tier} subscription...
            </p>
          ) : (
            <>
              <p className="text-muted-foreground">
                Your registration is complete! Your {tier} subscription is now active and ready to use.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">What's Next?</h3>
                <ul className="text-sm text-green-700 space-y-1 text-left">
                  <li>• Access your dashboard to start optimizing routes</li>
                  <li>• Generate API keys for integration</li>
                  <li>• View usage analytics and billing</li>
                  <li>• Explore our comprehensive documentation</li>
                </ul>
              </div>
              <Button onClick={handleContinue} className="w-full">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}