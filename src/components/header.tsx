
import { Button } from "@/components/ui/button";
import { BookText, PanelLeft } from 'lucide-react';
import { ThemeToggle } from "./theme-toggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { TTSControls } from "./tts-controls";

type HeaderProps = {
  onOpenDrawer: () => void;
  onOpenStory: () => void;
  // TTS Props
  isSpeaking: boolean;
  isPaused: boolean;
  isAutoPlayEnabled: boolean;
  isTTSSupported: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSetAutoPlay: (enabled: boolean) => void;
  ttsVolume: 'low' | 'med' | 'high';
  onCycleTtsVolume: () => void;
};

export function Header({
  onOpenDrawer,
  onOpenStory,
  ...ttsProps
}: HeaderProps) {
  const isMobile = useIsMobile();
  return (
    <header className="flex items-center justify-between p-4 border-b bg-card/80 backdrop-blur-sm h-20">
       {isMobile && (
        <Button variant="ghost" size="icon" onClick={onOpenStory} aria-label="Open story view">
          <PanelLeft className="h-5 w-5" />
        </Button>
      )}

      <div className="flex-1 flex items-center gap-2 h-9">
        <TTSControls {...ttsProps} />
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
