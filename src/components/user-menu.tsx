
'use client';

import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { LogOut, User, Settings, ShieldCheck, Award } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSidebar } from './ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { setAdminClaim } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

type UserMenuProps = {
  onOpenAccount: () => void;
};


export function UserMenu({ onOpenAccount }: UserMenuProps) {
  const { user, isAdmin } = useAuth();
  const { state } = useSidebar();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handleMakeAdmin = async () => {
    if (!user) return;
    const result = await setAdminClaim(user.uid);
    if (result.success) {
      toast({
        title: "Admin Granted!",
        description: "You now have admin privileges. Please refresh the page.",
      });
      // Force a reload to get new token with admin claim
      setTimeout(() => window.location.reload(), 1500);
    } else {
      toast({
        variant: "destructive",
        title: "Failed to Grant Admin",
        description: result.message,
      });
    }
  };

  if (!user) {
    return null;
  }

  const displayName = user.isAnonymous ? "Guest User" : user.displayName || user.email || "User";
  const displayId = user.isAnonymous ? user.uid : user.email;

  if (state === 'collapsed') {
    return (
      <div className="p-2 w-full flex justify-center">
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-center h-auto p-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {user.isAnonymous ? <User /> : displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                  </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" align="center">
                <p>{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{displayId}</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onOpenAccount}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Account Settings</span>
              </DropdownMenuItem>
              {isAdmin ? (
                <DropdownMenuItem onClick={() => router.push('/admin')}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  <span>Admin Dashboard</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handleMakeAdmin}>
                  <Award className="mr-2 h-4 w-4" />
                  <span>Become Admin (Dev)</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
              </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  return (
    <div className="p-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-start text-left h-auto px-2 py-2">
             <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user.isAnonymous ? <User /> : displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left overflow-hidden">
                  <span className="text-sm font-medium truncate">{displayName}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {displayId}
                  </span>
                </div>
             </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onOpenAccount}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Account Settings</span>
          </DropdownMenuItem>
           {isAdmin ? (
            <DropdownMenuItem onClick={() => router.push('/admin')}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              <span>Admin Dashboard</span>
            </DropdownMenuItem>
           ) : (
            <DropdownMenuItem onClick={handleMakeAdmin}>
                <Award className="mr-2 h-4 w-4" />
                <span>Become Admin (Dev)</span>
            </DropdownMenuItem>
           )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
