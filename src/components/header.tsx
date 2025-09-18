
import { Button } from "@/components/ui/button";
import { BookText, PanelLeft, Volume2, XCircle } from 'lucide-react';
import { ThemeToggle } from "./theme-toggle";
import { useIsMobile } from "@/hooks/use-mobile";

type HeaderProps = {
  onOpenDrawer: () => void;
  onOpenStory: () => void;
  isSpeaking: boolean;
  onStopSpeak: () => void;
};

export function Header({ onOpenDrawer, onOpenStory, isSpeaking, onStopSpeak }: HeaderProps) {
  const isMobile = useIsMobile();
  return (
    <header className="flex items-center justify-between p-4 border-b bg-card/80 backdrop-blur-sm">
       {isMobile && (
        <Button variant="ghost" size="icon" onClick={onOpenStory} aria-label="Open story view">
          <PanelLeft className="h-5 w-5" />
        </Button>
      )}

      <div className="flex-1 flex items-center gap-2 h-9">
        {isSpeaking && (
            <Button variant="outline" size="sm" onClick={onStopSpeak}>
                <XCircle className="h-4 w-4 mr-2" />
                Stop
            </Button>
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
