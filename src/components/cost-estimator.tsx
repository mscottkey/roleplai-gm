'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { getCostEstimation } from '@/app/actions';
import type { EstimateCostOutput } from '@/ai/schemas/cost-estimation-schemas';
import type { Character } from '@/app/lib/types';
import { LoadingSpinner } from './icons';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Coins } from 'lucide-react';

type CostEstimatorProps = {
  characters: Character[];
  campaignGenerated: boolean;
};

export function CostEstimator({ characters, campaignGenerated }: CostEstimatorProps) {
  const [estimation, setEstimation] = useState<EstimateCostOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleEstimate = async () => {
    setIsLoading(true);
    try {
      const result = await getCostEstimation({
        characters,
        campaignGenerated,
      });
      setEstimation(result);
    } catch (error) {
      const err = error as Error;
      console.error('Cost estimation failed:', err);
      toast({
        variant: 'destructive',
        title: 'Estimation Failed',
        description: err.message || 'Could not retrieve cost estimation.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

  return (
    <div className="space-y-4 text-sm">
      <p className="text-muted-foreground">
        Get a rough estimate of the token usage for setting up and running this game session. Prices are based on `gemini-2.5-flash` input tokens.
      </p>
      <Button onClick={handleEstimate} disabled={isLoading} size="sm" className="w-full">
        {isLoading ? (
          <>
            <LoadingSpinner className="mr-2 h-4 w-4 animate-spin" />
            Calculating...
          </>
        ) : (
          <>
            <Coins className="mr-2 h-4 w-4" />
            Estimate Session Costs
          </>
        )}
      </Button>

      {estimation && (
        <div className="mt-4 space-y-3 rounded-lg border bg-background p-4 animate-in fade-in-50">
          <div className="flex justify-between items-center">
            <p className="font-semibold">One-Time Setup Cost</p>
            <Badge variant="secondary">{formatNumber(estimation.setupCost)} tokens</Badge>
          </div>
          <Separator />
           <div className="space-y-2">
            <div className="flex justify-between items-center">
                <p className="font-semibold">Cost per Player Action</p>
                <Badge variant="outline">{formatNumber(estimation.perTurnCost)} tokens</Badge>
            </div>
             <div className="flex justify-between items-center">
                <p className="font-semibold">Cost per Player Question</p>
                <Badge variant="outline">{formatNumber(estimation.perQuestionCost)} tokens</Badge>
            </div>
           </div>
          <Separator />
           <div className="flex justify-between items-center">
            <p className="text-lg font-bold text-primary">Est. 2hr Session Cost</p>
            <Badge className="text-base">{formatNumber(estimation.estimatedSessionCost)} tokens</Badge>
          </div>
           <p className="text-xs text-muted-foreground pt-2 italic">
            {estimation.sessionCostBreakdown}
          </p>
        </div>
      )}
    </div>
  );
}
