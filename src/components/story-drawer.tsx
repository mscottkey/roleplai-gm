'use client';

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from "@/components/ui/sheet";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    BookText,
    Users,
    MapPin,
    Sparkles,
    Settings2
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import type { GameData, MechanicsVisibility } from "@/app/lib/types";

type StoryDrawerProps = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    gameData: GameData;
    mechanicsVisibility: MechanicsVisibility;
    setMechanicsVisibility: (value: MechanicsVisibility) => void;
};

export function StoryDrawer({
    isOpen,
    onOpenChange,
    gameData,
    mechanicsVisibility,
    setMechanicsVisibility
}: StoryDrawerProps) {
    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="font-headline">Story Notes</SheetTitle>
          <SheetDescription>Your campaign's details at a glance.</SheetDescription>
        </SheetHeader>
        <Separator />
        <div className="flex-1 overflow-y-auto p-6">
          <Accordion type="multiple" defaultValue={['setting', 'characters', 'settings']} className="w-full">
            <AccordionItem value="setting">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <BookText className="h-4 w-4" />
                  <span>Campaign Info</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert text-muted-foreground space-y-4">
                <div>
                  <h4 className="font-bold text-foreground">Setting</h4>
                   <ReactMarkdown remarkPlugins={[remarkGfm]}>{gameData.setting}</ReactMarkdown>
                </div>
                 <div>
                  <h4 className="font-bold text-foreground">Tone</h4>
                   <ReactMarkdown remarkPlugins={[remarkGfm]}>{gameData.tone}</ReactMarkdown>
                </div>
                 <div>
                  <h4 className="font-bold text-foreground">Initial Hooks</h4>
                   <ReactMarkdown remarkPlugins={[remarkGfm]}>{gameData.initialHooks}</ReactMarkdown>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="characters">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Characters</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4">
                {gameData.characters && gameData.characters.length > 0 ? (
                    gameData.characters.map(char => (
                        <div key={char.id} className="text-sm">
                            <p className="font-bold text-foreground">{char.name} <span className="font-normal italic">({char.playerName})</span></p>
                            <p>{char.description}</p>
                            <p className="text-xs italic text-muted-foreground/80">Aspect: {char.aspect}</p>
                        </div>
                    ))
                ) : (
                    "Character information will appear here."
                )}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="places">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Places</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Important locations will be tracked here.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="aspects">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Aspects</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Key story aspects from your game will be noted here.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="settings">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  <span>Session Settings</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                    <h4 className="font-medium text-foreground">Mechanics Visibility</h4>
                    <RadioGroup
                        value={mechanicsVisibility}
                        onValueChange={(value) => setMechanicsVisibility(value as MechanicsVisibility)}
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Hidden" id="vis-hidden" />
                            <Label htmlFor="vis-hidden">Hidden (Fiction only)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Minimal" id="vis-minimal" />
                            <Label htmlFor="vis-minimal">Minimal (Outcome tier)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Full" id="vis-full" />
                            <Label htmlFor="vis-full">Full (Rolls & resources)</Label>
                        </div>
                    </RadioGroup>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </SheetContent>
    </Sheet>
    );
}
