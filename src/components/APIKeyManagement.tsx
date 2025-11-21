/**
 * SwiftRoute API Key Management Component
 * Manage API keys - generate, view, revoke
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Key,
  Copy,
  Trash2,
  Plus,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface APIKey {
  id: string;
  key_prefix: string;
  name: string;
  created_at: string;
  last_used: string | null;
  request_count: number;
  status: 'active' | 'revoked';
}

export function APIKeyManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newGeneratedKey, setNewGeneratedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('trial');

  // Fetch subscription tier
  const fetchSubscription = useCallback(async () => {
    if (!user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/v1/billing/subscription', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptionTier(data.data.tier || 'trial');
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  }, [user]);

  // Fetch API keys
  const fetchKeys = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch('/api/v1/keys', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch keys');

      const data = await response.json();
      setKeys(data.data || []);
    } catch (error) {
      console.error('Error fetching keys:', error);
      toast({
        title: 'Error',
        description: 'Failed to load API keys',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Generate new API key
  const generateKey = async () => {
    if (!user || !newKeyName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a key name',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newKeyName })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.code === 'SUBSCRIPTION_REQUIRED') {
          toast({
            title: 'Paid Subscription Required',
            description: 'Upgrade to a paid plan to create custom API keys',
            variant: 'destructive'
          });
        } else if (data.error?.code === 'KEY_LIMIT_REACHED') {
          toast({
            title: 'Key Limit Reached',
            description: 'Maximum of 5 API keys allowed. Please rotate or delete existing keys.',
            variant: 'destructive'
          });
        } else {
          throw new Error(data.error?.message || 'Failed to generate key');
        }
        return;
      }

      setNewGeneratedKey(data.data.key);
      setNewKeyName('');
      
      toast({
        title: 'Success',
        description: 'API key generated successfully'
      });

      // Refresh keys list
      await fetchKeys();
    } catch (error) {
      console.error('Error generating key:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate API key',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Rotate API key
  const rotateKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to rotate this API key? The old key will be invalidated and you\'ll get a new one.')) {
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch('/api/v1/keys/regenerate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: keyId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to rotate key');
      }

      setNewGeneratedKey(data.data.key);
      setShowNewKeyDialog(true);

      toast({
        title: 'Success',
        description: 'API key rotated successfully'
      });

      // Refresh keys list
      await fetchKeys();
    } catch (error) {
      console.error('Error rotating key:', error);
      toast({
        title: 'Error',
        description: 'Failed to rotate API key',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Revoke API key
  const revokeKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch(`/api/v1/keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to revoke key');

      toast({
        title: 'Success',
        description: 'API key revoked successfully'
      });

      // Refresh keys list
      await fetchKeys();
    } catch (error) {
      console.error('Error revoking key:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke API key',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'API key copied to clipboard'
    });
  };

  // Load keys and subscription on mount
  useEffect(() => {
    fetchSubscription();
    fetchKeys();
  }, [fetchSubscription, fetchKeys]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Key Management</h2>
          <p className="text-muted-foreground">
            {subscriptionTier === 'trial' 
              ? 'View your trial API key (auto-generated)'
              : 'Generate and manage your API keys'}
          </p>
        </div>
        {subscriptionTier !== 'trial' && (
          <Button onClick={() => setShowNewKeyDialog(true)} disabled={isLoading}>
            <Plus className="w-4 h-4 mr-2" />
            Generate New Key
          </Button>
        )}
      </div>

      {/* Trial User Notice */}
      {subscriptionTier === 'trial' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Trial Account:</strong> You're using an auto-generated trial API key. 
            Upgrade to a paid plan to create custom API keys and manage multiple keys.
          </AlertDescription>
        </Alert>
      )}

      {/* API Keys List */}
      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>
            Manage your API keys for authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && keys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading API keys...
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No API keys yet</p>
              <Button onClick={() => setShowNewKeyDialog(true)}>
                Generate Your First Key
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Key className="w-4 h-4 text-primary" />
                      <span className="font-medium">{key.name}</span>
                      <Badge variant={key.status === 'active' ? 'default' : 'secondary'}>
                        {key.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="font-mono">{key.key_prefix}</div>
                      <div className="flex gap-4">
                        <span>Created: {new Date(key.created_at).toLocaleDateString()}</span>
                        {key.last_used && (
                          <span>Last used: {new Date(key.last_used).toLocaleDateString()}</span>
                        )}
                        <span>Requests: {key.request_count}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(key.key_prefix)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    {key.status === 'active' && subscriptionTier !== 'trial' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => rotateKey(key.id)}
                          disabled={isLoading}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => revokeKey(key.id)}
                          disabled={isLoading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {subscriptionTier === 'trial' && (
                      <Badge variant="secondary">Trial Key</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Key Dialog */}
      <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate New API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for authentication
            </DialogDescription>
          </DialogHeader>

          {!newGeneratedKey ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  placeholder="e.g., Production Key"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
              <Button onClick={generateKey} disabled={isLoading} className="w-full">
                Generate Key
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Save this key now! You won't be able to see it again.
                </AlertDescription>
              </Alert>

              <div>
                <Label>Your New API Key</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newGeneratedKey}
                    readOnly
                    type={showKey ? 'text' : 'password'}
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(newGeneratedKey)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Button
                onClick={() => {
                  setNewGeneratedKey(null);
                  setShowNewKeyDialog(false);
                }}
                className="w-full"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Security Notice */}
      <Alert>
        <Key className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Best Practices:</strong> Never share your API keys publicly. 
          Store them securely and rotate them regularly. Revoke any keys that may have been compromised.
        </AlertDescription>
      </Alert>
    </div>
  );
}
