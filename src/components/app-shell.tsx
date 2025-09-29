

'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarFooter,
  SidebarSeparator,
  SidebarRail,
  SidebarTrigger
} from '@/components/ui/sidebar'
import { GameList } from './game-list'
import { UserMenu } from './user-menu'
import type { GameSession } from '@/app/lib/types'
import { PlusCircle } from 'lucide-react'
import { useSidebar } from '@/components/ui/sidebar'
import { AppShellHeader } from './app-shell-header'

type AppShellProps = {
  children: React.ReactNode
  games: GameSession[]
  activeGameId: string | null
  onNewGame: () => void
  onSelectGame: (id: string) => void
  onDeleteGame: (game: GameSession) => void
  onRenameGame: (game: GameSession) => void
  onOpenAccount: () => void;
}

function MobileHeader() {
    const { isMobile } = useSidebar();
    if (!isMobile) return null;
    
    return (
        <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
            <SidebarTrigger />
            {/* You can add other mobile header elements here if needed */}
        </header>
    )
}

export function AppShell({ children, games, activeGameId, onNewGame, onSelectGame, onDeleteGame, onRenameGame, onOpenAccount }: AppShellProps) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarRail />
        <AppShellHeader />
        <SidebarContent>
          <SidebarMenu>
             <SidebarMenuItem>
                <SidebarMenuButton variant="ghost" onClick={onNewGame} className="w-full justify-start" tooltip="New Game">
                    <PlusCircle />
                    <span>New Game</span>
                </SidebarMenuButton>
             </SidebarMenuItem>
          </SidebarMenu>
          <SidebarSeparator />
          <GameList 
            games={games}
            activeGameId={activeGameId}
            onSelectGame={onSelectGame}
            onDeleteGame={onDeleteGame}
            onRenameGame={onRenameGame}
          />
        </SidebarContent>
        <SidebarFooter>
          <UserMenu onOpenAccount={onOpenAccount} />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <MobileHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
