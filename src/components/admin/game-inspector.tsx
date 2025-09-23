
'use client';

import type { GameSession } from '@/app/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

function JsonViewer({ data }: { data: any }) {
    return (
        <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
            <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
    );
}


export function GameInspector({ game }: { game: GameSession }) {
  return (
    <Accordion type="multiple" defaultValue={['gameData', 'worldState']} className="w-full">
      <AccordionItem value="gameData">
        <AccordionTrigger>Game Data</AccordionTrigger>
        <AccordionContent>
          <JsonViewer data={game.gameData} />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="worldState">
        <AccordionTrigger>World State</AccordionTrigger>
        <AccordionContent>
          <JsonViewer data={game.worldState} />
        </AccordionContent>
      </AccordionItem>
       <AccordionItem value="campaignStructure">
        <AccordionTrigger>Campaign Structure</AccordionTrigger>
        <AccordionContent>
          <JsonViewer data={game.gameData.campaignStructure} />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="messages">
        <AccordionTrigger>Message History</AccordionTrigger>
        <AccordionContent>
          <JsonViewer data={game.messages} />
        </AccordionContent>
      </AccordionItem>
       <AccordionItem value="raw">
        <AccordionTrigger>Raw Session Data</AccordionTrigger>
        <AccordionContent>
          <JsonViewer data={game} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
