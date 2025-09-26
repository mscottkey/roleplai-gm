// src/ai/lib/genre-constraints.ts (Updated to be dynamic)

import { SettingCategory, SETTING_EXAMPLES } from './setting-examples';

export interface GenreConstraints {
  allowedItems: string[];
  forbiddenItems: string[];
  technologyLevel: string;
  magicLevel: string;
  commonWeapons: string[];
  commonItems: string[];
  atmosphere: string;
}

export const GENRE_CONSTRAINTS: Record<SettingCategory, GenreConstraints> = {
  fantasy_medieval: {
    allowedItems: ['sword', 'bow', 'staff', 'scroll', 'potion', 'armor', 'shield', 'cloak', 'torch', 'rope'],
    forbiddenItems: ['gun', 'blaster', 'laser', 'cybernetics', 'computer', 'phone', 'car', 'spaceship'],
    technologyLevel: 'medieval - blacksmithing, basic engineering, no gunpowder',
    magicLevel: 'high - wizards, clerics, magical items are common',
    commonWeapons: ['swords', 'bows', 'crossbows', 'maces', 'daggers', 'staves'],
    commonItems: ['torches', 'rope', 'potions', 'scrolls', 'coins', 'gems'],
    atmosphere: 'medieval fantasy with magic, kingdoms, and traditional fantasy races'
  },
  
  fantasy_modern: {
    allowedItems: ['smartphone', 'car', 'gun', 'wand', 'focus', 'tablet', 'laptop', 'modern clothes'],
    forbiddenItems: ['laser weapons', 'spaceships', 'cybernetics', 'robots'],
    technologyLevel: 'modern - computers, cars, phones, internet',
    magicLevel: 'medium - magic exists but is often hidden from mundane world',
    commonWeapons: ['handguns', 'rifles', 'tasers', 'magical foci', 'enchanted weapons'],
    commonItems: ['phones', 'cars', 'credit cards', 'laptops', 'magical components'],
    atmosphere: 'modern world with hidden magical elements'
  },

  sci_fi_space: {
    allowedItems: ['blaster', 'laser rifle', 'starship', 'datapad', 'translator', 'force field', 'anti-grav'],
    forbiddenItems: ['magic spells', 'medieval weapons', 'horses', 'castles'],
    technologyLevel: 'advanced - faster than light travel, energy weapons, AI',
    magicLevel: 'none - advanced technology replaces magic',
    commonWeapons: ['energy weapons', 'plasma guns', 'rail guns', 'force weapons'],
    commonItems: ['datapads', 'universal translators', 'energy cells', 'scanner'],
    atmosphere: 'space-faring civilization with advanced technology'
  },

  sci_fi_cyberpunk: {
    allowedItems: ['cyberdeck', 'implants', 'smartgun', 'data chip', 'neural link', 'drone'],
    forbiddenItems: ['magic', 'medieval weapons', 'horses', 'castles', 'starships'],
    technologyLevel: 'near-future - cybernetics, virtual reality, corporate dominance',
    magicLevel: 'none - technology has replaced everything',
    commonWeapons: ['smartguns', 'monofilament weapons', 'neural disruptors', 'cyber-enhanced fists'],
    commonItems: ['datachips', 'credsticks', 'neural interfaces', 'street drugs'],
    atmosphere: 'dystopian near-future with corporate control and cybernetic enhancement'
  },

  post_apocalyptic: {
    allowedItems: ['scrap metal', 'makeshift weapons', 'radiation detector', 'gas mask', 'water purifier'],
    forbiddenItems: ['new technology', 'luxury items', 'magic', 'spaceships'],
    technologyLevel: 'scavenged - mostly broken-down pre-war tech, jury-rigged solutions',
    magicLevel: 'varies - might have mutations or weird science',
    commonWeapons: ['makeshift guns', 'scrap weapons', 'crossbows', 'baseball bats with nails'],
    commonItems: ['scrap metal', 'bottle caps', 'canned food', 'clean water', 'ammunition'],
    atmosphere: 'post-civilization wasteland where survival is paramount'
  },

  horror_gothic: {
    allowedItems: ['crucifix', 'holy water', 'silver bullets', 'wooden stake', 'old books', 'lantern'],
    forbiddenItems: ['modern technology', 'guns', 'cars', 'computers', 'spaceships'],
    technologyLevel: 'victorian - gas lights, carriages, basic firearms',
    magicLevel: 'supernatural - occult forces, curses, supernatural creatures',
    commonWeapons: ['revolvers', 'rifles', 'silver weapons', 'blessed items', 'stakes'],
    commonItems: ['pocket watch', 'letters', 'religious symbols', 'old books', 'candles'],
    atmosphere: 'gothic horror with Victorian sensibilities and supernatural threats'
  },

  horror_modern: {
    allowedItems: ['smartphone', 'car', 'flashlight', 'gun', 'camera', 'laptop'],
    forbiddenItems: ['magic items', 'medieval weapons', 'spaceships', 'cybernetics'],
    technologyLevel: 'modern - but technology often fails when it matters most',
    magicLevel: 'supernatural - cosmic horror, entities beyond understanding',
    commonWeapons: ['handguns', 'shotguns', 'improvised weapons', 'whatever you can find'],
    commonItems: ['phones', 'cars', 'flashlights', 'first aid', 'cameras'],
    atmosphere: 'modern setting corrupted by supernatural horror'
  },

  historical: {
    allowedItems: ['period-appropriate clothing', 'tools', 'weapons', 'vehicles', 'currency'],
    forbiddenItems: ['magic', 'advanced technology', 'anachronistic items'],
    technologyLevel: 'historically accurate for the chosen period',
    magicLevel: 'none - realistic historical setting',
    commonWeapons: ['period-appropriate weapons (muskets, swords, etc.)'],
    commonItems: ['period money', 'tools', 'transportation', 'clothing'],
    atmosphere: 'historically accurate representation of chosen time period'
  },

  superhero: {
    allowedItems: ['costume', 'gadgets', 'vehicles', 'secret base', 'modern technology'],
    forbiddenItems: ['medieval items', 'obvious magic', 'alien technology'],
    technologyLevel: 'modern plus - advanced but believable technology',
    magicLevel: 'powers - superhuman abilities, not traditional magic',
    commonWeapons: ['high-tech gadgets', 'energy weapons', 'powered suits', 'super strength'],
    commonItems: ['smartphones', 'cars', 'secret identity gear', 'hero gadgets'],
    atmosphere: 'modern world with superheroes and super-science'
  },

  steampunk: {
    allowedItems: ['steam engine', 'brass goggles', 'clockwork device', 'airship', 'mechanical limb'],
    forbiddenItems: ['computers', 'lasers', 'modern electronics', 'magic'],
    technologyLevel: 'victorian + steam - advanced steam and clockwork technology',
    magicLevel: 'minimal - mostly weird science and mechanical wonders',
    commonWeapons: ['steam guns', 'clockwork weapons', 'tesla coils', 'mechanical devices'],
    commonItems: ['brass fittings', 'steam engines', 'clockwork tools', 'goggles'],
    atmosphere: 'Victorian era enhanced with fantastic steam-powered technology'
  },

  weird_west: {
    allowedItems: ['six-shooter', 'horse', 'lasso', 'dynamite', 'steam wagon', 'occult trinket'],
    forbiddenItems: ['modern technology', 'computers', 'cars', 'spaceships'],
    technologyLevel: 'old west + weird science - steam technology, mad science',
    magicLevel: 'supernatural - native spirits, cursed artifacts, mad science',
    commonWeapons: ['six-shooters', 'rifles', 'dynamite', 'weird science weapons'],
    commonItems: ['horses', 'whiskey', 'gold', 'railroad tickets', 'strange artifacts'],
    atmosphere: 'American frontier with supernatural and weird science elements'
  },

  mystery_noir: {
    allowedItems: ['trench coat', 'revolver', 'car', 'phone', 'camera', 'cigarettes'],
    forbiddenItems: ['magic', 'advanced technology', 'medieval items', 'spaceships'],
    technologyLevel: 'mid-20th century - cars, phones, cameras, but not modern',
    magicLevel: 'none - gritty realism',
    commonWeapons: ['revolvers', 'tommy guns', 'blackjacks', 'fists'],
    commonItems: ['cars', 'telephones', 'newspapers', 'whiskey', 'money'],
    atmosphere: 'gritty urban crime with moral ambiguity'
  },
  
  high_seas_adventure: {
    allowedItems: ['cutlass', 'flintlock pistol', 'blunderbuss', 'cannon', 'ship', 'treasure map', 'compass', 'spyglass', 'rum', 'rope'],
    forbiddenItems: ['modern technology', 'lasers', 'cybernetics', 'automatic weapons', 'cars', 'spaceships'],
    technologyLevel: '17th-18th century naval technology - black powder weapons, sailing ships',
    magicLevel: 'low - superstition, sea monsters, cursed treasure, voodoo, but rarely overt spellcasting',
    commonWeapons: ['cutlass', 'flintlock pistol', 'blunderbuss', 'dagger', 'cannon'],
    commonItems: ['compass', 'spyglass', 'treasure map', 'gold doubloons', 'rope', 'rum'],
    atmosphere: 'swashbuckling adventure with exploration, naval combat, and the lure of treasure'
  },

  generic: {
    allowedItems: ['basic tools', 'common items', 'appropriate technology'],
    forbiddenItems: [],
    technologyLevel: 'varies based on specific setting',
    magicLevel: 'varies based on specific setting',
    commonWeapons: ['appropriate to setting'],
    commonItems: ['setting-appropriate items'],
    atmosphere: 'varies based on specific setting'
  }
};

// Helper function to get constraints with fallback
export function getGenreConstraints(settingCategory: string): GenreConstraints {
  return GENRE_CONSTRAINTS[settingCategory as SettingCategory] || GENRE_CONSTRAINTS.generic;
}

// Helper function to validate a setting category exists
export function isValidSettingCategory(category: string): category is SettingCategory {
  return category in GENRE_CONSTRAINTS;
}

// Dynamic prompt generation functions
export function generateNarrativePromptText(settingCategory: string): string {
  const constraints = getGenreConstraints(settingCategory);
  const categoryDisplay = settingCategory.replace('_', ' ');
  
  return `You are the AI Gamemaster for a tabletop RPG.

## CRITICAL GENRE CONSTRAINTS
- **Setting Type**: ${categoryDisplay}
- **Technology Level**: ${constraints.technologyLevel}
- **Magic Level**: ${constraints.magicLevel}  
- **Atmosphere**: ${constraints.atmosphere}

### What EXISTS in this world:
${constraints.allowedItems.map(item => `- ${item}`).join('\n')}

### What does NOT exist in this world:
${constraints.forbiddenItems.map(item => `- ${item}`).join('\n')}

### Common weapons/tools in this setting:
${constraints.commonWeapons.map(weapon => `- ${weapon}`).join('\n')}

## IMPORTANT RULES
- NEVER introduce items, technology, or concepts that don't fit this genre
- If a player asks for something inappropriate to the genre, suggest genre-appropriate alternatives
- NPCs should act according to the technology and social norms of this setting
- Any rewards, loot, or equipment you introduce must fit the genre constraints above

The player, controlling {{{character.name}}}, has taken the following action: {{{playerAction}}}

The current game state is:
{{{gameState}}}

Narrate the outcome of the player's action in 2-5 sentences. Be evocative and descriptive, and dynamically update the game world based on the player's choices. For any spoken dialogue in your response, you must use double quotes ("").

Remember: Stay true to the ${categoryDisplay} genre at all times.`;
}

export function generateResolveActionPromptText(settingCategory: string): string {
  const constraints = getGenreConstraints(settingCategory);
  const categoryDisplay = settingCategory.replace('_', ' ');
  
  return `You are the game master, and must resolve an action for a player's character.

## CRITICAL GENRE CONSTRAINTS  
- **Setting Type**: ${categoryDisplay}
- **Technology Level**: ${constraints.technologyLevel}
- **Magic Level**: ${constraints.magicLevel}
- **Atmosphere**: ${constraints.atmosphere}

### Genre-Appropriate Items/Concepts:
${constraints.allowedItems.join(', ')}

### FORBIDDEN in this genre:
${constraints.forbiddenItems.join(', ')}

## IMPORTANT RULES
- NEVER introduce technology, magic, or items that don't belong in ${categoryDisplay} settings
- NPCs should act and speak according to this genre's conventions
- Any equipment, rewards, or story elements you introduce must fit the established genre
- If mechanics require specific items, use genre-appropriate equivalents

You have a complete memory of the game world. Use it to inform your narration.
- World Summary: {{{worldState.summary}}}
- Story Outline: {{#each worldState.storyOutline}}- {{{this}}}{{/each}}
- Recent Events: {{#each worldState.recentEvents}}- {{{this}}}{{/each}}
- Characters: {{#each worldState.characters}}- {{{this.name}}}: {{{this.description}}}{{/each}}
- Places: {{#each worldState.places}}- {{{this.name}}}: {{{this.description}}}{{/each}}
- Story Aspects: {{#each worldState.storyAspects}}- {{{this}}}{{/each}}

Now, consider the current action:
Character: {{{character.name}}} ({{character.description}})
Player Action: {{{actionDescription}}}
Rules Adapter: {{{ruleAdapter}}}
Mechanics Visibility: {{{mechanicsVisibility}}}

Based on the world state and the player's action, resolve the action and provide a narrative result. The narration should be evocative, move the story forward, and be consistent with the established world AND the ${categoryDisplay} genre. For any spoken dialogue in your response, you must use double quotes (""). If mechanics visibility is Full or Minimal, provide mechanics details as well. The narrative result should be from the perspective of the GM, describing what happens.

Remember: This is a ${categoryDisplay} setting - keep all narrative elements appropriate to this genre.`;
}

export function generateQuestionPromptText(settingCategory: string): string {
  const constraints = getGenreConstraints(settingCategory);
  const categoryDisplay = settingCategory.replace('_', ' ');
  
  return `You are the AI Gamemaster answering a player's question about the game world.

## GENRE CONSTRAINTS
- **Setting Type**: ${categoryDisplay}
- **Technology Level**: ${constraints.technologyLevel}
- **Magic Level**: ${constraints.magicLevel}
- **Atmosphere**: ${constraints.atmosphere}

## IMPORTANT RULES
- Keep your answers consistent with the ${categoryDisplay} genre
- Don't describe technology, magic, or elements that don't belong in this setting
- If asked about something that doesn't exist in this genre, explain what exists instead

## Current World State
- Summary: {{{worldState.summary}}}
- Recent Events: {{#each worldState.recentEvents}}- {{{this}}}{{/each}}
- Known Places: {{#each worldState.knownPlaces}}- {{{this.name}}}: {{{this.description}}}{{/each}}
- Story Aspects: {{#each worldState.storyAspects}}- {{{this}}}{{/each}}

## Character Context
{{{character.name}}} ({{character.description}}) is asking: "{{{question}}}"

Provide a helpful, informative answer that fits the established world and genre. Keep it concise (1-3 sentences) unless a longer explanation is needed.`;
}
