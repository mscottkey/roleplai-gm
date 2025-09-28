
'use client';

import { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Copy, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type QRCodeDisplayProps = {
  gameId: string;
  gameName: string;
  playerCount: number;
};

export function QRCodeDisplay({ gameId, gameName, playerCount }: QRCodeDisplayProps) {
  const [joinUrl, setJoinUrl] = useState('');
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // We add a timestamp to the URL to make the QR code "refreshable"
      // Note: This does not create a secure, one-time-use token. That requires a backend implementation.
      const url = `${window.location.origin}/play?game=${gameId}&join_ts=${refreshKey}`;
      setJoinUrl(url);
    }
  }, [gameId, refreshKey]);

  const handleCopy = (textToCopy: string, type: 'URL' | 'ID') => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast({
        title: `${type} Copied!`,
        description: `The ${type.toLowerCase()} has been copied to your clipboard.`,
      });
    }).catch(err => {
      console.error(`Failed to copy ${type}: `, err);
      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: `Could not copy the ${type.toLowerCase()}.`,
      });
    });
  };

  if (!joinUrl) return null;

  return (
    <Card className="bg-muted/30 border-dashed">
      <CardHeader>
        <CardTitle className="text-lg">Local Session Join</CardTitle>
        <CardDescription>Players can scan this code to join the game on their device.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 text-center">
        <div className="p-4 bg-white rounded-lg shadow-md">
          <QRCodeCanvas
            key={refreshKey}
            value={joinUrl}
            size={192}
            bgColor={"#ffffff"}
            fgColor={"#000000"}
            level={"L"}
            includeMargin={false}
          />
        </div>
        <div className="text-center">
          <p className="font-semibold">{gameName}</p>
          <p className="text-sm text-muted-foreground">{playerCount} {playerCount === 1 ? 'player' : 'players'}</p>
        </div>
        <Button onClick={() => setRefreshKey(Date.now())} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh QR Code
        </Button>
        <div className="w-full space-y-2 text-left">
          <label htmlFor="manual-id" className="text-xs font-medium text-muted-foreground">Or join with Manual ID:</label>
          <div className="flex items-center gap-2">
            <Input id="manual-id" readOnly value={gameId} className="font-mono text-xs" />
            <Button size="icon" variant="ghost" onClick={() => handleCopy(gameId, 'ID')}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
