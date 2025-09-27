
'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Logo } from './logo';
import { Card, CardContent } from './ui/card';
import { gmPlottingMessages } from '@/lib/gm-plotting-messages';

type GenerationProgressProps = {
  current: number;
  total: number;
  step: string;
};

export function GenerationProgress({ current, total, step }: GenerationProgressProps) {
  const progressValue = (current / total) * 100;
  const [gmMessage, setGmMessage] = useState('');

  useEffect(() => {
    const stageKeys: (keyof typeof gmPlottingMessages)[] = ['classify', 'core', 'factions', 'nodes', 'resolution'];
    const currentStageKey = stageKeys[current - 1];
    
    if (!currentStageKey || !gmPlottingMessages[currentStageKey]) {
      return;
    }

    const messagesForStage = gmPlottingMessages[currentStageKey];
    let lastIndex = -1;

    const pickRandomMessage = () => {
      let randomIndex = Math.floor(Math.random() * messagesForStage.length);
      // Avoid showing the same message twice in a row if possible
      if (messagesForStage.length > 1 && randomIndex === lastIndex) {
        randomIndex = (randomIndex + 1) % messagesForStage.length;
      }
      lastIndex = randomIndex;
      setGmMessage(messagesForStage[randomIndex]);
    };

    // Set an initial message immediately
    pickRandomMessage();

    // Set up the interval to rotate messages
    const intervalId = setInterval(pickRandomMessage, 5000);

    // Cleanup function to clear the interval when the component unmounts or the step changes
    return () => {
      clearInterval(intervalId);
    };
  }, [current, step]);

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
             <p className="text-muted-foreground text-sm italic min-h-[2rem] flex items-center justify-center px-4">
              {gmMessage}
            </p>
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
