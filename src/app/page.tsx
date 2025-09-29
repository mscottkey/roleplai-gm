
'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Bot, Compass, Feather } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';

export default function LandingPage() {
  const router = useRouter();
  const bgImage = {
    imageUrl: "/landing-background.png",
    description: "A mysterious hooded figure with glowing eyes sits at a table, acting as a game master for a tabletop RPG with several other players.",
    imageHint: "tabletop RPG game master"
  };
  

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex items-center">
            {/* <Logo className="w-8 h-8 mr-2 text-primary" /> */}
            <Logo imageSrc="/roleplai-logo.png?v=2" imageAlt="Test Logo" width={64} height={64} />
            <span className="font-headline text-lg font-bold text-primary">RoleplAI GM</span>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <nav className="flex items-center">
              <Button variant="ghost" onClick={() => router.push('/login')}>
                Sign In
              </Button>
              <Button onClick={() => router.push('/login')}>
                Sign Up <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative w-full flex items-center justify-center text-center text-white">
          <div className="w-full">
            {bgImage && (
              <Image
                src={bgImage.imageUrl}
                alt={bgImage.description}
                width={1920}
                height={1080}
                className="w-full h-auto"
                data-ai-hint={bgImage.imageHint}
                priority
              />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 container max-w-4xl px-4">
            <h1 className="text-4xl font-headline font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Your Personal AI Game Master
            </h1>
            <p className="mt-4 max-w-[700px] mx-auto text-lg text-neutral-200 md:text-xl">
              Craft unforgettable tabletop RPG adventures. Generate worlds, create characters, and let the AI handle the rest. Your story is waiting.
            </p>
            <div className="mt-8 flex justify-center">
              <Button size="lg" onClick={() => router.push('/login')} className="font-headline text-lg">
                Start Your Adventure for Free
                <ArrowRight className="ml-2" />
              </Button>
            </div>
          </div>
        </section>

        <section id="features" className="container py-12 sm:py-24">
           <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-headline text-3xl font-bold leading-[1.1] sm:text-3xl md:text-5xl text-primary">Features</h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Everything you need to run dynamic, AI-powered RPG sessions with your friends.
            </p>
          </div>
          <div className="mx-auto grid justify-center gap-8 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3 lg:gap-12 mt-12">
            <div className="flex flex-col items-center justify-start text-center p-4 rounded-lg">
              <div className="bg-primary text-primary-foreground p-3 rounded-full mb-4">
                <Compass className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold font-headline">Dynamic World Generation</h3>
              <p className="mt-2 text-muted-foreground">
                Describe any world you can imagine, from cyberpunk cities to enchanted forests, and our AI will build it for you, complete with factions, locations, and plot hooks.
              </p>
            </div>
            <div className="flex flex-col items-center justify-start text-center p-4 rounded-lg">
              <div className="bg-primary text-primary-foreground p-3 rounded-full mb-4">
                <Feather className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold font-headline">AI-Powered Narration</h3>
              <p className="mt-2 text-muted-foreground">
                The AI GM narrates events, resolves player actions, and answers questions, adapting the story to your party's choices in real-time.
              </p>
            </div>
            <div className="flex flex-col items-center justify-start text-center p-4 rounded-lg">
              <div className="bg-primary text-primary-foreground p-3 rounded-full mb-4">
                <Bot className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold font-headline">Intelligent Rule System</h3>
              <p className="mt-2 text-muted-foreground">
                Powered by Fate Core, the AI intelligently interprets rules for skills and stunts, providing mechanical details or pure narrative as you prefer.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <Logo className="w-6 h-6" />
            <p className="text-center text-sm leading-loose md:text-left">
              Built with Magic and Code.
            </p>
          </div>
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} RoleplAI GM. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
