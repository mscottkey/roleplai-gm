
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
    Users,
    MapPin,
    Settings2,
    GraduationCap,
    Star,
    Sparkles as StuntIcon,
    Globe,
    BookOpen,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { CostEstimator } from "./cost-estimator";


import type { GameData, MechanicsVisibility } from "@/app/lib/types";
import type { WorldState } from "@/ai/schemas/world-state-schemas";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type StoryDrawerProps = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    gameData: GameData;
    worldState: WorldState | null;
    mechanicsVisibility: MechanicsVisibility;
    setMechanicsVisibility: (value: MechanicsVisibility) => void;
};

const getSkillDisplay = (rank: number, visibility: MechanicsVisibility) => {
    if (visibility === 'Full') {
        return `+${rank}`;
    }
    switch (rank) {
        case 1: return 'Average';
        case 2: return 'Fair';
        case 3: return 'Good';
        case 4: return 'Great';
        default: return `+${rank}`;
    }
}

export function StoryDrawer({
    isOpen,
    onOpenChange,
    gameData,
    worldState,
    mechanicsVisibility,
    setMechanicsVisibility
}: StoryDrawerProps) {
    const { characters, campaignStructure, setting, tone } = gameData;
    const { knownPlaces, knownFactions } = worldState ?? {};
    
    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="font-headline">Player Notes</SheetTitle>
          <SheetDescription>Your party's characters and discoveries.</SheetDescription>
        </SheetHeader>
        <Separator />
        <div className="flex-1 overflow-y-auto p-6">
          <Accordion type="multiple" defaultValue={['briefing', 'characters']} className="w-full">
            <AccordionItem value="briefing">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Campaign Briefing</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert text-muted-foreground space-y-4 pt-2">
                <div>
                  <h4 className="font-bold text-foreground">Setting</h4>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{setting}</ReactMarkdown>
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Tone</h4>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{tone}</ReactMarkdown>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="characters">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>The Party</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4 pt-2">
                {characters && characters.length > 0 ? (
                    characters.map((char, index) => (
                        <div key={char.id} className="text-sm space-y-2 not-prose">
                            <p className="font-bold text-foreground">{char.name} <span className="font-normal italic">({char.playerName})</span></p>
                            <p>{char.description}</p>
                            <p className="text-xs italic text-muted-foreground/80 flex items-center gap-2"><Star className="h-3 w-3"/> Aspect: {char.aspect}</p>

                            {char.skills && char.skills.length > 0 && (
                                <div>
                                    <h5 className="font-semibold text-foreground text-xs flex items-center gap-2 mb-1"><GraduationCap className="h-3 w-3"/> Skills</h5>
                                    <div className="flex flex-wrap gap-1">
                                        {char.skills.sort((a,b) => b.rank - a.rank).map(skill => (
                                            <Badge key={skill.name} variant="secondary" className="text-xs">
                                                {skill.name} ({getSkillDisplay(skill.rank, mechanicsVisibility)})
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                             {char.stunts && char.stunts.length > 0 && (
                                <div>
                                    <h5 className="font-semibold text-foreground text-xs flex items-center gap-2 mb-1"><StuntIcon className="h-3 w-3"/> Stunts</h5>
                                    <ul className="list-disc pl-4 text-xs space-y-1">
                                      {char.stunts.map(stunt => (
                                        <li key={stunt.name}><strong>{stunt.name}:</strong> {stunt.description}</li>
                                      ))}
                                    </ul>
                                </div>
                            )}
                            { index < characters.length - 1 && <Separator className="mt-4" /> }
                        </div>
                    ))
                ) : (
                    "Your party will be assembled soon."
                )}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="world">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>Known World</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert text-muted-foreground space-y-4 pt-2">
                 <div>
                  <h4 className="font-bold text-foreground flex items-center gap-2"><MapPin className="h-4 w-4" />Known Places</h4>
                    {(knownPlaces && knownPlaces.length > 0) ? (
                        <ul className="list-disc pl-5">
                        {knownPlaces.map((place, i) => <li key={i}>{place.name}: {place.description}</li>)}
                        </ul>
                    ) : (
                        "No significant places discovered yet."
                    )}
                 </div>
                 <div>
                  <h4 className="font-bold text-foreground flex items-center gap-2"><Users className="h-4 w-4" />Known Factions</h4>
                    {(knownFactions && knownFactions.length > 0) ? (
                        <ul className="list-disc pl-5">
                        {knownFactions.map((faction, i) => <li key={i}>{faction.name}: {faction.description}</li>)}
                        </ul>
                    ) : (
                        "No significant factions discovered yet."
                    )}
                 </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="settings">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  <span>Session Settings</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-2">
                <div className="space-y-4">
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
                 <Separator />
                 <div className="space-y-4">
                    <h4 className="font-medium text-foreground">Cost Estimation</h4>
                    <CostEstimator 
                        characters={characters}
                        campaignGenerated={!!campaignStructure}
                    />
                 </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </SheetContent>
    </Sheet>
    );
}
