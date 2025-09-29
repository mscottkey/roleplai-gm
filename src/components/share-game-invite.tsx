
'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ShareGameInviteProps = {
  gameId: string;
};

export function ShareGameInvite({ gameId }: ShareGameInviteProps) {
  const [inviteUrl, setInviteUrl] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/play?game=${gameId}`;
      setInviteUrl(url);
    }
  }, [gameId]);

  const handleCopy = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      toast({
        title: 'Invite Link Copied!',
        description: 'You can now share this link with your friends.',
      });
    }).catch(err => {
      console.error('Failed to copy text: ', err);
       toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Could not copy the invite link to your clipboard.',
      });
    });
  };

  if (!inviteUrl) return null;

  return (
    <div className="space-y-2 rounded-lg border bg-background p-4">
      <Label htmlFor="invite-url" className="font-bold">Invite Your Party</Label>
      <div className="flex w-full items-center space-x-2">
        <Input
          id="invite-url"
          type="text"
          value={inviteUrl}
          readOnly
          className="flex-1 bg-muted"
        />
        <Button type="button" size="icon" onClick={handleCopy}>
          <Copy className="h-4 w-4" />
          <span className="sr-only">Copy invite link</span>
        </Button>
      </div>
    </div>
  );
}

    