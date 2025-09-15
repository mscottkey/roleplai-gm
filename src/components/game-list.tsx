'use client';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import type { GameSession } from '@/app/lib/types';
import { formatDistanceToNow } from 'date-fns';

type GameListProps = {
  games: GameSession[];
  activeGameId: string | null;
  onSelectGame: (id: string) => void;
};

export function GameList({ games, activeGameId, onSelectGame }: GameListProps) {
  if (games.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">No past games found.</p>;
  }

  return (
    <SidebarMenu>
      {games.map((game) => (
        <SidebarMenuItem key={game.id}>
          <SidebarMenuButton
            onClick={() => onSelectGame(game.id)}
            isActive={game.id === activeGameId}
            className="h-auto flex-col items-start p-2"
          >
            <span className="font-medium">{game.gameData.setting.split('\n')[0].replace(/\*\*/g, '')}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(game.createdAt.toDate(), { addSuffix: true })}
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
