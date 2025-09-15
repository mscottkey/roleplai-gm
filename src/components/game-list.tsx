'use client';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import type { GameSession } from '@/app/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Gamepad2 } from 'lucide-react';

type GameListProps = {
  games: GameSession[];
  activeGameId: string | null;
  onSelectGame: (id: string) => void;
};

export function GameList({ games, activeGameId, onSelectGame }: GameListProps) {
  if (games.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground group-data-[collapsible=icon]:hidden">No past games found.</p>;
  }

  return (
    <SidebarMenu>
      {games.map((game) => {
        const title = game.gameData.setting.split('\n')[0].replace(/\*\*/g, '');
        return (
          <SidebarMenuItem key={game.id}>
            <SidebarMenuButton
              onClick={() => onSelectGame(game.id)}
              isActive={game.id === activeGameId}
              className="h-auto flex-col items-start p-2"
              tooltip={title}
            >
              <div className="flex w-full items-start gap-2">
                <Gamepad2 className="mt-1" />
                <div className="flex flex-col">
                  <span className="font-medium">{title}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(game.createdAt.toDate(), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  );
}
