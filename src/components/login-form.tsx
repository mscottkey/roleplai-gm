'use client';

import { useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/icons';
import { ArrowRight } from 'lucide-react';
import { Logo } from './logo';
import { useToast } from '@/hooks/use-toast';

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGuestLogin = async () => {
    setIsLoading(true);
    try {
      await signInAnonymously(auth);
      // The auth state listener in useAuth will handle the redirect
    } catch (error) {
      console.error("Anonymous sign-in failed:", error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Could not sign in as a guest. Please try again.',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-background p-4 bg-[url('/grid.svg')]">
      <Card className="w-full max-w-md mx-4 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-3">
            <Logo className="h-12 w-12 text-primary" />
            <CardTitle className="font-headline text-4xl text-primary">RoleplAI GM</CardTitle>
          </div>
          <CardDescription className="pt-2">
            Your personal AI Game Master.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Sign in to save your games and continue your adventures later.
            </p>
            <Button onClick={handleGuestLogin} className="w-full h-12" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner className="mr-2 h-5 w-5 animate-spin" />
                  Entering Portal...
                </>
              ) : (
                <>
                  Sign In As Guest
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
