
'use client';

import { useState, useEffect } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { UserPreferences } from '@/app/actions/user-preferences';
import type { Voice } from '@/hooks/use-speech-synthesis';
import { ScrollArea } from './ui/scroll-area';

type AccountDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: FirebaseUser;
  preferences: UserPreferences | null;
  onProfileUpdate: (updates: { displayName: string, defaultPronouns: string, defaultVoiceURI: string }) => Promise<void>;
  voices: Voice[];
  currentVoiceURI?: string;
  onSelectVoice: (voiceURI: string) => boolean;
};

export function AccountDialog({ isOpen, onOpenChange, user, preferences, onProfileUpdate, voices, currentVoiceURI, onSelectVoice }: AccountDialogProps) {
  const [displayName, setDisplayName] = useState('');
  const [defaultPronouns, setDefaultPronouns] = useState('Any');
  const [defaultVoiceURI, setDefaultVoiceURI] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
    }
    if (preferences) {
      setDefaultPronouns(preferences.defaultPronouns || 'Any');
      setDefaultVoiceURI(preferences.defaultVoiceURI || '');
    }
  }, [user, preferences]);
  
  useEffect(() => {
    if (currentVoiceURI) {
      setDefaultVoiceURI(currentVoiceURI);
    }
  }, [currentVoiceURI]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await onProfileUpdate({ displayName, defaultPronouns, defaultVoiceURI });
    setIsLoading(false);
  };

  const handleVoiceChange = (uri: string) => {
    if (onSelectVoice(uri)) {
      setDefaultVoiceURI(uri);
    }
  };

  const hasChanges = displayName !== (user.displayName || '') || defaultPronouns !== (preferences?.defaultPronouns || 'Any') || defaultVoiceURI !== (preferences?.defaultVoiceURI || '');
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
          <DialogDescription>
            Update your public display name and preferences.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="display-name" className="text-right">
                Display Name
              </Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="col-span-3"
                autoFocus
                disabled={isLoading || user.isAnonymous}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                value={user.email || 'N/A (Guest)'}
                className="col-span-3"
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="default-pronouns" className="text-right">
                Default Pronouns
              </Label>
              <Select value={defaultPronouns} onValueChange={setDefaultPronouns} disabled={isLoading}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select pronouns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Any">Any</SelectItem>
                  <SelectItem value="She/Her">She/Her</SelectItem>
                  <SelectItem value="He/Him">He/Him</SelectItem>
                  <SelectItem value="They/Them">They/Them</SelectItem>
                  <SelectItem value="Ze/Zir">Ze/Zir</SelectItem>
                  <SelectItem value="It/Its">It/Its</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="default-voice" className="text-right pt-2">
                Default Voice
              </Label>
              <div className="col-span-3">
                <Select value={defaultVoiceURI} onValueChange={handleVoiceChange} disabled={isLoading || voices.length === 0}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a default voice" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[200px]">
                      {voices.map((voice) => (
                        <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                          <div className="flex items-center gap-2">
                            <span className="truncate">{voice.name} ({voice.lang})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
                {voices.length === 0 && <p className="text-xs text-muted-foreground mt-2">No voices available in your browser.</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading || !displayName.trim() || !hasChanges}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
