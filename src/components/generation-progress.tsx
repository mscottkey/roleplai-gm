
'use client';

import { Progress } from '@/components/ui/progress';
import { BrandedLoadingSpinner } from './icons';
import { Card, CardContent } from './ui/card';

type GenerationProgressProps = {
  current: number;
  total: number;
  step: string;
};

export function GenerationProgress({ current, total, step }: GenerationProgressProps) {
  const progressValue = (current / total) * 100;

  return (
    <Card className="w-full max-w-lg text-center shadow-lg">
        <CardContent className="p-8 space-y-6">
            <BrandedLoadingSpinner className="w-24 h-24 mx-auto" />
            <div>
                <h2 className="text-xl font-headline font-semibold text-primary">The AI is Weaving Your World...</h2>
                <p className="text-muted-foreground mt-2 animate-pulse">{step}</p>
            </div>
            <Progress value={progressValue} className="w-full" />
            <p className="text-sm text-muted-foreground">Step {current} of {total}</p>
        </CardContent>
    </Card>
  );
}
