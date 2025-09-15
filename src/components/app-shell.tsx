'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSkeleton,
  SidebarProvider,
  SidebarInset,
  SidebarFooter,
  SidebarSeparator
} from '@/components/ui/sidebar'
import { Logo } from './logo'
import { GameList } from './game-list'
import { UserMenu } from './user-menu'
import type { GameSession } from '@/app/lib/types'
import { Button } from './ui/button'
import { PlusCircle } from 'lucide-react'

type AppShellProps = {
  children: React.ReactNode
  games: GameSession[]
  activeGameId: string | null
  onNewGame: () => void
  onSelectGame: (id: string) => void
}

export function AppShell({ children, games, activeGameId, onNewGame, onSelectGame }: AppShellProps) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2 pr-0">
             <Logo className="w-8 h-8 text-primary" />
             <span className="font-headline text-lg font-bold text-primary">RoleplAI GM</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
             <SidebarMenuItem>
                <Button variant="ghost" onClick={onNewGame} className="w-full justify-start">
                    <PlusCircle className="mr-2" />
                    New Game
                </Button>
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
