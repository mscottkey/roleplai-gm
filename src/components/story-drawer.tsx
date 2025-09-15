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
    Settings2,
    FileText,
    ListTodo,
    History
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';


import type { GameData, MechanicsVisibility } from "@/app/lib/types";
import type { WorldState } from "@/ai/schemas/world-state-schemas";

type StoryDrawerProps = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    gameData: GameData;
    worldState: WorldState | null;
    mechanicsVisibility: MechanicsVisibility;
    setMechanicsVisibility: (value: MechanicsVisibility) => void;
};

export function StoryDrawer({
    isOpen,
    onOpenChange,
    gameData,
    worldState,
    mechanicsVisibility,
    setMechanicsVisibility
}: StoryDrawerProps) {
    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="font-headline">Story & World</SheetTitle>
          <SheetDescription>Your campaign's details at a glance.</SheetDescription>
        </SheetHeader>
        <Separator />
        <div className="flex-1 overflow-y-auto p-6">
          <Accordion type="multiple" defaultValue={['world-state', 'campaign', 'characters', 'settings']} className="w-full">
            
            <AccordionItem value="world-state">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-bold">AI Game State</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert text-muted-foreground space-y-4">
                <div>
                  <h4 className="font-bold text-foreground flex items-center gap-2"><FileText className="h-4 w-4" />Summary</h4>
                   <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{worldState?.summary ?? "Not yet available."}</ReactMarkdown>
                </div>
                 <div>
                  <h4 className="font-bold text-foreground flex items-center gap-2"><ListTodo className="h-4 w-4" />Story Outline</h4>
                   <ul className="list-disc pl-5">
                       {worldState?.storyOutline?.map((item, i) => <li key={i}><ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{item}</ReactMarkdown></li>) ?? <li>Not yet available.</li>}
                   </ul>
                </div>
                 <div>
                  <h4 className="font-bold text-foreground flex items-center gap-2"><History className="h-4 w-4" />Recent Events</h4>
                   <ul className="list-disc pl-5">
                       {worldState?.recentEvents?.map((item, i) => <li key={i}><ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{item}</ReactMarkdown></li>) ?? <li>Not yet available.</li>}
                   </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="campaign">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <BookText className="h-4 w-4" />
                  <span>Campaign Info</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert text-muted-foreground space-y-4">
                <div>
                  <h4 className="font-bold text-foreground">Setting</h4>
                   <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{gameData.setting}</ReactMarkdown>
                </div>
                 <div>
                  <h4 className="font-bold text-foreground">Tone</h4>
                   <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{gameData.tone}</ReactMarkdown>
                </div>
                 <div>
                  <h4 className="font-bold text-foreground">Initial Hooks</h4>
                   <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{gameData.initialHooks}</ReactMarkdown>
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
                        <div key={char.id} className="text-sm prose prose-sm dark:prose-invert max-w-none">
                            <p className="font-bold text-foreground not-prose">{char.name} <span className="font-normal italic">({char.playerName})</span></p>
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{char.description}</ReactMarkdown>
                            <p className="text-xs italic text-muted-foreground/80 not-prose">Aspect: {char.aspect}</p>
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
                 {worldState?.places && worldState.places.length > 0 ? (
                    worldState.places.map((place, i) => (
                        <div key={i} className="text-sm prose prose-sm dark:prose-invert max-w-none">
                            <p className="font-bold text-foreground not-prose">{place.name}</p>
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{place.description}</ReactMarkdown>
                        </div>
                    ))
                ) : (
                     "Important locations will be tracked here as they are discovered."
                )}
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
