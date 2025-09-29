
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from './icons';
import { Badge } from './ui/badge';
import { Coins } from 'lucide-react';
import { Separator } from './ui/separator';

type CostEstimatorProps = {
  gameId: string | null;
};

export function CostEstimator({ gameId }: CostEstimatorProps) {

  return (
    <div className="space-y-4 text-sm">
      <p className="text-muted-foreground">
        Cost tracking has been disabled in favor of standard Firebase monitoring.
      </p>
    </div>
  );
}

  