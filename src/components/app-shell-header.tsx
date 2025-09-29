
'use client';

import { useRouter } from 'next/navigation';
import { SidebarHeader, SidebarTrigger } from '@/components/ui/sidebar';
import { Logo } from './logo';

export function AppShellHeader() {
  const router = useRouter();
  return (
      <SidebarHeader>
        <div className="flex items-center justify-between p-2">
           <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
                <Logo 
                  imageSrc="/roleplai-logo.png?v=2" 
                  imageAlt="RoleplAI Logo" 
                  width={64} 
                  height={64} 
                  className="w-8 h-8 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10" 
                />
                <span className="font-headline text-lg font-bold text-primary group-data-[collapsible=icon]:hidden">RoleplAI GM</span>
            </div>
           </div>
           <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarHeader>
  )
}
