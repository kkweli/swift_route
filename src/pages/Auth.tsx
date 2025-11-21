import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Mail, CheckCircle, ArrowLeft, Home } from 'lucide-react';
import { Logo } from '@/components/Logo';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const { signUp, signIn, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const resendVerificationEmail = async () => {
    if (!userEmail) return;
    
    setLoading(true);
    try {
      // Note: Supabase doesn't have a direct resend method, so we'll use signUp again
      const { error } = await signUp(userEmail, 'temp-password', 'Resend Verification');
      if (error && !error.message.includes('already registered')) {
        toast({
          variant: 'destructive',
          title: 'Failed to resend email',
          description: error.message,
        });
      } else {
        toast({
          title: 'Verification email sent',
          description: 'Please check your email for the verification link.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to resend verification email.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          let errorMessage = error.message;
          let errorTitle = 'Login failed';
          
          // Provide more helpful error messages
          if (error.message.includes('Email not confirmed')) {
            errorTitle = 'Email not verified';
            errorMessage = 'Please check your email and click the verification link before signing in.';
          } else if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Invalid email or password. Please check your credentials and try again.';
          }
          
          toast({
            variant: 'destructive',
            title: errorTitle,
            description: errorMessage,
          });
        } else {
          toast({
            title: 'Welcome back!',
            description: 'Successfully signed in.',
          });
          navigate('/dashboard');
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast({
            variant: 'destructive',
            title: 'Signup failed',
            description: error.message,
          });
        } else {
          toast({
            title: 'Account created successfully!',
            description: 'Please check your email and click the verification link to start your free trial.',
          });
          setUserEmail(email);
          setShowEmailVerification(true);
          setEmail('');
          setPassword('');
          setFullName('');
          setIsLogin(true);
        }
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          {/* Back Navigation */}
          <div className="flex justify-start mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Navigate to dashboard if user is logged in, otherwise go to home
                if (user) {
                  navigate('/dashboard');
                } else {
                  navigate('/');
                }
              }}
              className="text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {user ? 'Back to Dashboard' : 'Back to Home'}
            </Button>
          </div>
          <div className="flex items-center justify-center mb-2">
            <Logo size="lg" />
          </div>
          <CardTitle className="text-2xl">
            {isLogin ? 'Welcome Back' : 'Get Started'}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? 'Sign in to access your routing dashboard' 
              : 'Create an account to start optimizing routes'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showEmailVerification && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Account created successfully!</strong>
                <br />
                We've sent a verification email to <strong>{userEmail}</strong>
                <br />
                Please check your inbox and click the verification link to activate your account.
                <br />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-green-600">
                    Don't see the email? Check your spam folder.
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEmailVerification(false)}
                    className="text-green-700 border-green-300 hover:bg-green-100"
                  >
                    Dismiss
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          <Tabs value={isLogin ? 'login' : 'signup'} onValueChange={(v) => setIsLogin(v === 'login')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            Professional routing solutions for businesses
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
