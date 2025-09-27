
'use client';

import { Progress } from '@/components/ui/progress';
import { Logo } from './logo';
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
            <Logo
              imageSrc="/roleplai-logo.png?v=2"
              imageAlt="RoleplAI GM Logo"
              width={96}
              height={96}
              className="w-24 h-24 mx-auto animate-[branded-loader-glow_2s_ease-in-out_infinite]"
            />
            <div>
                <h2 className="text-xl font-headline font-semibold text-primary">The GM is Plotting...</h2>
                <p className="text-muted-foreground mt-2 animate-pulse">{step}</p>
            </div>
            <Progress value={progressValue} className="w-full" />
            <p className="text-sm text-muted-foreground">Path {current} of {total} Unfolds</p>
        </CardContent>
    </Card>
  );
}
