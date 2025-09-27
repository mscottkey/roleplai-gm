
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { getActualCost } from '@/app/actions';
import { LoadingSpinner } from './icons';
import { Badge } from './ui/badge';
import { Coins } from 'lucide-react';
import { Separator } from './ui/separator';

type CostEstimatorProps = {
  gameId: string | null;
};

type CostData = {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
};

export function CostEstimator({ gameId }: CostEstimatorProps) {
  const [costData, setCostData] = useState<CostData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleEstimate = async () => {
    if (!gameId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No active game selected to calculate costs for.',
      });
      return;
    }
    setIsLoading(true);
    try {
      const result = await getActualCost(gameId);
      setCostData(result);
    } catch (error) {
      const err = error as Error;
      console.error('Cost calculation failed:', err);
      toast({
        variant: 'destructive',
        title: 'Calculation Failed',
        description: err.message || 'Could not retrieve cost data.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);
  const formatCurrency = (num: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 4 }).format(num);

  return (
    <div className="space-y-4 text-sm">
      <p className="text-muted-foreground">
        Calculate the actual token usage and cost for this game session so far.
      </p>
      <Button onClick={handleEstimate} disabled={isLoading || !gameId} size="sm" className="w-full">
        {isLoading ? (
          <>
            <LoadingSpinner className="mr-2 h-4 w-4 animate-spin" />
            Calculating...
          </>
        ) : (
          <>
            <Coins className="mr-2 h-4 w-4" />
            Calculate Real Costs
          </>
        )}
      </Button>

      {costData && (
        <div className="mt-4 space-y-3 rounded-lg border bg-background p-4 animate-in fade-in-50">
          <div className="flex justify-between items-center">
            <p>Total Input Tokens</p>
            <Badge variant="outline">{formatNumber(costData.totalInputTokens)}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <p>Total Output Tokens</p>
            <Badge variant="outline">{formatNumber(costData.totalOutputTokens)}</Badge>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <p className="text-lg font-bold text-primary">Total Cost So Far</p>
            <div className="flex flex-col items-end">
                <Badge className="text-base">{formatNumber(costData.totalInputTokens + costData.totalOutputTokens)} tokens</Badge>
                <span className="font-mono font-semibold">{formatCurrency(costData.totalCost)}</span>
            </div>
          </div>
           <p className="text-xs text-muted-foreground pt-2 italic">
            This is the actual cost based on recorded AI calls for this game.
          </p>
        </div>
      )}
    </div>
  );
}
