
'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import type { Character } from "@/app/lib/types";
import { Users, Star } from "lucide-react";

type TurnManagerProps = {
  characters: Character[];
  activeCharacter: Character | null;
  setActiveCharacter: (character: Character) => void;
  currentUserId?: string | null;
  hostId?: string | null;
  playMode?: 'local' | 'remote';
};

export function TurnManager({ 
  characters, 
  activeCharacter, 
  setActiveCharacter,
  currentUserId,
  hostId,
  playMode
}: TurnManagerProps) {
  
  const handleValueChange = (characterId: string) => {
    const newActiveCharacter = characters.find(c => c.id === characterId);
    if (newActiveCharacter) {
      setActiveCharacter(newActiveCharacter);
    }
  };

  const isHost = currentUserId === hostId;
  const canChangeTurn = playMode === 'local' || isHost;

  return (
    <div className="p-4 border-b bg-card space-y-4">
      {characters.length > 1 && (
         <div className="max-w-4xl mx-auto flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Active Character:</span>
            <Select value={activeCharacter?.id} onValueChange={handleValueChange} disabled={!canChangeTurn}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a character..." />
              </SelectTrigger>
              <SelectContent>
                {characters.filter(char => char.id).map(char => (
                  <SelectItem key={char.id} value={char.id}>
                    {char.name} ({char.playerName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
      )}
      {activeCharacter && (
        <Card className="max-w-4xl mx-auto bg-background/50">
          <CardContent className="p-3 text-center space-y-1">
             <div className="flex items-center justify-center gap-2 text-sm font-bold text-primary">
                <Star className="h-4 w-4" />
                <p className="italic">"{activeCharacter.aspect}"</p>
             </div>
             <p className="text-xs text-muted-foreground">{activeCharacter.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
