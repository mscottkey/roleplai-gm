
'use client';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { GameSession } from '@/app/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Users, User, MoreHorizontal, Trash2, Pencil } from 'lucide-react';
import { useSidebar } from './ui/sidebar';

type GameListProps = {
  games: GameSession[];
  activeGameId: string | null;
  onSelectGame: (id: string) => void;
  onDeleteGame: (game: GameSession) => void;
  onRenameGame: (game: GameSession) => void;
};

export function GameList({ games, activeGameId, onSelectGame, onDeleteGame, onRenameGame }: GameListProps) {
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
        const GameIcon = game.gameData.playMode === 'remote' ? Users : User;
        
        return (
          <SidebarMenuItem key={game.id}>
            <SidebarMenuButton
              onClick={() => onSelectGame(game.id)}
              isActive={game.id === activeGameId}
              className="h-auto flex-col items-start p-2 group-data-[collapsible=icon]:h-10"
              tooltip={title}
            >
              <div className="flex w-full items-start gap-2">
                <GameIcon className="mt-1 group-data-[collapsible=icon]:mt-0" />
                <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                  <span className="font-medium">{title}</span>
                  <span className="text-xs text-muted-foreground">
                    {game.createdAt?.toDate ? formatDistanceToNow(game.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                  </span>
                </div>
              </div>
            </SidebarMenuButton>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal />
                  <span className="sr-only">Game Actions</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start">
                <DropdownMenuItem onClick={() => onRenameGame(game)}>
                  <Pencil className="mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDeleteGame(game)}
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <Trash2 className="mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  );
}
