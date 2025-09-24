
'use client';

import { useState, useEffect } from 'react';
import { signInAnonymously, signInWithEmailAndPassword, signInWithRedirect, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner, BrandedLoadingSpinner } from '@/components/icons';
import { ArrowRight, LogIn } from 'lucide-react';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 48" {...props}>
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.802 9.122C34.786 5.613 29.735 3.5 24 3.5C13.257 3.5 4.5 12.257 4.5 23s8.757 19.5 19.5 19.5c10.164 0 18.986-7.836 19.489-18.067L43.611 20.083z"/>
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12.5 24 12.5c3.059 0 5.842 1.154 7.961 3.039l5.841-5.841C34.786 5.613 29.735 3.5 24 3.5C16.913 3.5 10.739 7.28 6.306 14.691z"/>
        <path fill="#4CAF50" d="M24 44.5c5.943 0 11.219-2.585 14.936-6.572l-6.53-5.438c-1.853 2.585-4.915 4.51-8.406 4.51c-5.223 0-9.651-3.657-11.303-8.25H4.5v8.067C9.014 40.164 16.035 44.5 24 44.5z"/>
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.16-4.087 5.571l6.53 5.438C41.071 34.685 44 28.167 44 23c0-1.288-.13-2.54-.389-3.791L43.611 20.083z"/>
    </svg>
);


export default function LoginPage() {
  const { user, loading, redirectLoading } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !redirectLoading && user) {
      router.replace('/play');
    }
  }, [loading, redirectLoading, user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error("Email sign-in failed:", error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error?.message || 'Could not sign in with that email and password. Please try again.',
      });
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsGuestLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (error: any) {
      console.error("Anonymous sign-in failed:", error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error?.message || 'Could not sign in as a guest. Please try again.',
      });
      setIsGuestLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence)
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      toast({
        variant: "destructive",
        title: "Google Sign-In Failed",
        description: "Could not start the Google sign-in process. Please try again."
      });
      setIsGoogleLoading(false);
    }
  };

  if (loading || redirectLoading) {
    return (
      <div className="flex flex-col h-screen w-screen items-center justify-center bg-background gap-4">
        <BrandedLoadingSpinner className="h-24 w-24" />
        <p className="text-muted-foreground text-sm animate-pulse">
          {redirectLoading ? 'Finalizing sign-in…' : 'Loading session…'}
        </p>
      </div>
    );
  }

  // The user object is available, but we are still on the login page.
  // The useEffect above will trigger a navigation to `/play`.
  // We can render null or a minimal loading state to avoid a flash of the login form.
  if (user) {
    return (
       <div className="flex flex-col h-screen w-screen items-center justify-center bg-background gap-4">
        <BrandedLoadingSpinner className="h-24 w-24" />
        <p className="text-muted-foreground text-sm animate-pulse">
          Redirecting...
        </p>
      </div>
    );
  }


  return (
    <div className="relative flex items-center justify-center min-h-screen w-full bg-cover bg-center p-4" style={{backgroundImage: "url('/landing-background.png')"}}>
      <div className="absolute inset-0 bg-black/60 z-0" />
      <Card className="w-full max-w-md mx-4 shadow-2xl z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-3">
            <Logo imageSrc="/roleplai-logo.png?v=2" imageAlt="RoleplAI Logo" width={64} height={64} />
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
                disabled={isLoading || isGuestLoading || isGoogleLoading}
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
                disabled={isLoading || isGuestLoading || isGoogleLoading}
              />
            </div>
            <Button type="submit" className="w-full h-12" disabled={isLoading || isGuestLoading || isGoogleLoading || !email || !password}>
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
          <div className="grid grid-cols-2 gap-4 w-full">
            <Button onClick={handleGoogleLogin} variant="outline" className="w-full h-12" disabled={isLoading || isGuestLoading || isGoogleLoading}>
              {isGoogleLoading ? (
                <LoadingSpinner className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <GoogleIcon className="mr-2 h-5 w-5" />
              )}
              Google
            </Button>
            <Button onClick={handleGuestLogin} variant="secondary" className="w-full h-12" disabled={isLoading || isGuestLoading || isGoogleLoading}>
              {isGuestLoading ? (
                <LoadingSpinner className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-5 w-5" />
              )}
              Guest
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

    