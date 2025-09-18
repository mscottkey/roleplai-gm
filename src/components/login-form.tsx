
'use client';

import { useState } from 'react';
import { signInAnonymously, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/icons';
import { ArrowRight, LogIn } from 'lucide-react';
import { Logo } from './logo';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // NOTE: This will fail unless you enable Email/Password auth in Firebase.
      await signInWithEmailAndPassword(auth, email, password);
      // The auth state listener in useAuth will handle the redirect
    } catch (error) {
      console.error("Email sign-in failed:", error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Could not sign in with that email and password. Please try again.',
      });
      setIsLoading(false);
    }
  };


  const handleGuestLogin = async () => {
    setIsGuestLoading(true);
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
      setIsGuestLoading(false);
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
            Your personal AI Game Master for collaborative adventures.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading || isGuestLoading}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading || isGuestLoading}
                />
            </div>
            <Button type="submit" className="w-full h-12" disabled={isLoading || isGuestLoading || !email || !password}>
              {isLoading ? (
                <>
                  <LoadingSpinner className="mr-2 h-5 w-5 animate-spin" />
                  Logging In...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Login / Sign Up
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-4">
            <div className="relative w-full flex items-center">
                <Separator className="flex-1" />
                <span className="px-4 text-xs text-muted-foreground">OR</span>
                <Separator className="flex-1" />
            </div>
            <Button onClick={handleGuestLogin} variant="secondary" className="w-full h-12" disabled={isLoading || isGuestLoading}>
              {isGuestLoading ? (
                <>
                  <LoadingSpinner className="mr-2 h-5 w-5 animate-spin" />
                  Entering Portal...
                </>
              ) : (
                <>
                  Continue as Guest
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
