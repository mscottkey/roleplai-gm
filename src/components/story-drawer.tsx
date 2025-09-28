

'use client';

import { useState } from 'react';
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Users,
    MapPin,
    Settings2,
    GraduationCap,
    Star,
    Sparkles as StuntIcon,
    Globe,
    BookOpen,
    History,
    RefreshCcw,
    Mic,
    PlayCircle,
    PauseCircle,
    PowerOff,
    DoorClosed,
    QrCode,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { CostEstimator } from "./cost-estimator";
import { Button } from './ui/button';
import { LoadingSpinner } from './icons';
import { ShareGameInvite } from './share-game-invite';
import { VoiceSelector } from './ui/voice-selector';
import { QRCodeDisplay } from './qr-code-display';
import { Switch } from './ui/switch';


import type { GameData, MechanicsVisibility, SessionStatus } from "@/app/lib/types";
import type { WorldState } from "@/ai/schemas/world-state-schemas";
import type { CampaignStructure } from "@/ai/schemas/campaign-structure-schemas";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSearchParams } from 'next/navigation';
import type { Voice } from '@/hooks/use-speech-synthesis';
import { cn } from '@/lib/utils';

type StoryDrawerProps = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    gameData: GameData;
    worldState: WorldState | null;
    campaignStructure: CampaignStructure | null;
    mechanicsVisibility: MechanicsVisibility;
    setMechanicsVisibility: (value: MechanicsVisibility) => void;
    onRegenerateStoryline: () => void;
    isLoading: boolean;
    voices: Voice[];
    selectedVoice: SpeechSynthesisVoice | null;
    onSelectVoice: (voiceURI: string) => boolean;
    sessionStatus: SessionStatus;
    onUpdateStatus: (status: SessionStatus) => void;
    onConfirmEndCampaign: () => void;
    onConfirmEndSession: () => void;
};

const getSkillDisplay = (rank: number) => {
    switch (rank) {
        case 1: return 'Average';
        case 2: return 'Fair';
        case 3: return 'Good';
        default: return `Rank ${rank}`;
    }
}

export function StoryDrawer({
    isOpen,
    onOpenChange,
    gameData,
    worldState,
    campaignStructure,
    mechanicsVisibility,
    setMechanicsVisibility,
    onRegenerateStoryline,
    isLoading,
    voices,
    selectedVoice,
    onSelectVoice,
    sessionStatus,
    onUpdateStatus,
    onConfirmEndCampaign,
    onConfirmEndSession,
}: StoryDrawerProps) {
    const { characters, setting, tone, playMode } = gameData;
    const { knownPlaces, knownFactions, recentEvents } = worldState ?? {};
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const searchParams = useSearchParams();
    const gameId = searchParams.get('game');
    const [showQrCode, setShowQrCode] = useState(false);

    const handleRegenerateClick = () => {
        onRegenerateStoryline();
        setIsAlertOpen(false);
    }
    
    const StatusBadge = ({ status }: { status: SessionStatus }) => {
        const variant = status === 'active' ? 'default' : status === 'paused' ? 'secondary' : 'destructive';
        return <Badge variant={variant} className="capitalize">{status}</Badge>
    }

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

                                {char.stats?.skills && char.stats.skills.length > 0 && (
                                    <div>
                                        <h5 className="font-semibold text-foreground text-xs flex items-center gap-2 mb-1"><GraduationCap className="h-3 w-3"/> Skills</h5>
                                        <div className="flex flex-wrap gap-1">
                                            {char.stats.skills.sort((a: any,b: any) => b.rank - a.rank).map((skill: any) => (
                                                <Badge key={skill.name} variant="secondary" className="text-xs">
                                                    {skill.name} ({getSkillDisplay(skill.rank)})
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                 {char.stats?.stunts && char.stats.stunts.length > 0 && (
                                    <div>
                                        <h5 className="font-semibold text-foreground text-xs flex items-center gap-2 mb-1"><StuntIcon className="h-3 w-3"/> Stunts</h5>
                                        <ul className="list-disc pl-4 text-xs space-y-1">
                                          {char.stats.stunts.map((stunt: any) => (
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
                
                <AccordionItem value="log">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4" />
                      <span>Game Log</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="prose prose-sm dark:prose-invert text-muted-foreground space-y-2 pt-2">
                     {(recentEvents && recentEvents.length > 0) ? (
                        <ul className="list-disc pl-5">
                        {recentEvents.map((event, i) => <li key={i}>{event}</li>)}
                        </ul>
                    ) : (
                        "No recent events to show."
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
                    {gameId && (
                        <>
                         <ShareGameInvite gameId={gameId} />
                         <Separator />
                         <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium text-foreground flex items-center gap-2"><QrCode className="h-4 w-4" /> QR Code Join</h4>
                                <Switch checked={showQrCode} onCheckedChange={setShowQrCode} />
                            </div>
                            {showQrCode && (
                                <QRCodeDisplay
                                    gameId={gameId}
                                    gameName={gameData.name}
                                    playerCount={worldState?.characters?.length || 0}
                                />
                            )}
                         </div>
                         <Separator />
                        </>
                    )}
                     <div className="space-y-4">
                        <h4 className="font-medium text-foreground">Session Status</h4>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">Current Status:</span>
                                <StatusBadge status={sessionStatus} />
                            </div>
                            <div className={cn("flex gap-2", { "hidden": sessionStatus === 'finished' || sessionStatus === 'archived' })}>
                                {sessionStatus === 'active' && (
                                    <Button size="sm" variant="outline" onClick={() => onUpdateStatus('paused')} disabled={isLoading}><PauseCircle className="mr-2 h-4 w-4" />Pause</Button>
                                )}
                                {sessionStatus === 'paused' && (
                                    <Button size="sm" variant="outline" onClick={() => onUpdateStatus('active')} disabled={isLoading}><PlayCircle className="mr-2 h-4 w-4" />Resume</Button>
                                )}
                            </div>
                        </div>
                    </div>
                    <Separator />
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
                                <Label htmlFor="vis-full">Full (Rolls &amp; resources)</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                        <h4 className="font-medium text-foreground flex items-center gap-2"><Mic className="h-4 w-4" />Voice Settings</h4>
                        <VoiceSelector 
                            voices={voices}
                            selectedVoice={selectedVoice}
                            onSelectVoice={onSelectVoice}
                        />
                    </div>
                     <Separator />
                     <div className="space-y-4">
                        <h4 className="font-medium text-foreground">Cost Tracking</h4>
                        <CostEstimator 
                            gameId={gameId}
                        />
                     </div>
                     <Separator />
                      <div className="space-y-4">
                          <h4 className="font-medium text-foreground">Danger Zone</h4>
                          <div className="flex flex-col gap-2">
                            <Button variant="secondary" className="w-full" onClick={onConfirmEndSession} disabled={isLoading || sessionStatus === 'finished'}>
                                <DoorClosed className="mr-2 h-4 w-4" />
                                End Current Session
                            </Button>
                            <Button variant="outline" className="w-full" onClick={() => setIsAlertOpen(true)} disabled={isLoading || sessionStatus === 'finished'}>
                                {isLoading ? (
                                    <LoadingSpinner className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCcw className="mr-2 h-4 w-4" />
                                )}
                                Regenerate Storyline
                            </Button>
                            <Button variant="destructive" className="w-full" onClick={onConfirmEndCampaign} disabled={isLoading || sessionStatus === 'finished'}>
                                <PowerOff className="mr-2 h-4 w-4" />
                                End Campaign
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">End the current session, regenerate the entire plot, or end the campaign permanently.</p>
                      </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will completely discard the current storyline, including all progress, recent events, and discovered places/factions. Your characters will be placed at the start of a brand new plot. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRegenerateClick} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                            Yes, Regenerate
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </SheetContent>
        </Sheet>
    );
}
