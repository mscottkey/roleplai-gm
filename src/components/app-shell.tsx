'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarProvider,
  SidebarInset,
  SidebarFooter,
  SidebarSeparator,
  SidebarMenuButton
} from '@/components/ui/sidebar'
import { Logo } from './logo'
import { GameList } from './game-list'
import { UserMenu } from './user-menu'
import type { GameSession } from '@/app/lib/types'
import { PlusCircle } from 'lucide-react'
import { useSidebar } from '@/components/ui/sidebar'

type AppShellProps = {
  children: React.ReactNode
  games: GameSession[]
  activeGameId: string | null
  onNewGame: () => void
  onSelectGame: (id: string) => void
}

function AppShellHeader() {
    const { state } = useSidebar();
    return (
        <SidebarHeader>
          <div className="flex items-center justify-between p-2">
             <div className="flex items-center gap-2">
                <Logo className="w-8 h-8 text-primary" />
                {state === 'expanded' && <span className="font-headline text-lg font-bold text-primary">RoleplAI GM</span>}
             </div>
             <SidebarTrigger />
          </div>
        </SidebarHeader>
    )
}

export function AppShell({ children, games, activeGameId, onNewGame, onSelectGame }: AppShellProps) {
  return (
    <SidebarProvider>
      <Sidebar>
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
          />
        </SidebarContent>
        <SidebarFooter>
          <UserMenu />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
