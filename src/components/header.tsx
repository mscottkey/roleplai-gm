import { Button } from "@/components/ui/button";
import { BookText } from 'lucide-react';
import { ThemeToggle } from "./theme-toggle";

type HeaderProps = {
  onOpenDrawer: () => void;
};

export function Header({ onOpenDrawer }: HeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 border-b bg-card/80 backdrop-blur-sm">
      <h1 className="text-xl font-headline font-bold text-primary">RoleplAI GM</h1>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={onOpenDrawer} aria-label="Open story notes">
          <BookText className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
