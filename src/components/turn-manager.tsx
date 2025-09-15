'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Character } from "@/app/lib/types";
import { Users } from "lucide-react";

type TurnManagerProps = {
  characters: Character[];
  activeCharacter: Character | null;
  setActiveCharacter: (character: Character) => void;
};

export function TurnManager({ characters, activeCharacter, setActiveCharacter }: TurnManagerProps) {
  
  const handleValueChange = (characterId: string) => {
    const newActiveCharacter = characters.find(c => c.id === characterId);
    if (newActiveCharacter) {
      setActiveCharacter(newActiveCharacter);
    }
  };

  if (characters.length <= 1) {
    return null; // Don't show turn manager for single player games
  }

  return (
    <div className="p-4 border-b bg-card">
      <div className="max-w-4xl mx-auto flex items-center gap-3">
        <Users className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Active Character:</span>
        <Select value={activeCharacter?.id} onValueChange={handleValueChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a character..." />
          </SelectTrigger>
          <SelectContent>
            {characters.map(char => (
              <SelectItem key={char.id} value={char.id}>
                {char.name} ({char.playerName})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
