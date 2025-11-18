/**
 * APIKeysSummary Component
 * Displays API key count and quick management actions
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Key, CheckCircle, XCircle } from 'lucide-react';

interface APIKeysSummaryProps {
  apiKeys: { total: number; active: number } | null;
  isLoading: boolean;
  error: string | null;
  onManageKeys: () => void;
  onRetry?: () => void;
}

export function APIKeysSummary({ apiKeys, isLoading, error, onManageKeys, onRetry }: APIKeysSummaryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-10 w-full bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Failed to Load API Keys</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!apiKeys) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No API Keys Data</CardTitle>
          <CardDescription>Unable to load API keys information</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const inactiveKeys = apiKeys.total - apiKeys.active;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Keys
        </CardTitle>
        <CardDescription>Manage your API authentication keys</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Counts */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Active Keys</span>
            </div>
            <div className="text-3xl font-bold text-green-600">{apiKeys.active}</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <XCircle className="h-4 w-4 text-gray-400" />
              <span>Total Keys</span>
            </div>
            <div className="text-3xl font-bold">{apiKeys.total}</div>
          </div>
        </div>

        {/* Status Badge */}
        {apiKeys.active > 0 ? (
          <Badge variant="default" className="bg-green-500">
            {apiKeys.active} Active {apiKeys.active === 1 ? 'Key' : 'Keys'}
          </Badge>
        ) : (
          <Badge variant="secondary">
            No Active Keys
          </Badge>
        )}

        {/* Inactive Keys Warning */}
        {inactiveKeys > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              You have {inactiveKeys} inactive {inactiveKeys === 1 ? 'key' : 'keys'}. Consider removing unused keys for security.
            </p>
          </div>
        )}

        {/* No Keys Message */}
        {apiKeys.total === 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              You haven't created any API keys yet. Create one to start using the SwiftRoute API.
            </p>
          </div>
        )}

        {/* Manage Button */}
        <Button onClick={onManageKeys} className="w-full">
          Manage API Keys
        </Button>
      </CardContent>
    </Card>
  );
}
