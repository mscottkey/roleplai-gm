
import type { Genre } from './genres';

export const promptsByGenre: Record<Genre, string[]> = {
  'Sci-Fi': [
    'A lost colony ship has been found, but its inhabitants have evolved into something new and strange.',
    'First contact with a silicon-based life form on a rogue planet.',
    'A detective story set on a generation ship where the AI has been murdered.',
    'Rebel pilots fighting against a galaxy-spanning, oppressive empire.',
    'An archaeological dig on Mars uncovers a gateway to another dimension.',
  ],
  'Medieval Fantasy': [
    'A quest to find a lost city of giants said to hold the secrets of ancient magic.',
    'Protecting a village from a curse that makes nightmares real.',
    'An expedition into the Underdark to close a portal to the Abyss.',
    'A diplomatic mission to the court of the Dragon Emperor goes horribly wrong.',
    'Heirs to a fallen kingdom must gather allies to reclaim their throne from a necromancer.',
  ],
  'Cyberpunk': [
    'A freelance netrunner is hired to steal a rival corporation\'s experimental AI.',
    'An augmented detective hunts a serial killer who harvests chrome implants from their victims.',
    'A group of street samurai defend their neighborhood from a corporate \'urban renewal\' project.',
    'A celebrity\'s backup consciousness has been stolen, and the party is hired to retrieve it.',
    'Infiltrate a high-stakes, illegal street race where the cars and drivers are neurally linked.',
  ],
  'Gothic Horror': [
    'The party is invited to a secluded manor for a will reading, only to be hunted by a family curse.',
    'An investigation into a series of disappearances leads to a masquerade ball hosted by a vampire.',
    'A village hires the party to hunt a beast in the woods, but the monster is one of the villagers.',
    'A playwright\'s new production is causing audience members to go mad, and the party must stop the final performance.',
    'The party awakens in a decaying sanatorium with amnesia, hunted by the spirits of former patients.',
  ],
  'Post-Apocalyptic': [
    'A caravan journey across a mutant-infested wasteland to deliver a "package" to a secure enclave.',
    'Scavengers in the ruins of a megacity discover a functional pre-war AI that offers them a deal.',
    'A tribe of survivors must defend their settlement from a horde of technologically advanced raiders.',
    'An expedition into a highly radioactive "dead zone" to find a rumored seed bank.',
    'The last scientists in a bunker must venture out to find a component to fix their failing life support.',
  ],
  'Steampunk': [
    'Inventors in a city of brass and steam must stop a rogue clockwork leviathan from destroying the metropolis.',
    'An airship crew is hired to chart a newly discovered continent full of strange flora and fauna.',
    'A consulting detective with a mechanical arm investigates a series of impossible thefts.',
    'The party must race against a rival government to retrieve a powerful energy source from a fallen star.',
    'A secret society of automata rights activists needs help smuggling a self-aware machine to freedom.'
  ],
  'High Seas Adventure': [
    'A crew of privateers is given a royal pardon if they can hunt down a notorious pirate king.',
    'A cursed treasure map leads to an island that only appears on the full moon.',
    'The party must defend their ship against a kraken summoned by a rival crew.',
    'A quest to find the Fountain of Youth takes the party through naval blockades and ancient sea monster territory.',
    'Smugglers are hired for one last job: deliver a mysterious passenger to a forbidden port.'
  ]
};
