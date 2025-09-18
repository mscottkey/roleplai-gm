
import { Button } from "@/components/ui/button";
import { BookText, PanelLeft, Volume2, VolumeX } from 'lucide-react';
import { ThemeToggle } from "./theme-toggle";
import { useIsMobile } from "@/hooks/use-mobile";

type HeaderProps = {
  onOpenDrawer: () => void;
  onOpenStory: () => void;
  isSpeaking: boolean;
};

export function Header({ onOpenDrawer, onOpenStory, isSpeaking }: HeaderProps) {
  const isMobile = useIsMobile();
  return (
    <header className="flex items-center justify-between p-4 border-b bg-card/80 backdrop-blur-sm">
       {isMobile && (
        <Button variant="ghost" size="icon" onClick={onOpenStory} aria-label="Open story view">
          <PanelLeft className="h-5 w-5" />
        </Button>
      )}

      <div className="flex-1 flex items-center gap-2">
        {isSpeaking ? (
            <Volume2 className="h-5 w-5 text-accent animate-pulse" />
        ) : (
            <VolumeX className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={onOpenDrawer} aria-label="Open story notes">
          <BookText className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
