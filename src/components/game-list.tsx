'use client';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import type { GameSession } from '@/app/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Gamepad2 } from 'lucide-react';
import { useSidebar } from './ui/sidebar';

type GameListProps = {
  games: GameSession[];
  activeGameId: string | null;
  onSelectGame: (id: string) => void;
};

export function GameList({ games, activeGameId, onSelectGame }: GameListProps) {
  const { state } = useSidebar();
  
  if (games.length === 0) {
    if (state === 'expanded') {
        return <p className="p-4 text-sm text-muted-foreground">No past games found.</p>;
    }
    return null;
  }

  return (
    <SidebarMenu>
      {games.map((game) => {
        const title = game.gameData.name || game.gameData.setting.split('\n')[0].replace(/\*\*/g, '');
        return (
          <SidebarMenuItem key={game.id}>
            <SidebarMenuButton
              onClick={() => onSelectGame(game.id)}
              isActive={game.id === activeGameId}
              className="h-auto flex-col items-start p-2 group-data-[collapsible=icon]:h-10"
              tooltip={title}
            >
              <div className="flex w-full items-start gap-2">
                <Gamepad2 className="mt-1 group-data-[collapsible=icon]:mt-0" />
                <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                  <span className="font-medium">{title}</span>
                  <span className="text-xs text-muted-foreground">
                    {game.createdAt.toDate ? formatDistanceToNow(game.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
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
