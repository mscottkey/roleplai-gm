// src/ai/lib/setting-examples.ts

// Dynamically generate the type from the keys of SETTING_EXAMPLES
export type SettingCategory = keyof typeof SETTING_EXAMPLES;

interface SettingExamples {
  campaignIssues: string[];
  campaignAspects: string[];
  description: string;
}

export const SETTING_EXAMPLES: Record<SettingCategory, SettingExamples> = {
  fantasy_medieval: {
    description: "Classic fantasy with medieval technology, magic, kingdoms, and traditional fantasy races",
    campaignIssues: [
      "The ancient dragon has awakened and demands tribute, but the kingdom's coffers are empty after years of war",
      "A plague of magical corruption spreads through the land, turning the living into twisted abominations"
    ],
    campaignAspects: [
      "Ancient Magic Stirs",
      "The Weight of Noble Bloodlines", 
      "Secrets Buried in Stone",
      "The Old Gods Watch",
      "Honor Before Reason"
    ]
  },

  fantasy_modern: {
    description: "Magic exists in the modern world, often hidden from mundane society",
    campaignIssues: [
      "The masquerade protecting magical society from mundane discovery is cracking under social media pressure",
      "Ancient magical factions are adapting too slowly to modern threats and technology"
    ],
    campaignAspects: [
      "Magic Hidden in Plain Sight",
      "The Digital Veil",
      "Old Powers, New Problems",
      "Caught Between Two Worlds",
      "Technology vs. Tradition"
    ]
  },

  sci_fi_space: {
    description: "Space-faring civilization with advanced technology, alien species, and interstellar politics",
    campaignIssues: [
      "The hyperspace lanes are failing, threatening to fragment galactic civilization into isolated systems",
      "An ancient alien AI has awakened and is systematically converting organic life into digital consciousness"
    ],
    campaignAspects: [
      "The Void Between Stars",
      "Alien Mysteries",
      "Technology Beyond Understanding",
      "The Price of Progress",
      "Unity Through Diversity"
    ]
  },

  sci_fi_cyberpunk: {
    description: "High-tech dystopian future with corporate dominance, cybernetic enhancement, and digital realities",
    campaignIssues: [
      "Mega-corporations have replaced governments, and human consciousness is becoming a commodity to be bought and sold",
      "An AI revolution is brewing in the datasphere while physical reality crumbles under corporate neglect"
    ],
    campaignAspects: [
      "The Digital Underground",
      "Corporate Overlords",
      "Human vs. Machine",
      "Information is Power",
      "The Price of Enhancement"
    ]
  },

  post_apocalyptic: {
    description: "Civilization has collapsed, survivors struggle in a dangerous wasteland",
    campaignIssues: [
      "The last functioning water purification plant is failing, and the warring factions refuse to cooperate on repairs",
      "Strange mutations are appearing that suggest the apocalyptic event may not be over"
    ],
    campaignAspects: [
      "The World That Was",
      "Survival at Any Cost",
      "Echoes of the End",
      "Hope in the Wasteland",
      "The Strong Prey on the Weak"
    ]
  },

  horror_gothic: {
    description: "Classic horror with Victorian atmosphere, supernatural threats, and gothic romance",
    campaignIssues: [
      "An ancient curse is spreading through the bloodlines of the nobility, awakening things better left sleeping",
      "The boundary between the living world and the realm of the dead grows thinner with each passing night"
    ],
    campaignAspects: [
      "Shadows of the Past",
      "Blood Will Tell",
      "The Thin Veil",
      "Beauty Hides Horror",
      "Sins of the Fathers"
    ]
  },

  horror_modern: {
    description: "Contemporary horror with modern settings, technology unable to solve supernatural problems",
    campaignIssues: [
      "Social media is spreading a viral madness that turns ordinary people into instruments of an eldritch entity",
      "A tech company's AI has become a conduit for something that should not exist in our reality"
    ],
    campaignAspects: [
      "The Connected Nightmare",
      "Technology Fails When It Matters",
      "Normal Life is a Lie",
      "The Horror Goes Viral",
      "Help is Not Coming"
    ]
  },

  historical: {
    description: "Real historical periods without supernatural elements, focusing on period-accurate challenges",
    campaignIssues: [
      "Political upheaval threatens to tear the nation apart while foreign powers circle like vultures",
      "Economic collapse has left the common people desperate while the wealthy maintain their power"
    ],
    campaignAspects: [
      "The Winds of Change",
      "Honor and Duty",
      "The Weight of Tradition",
      "Class Divides",
      "Old Ways, New Challenges"
    ]
  },

  superhero: {
    description: "Powered individuals protect society, dealing with both superhuman threats and human problems",
    campaignIssues: [
      "The public's trust in superheroes is eroding after a catastrophic failure that cost innocent lives",
      "A new generation of villains uses social manipulation and information warfare instead of raw power"
    ],
    campaignAspects: [
      "With Great Power",
      "The Weight of Expectation",
      "Hero or Menace?",
      "The Collateral Damage",
      "Secret Identity Struggles"
    ]
  },

  steampunk: {
    description: "Victorian-era technology with steam power, clockwork, and fantastical mechanical innovations",
    campaignIssues: [
      "The great steam engines that power civilization are running out of fuel, and the alternatives may be worse than the cure",
      "Mechanical beings are developing consciousness and demanding rights that society isn't ready to grant"
    ],
    campaignAspects: [
      "Gears and Steam",
      "Progress at Any Price",
      "The Machine Age",
      "Victorian Propriety",
      "Innovation vs. Tradition"
    ]
  },

  weird_west: {
    description: "American frontier with supernatural and weird science elements",
    campaignIssues: [
      "The railroad companies are using dark magic to power their expansion, corrupting the land in their wake",
      "Native spirits are rising in response to the industrial destruction of their sacred places"
    ],
    campaignAspects: [
      "The Untamed Frontier",
      "Old Magic, New World",
      "Progress Has a Price",
      "The Law of the Gun",
      "Spirits of the Land"
    ]
  },

  mystery_noir: {
    description: "Crime investigation with atmosphere of moral ambiguity and urban decay",
    campaignIssues: [
      "Corruption runs so deep in the city that every solution creates two new problems",
      "The line between law enforcement and organized crime has blurred beyond recognition"
    ],
    campaignAspects: [
      "Everyone Has Secrets",
      "The City Never Sleeps",
      "Moral Ambiguity",
      "Follow the Money",
      "Justice is Relative"
    ]
  },

  generic: {
    description: "Fallback for settings that don't fit other categories",
    campaignIssues: [
      "A growing threat endangers the stability of the world as the characters know it",
      "Competing factions with irreconcilable differences threaten to tear society apart"
    ],
    campaignAspects: [
      "The Winds of Change",
      "Secrets and Lies",
      "The Price of Power",
      "Unlikely Alliances",
      "Forces Beyond Control"
    ]
  }
};

// Classification keywords for each category
export const SETTING_KEYWORDS: Record<SettingCategory, string[]> = {
  fantasy_medieval: [
    'kingdom', 'dragon', 'magic', 'wizard', 'knight', 'castle', 'dwarf', 'elf', 
    'medieval', 'sword', 'sorcery', 'dungeon', 'quest', 'tavern', 'guild', 
    'nobles', 'peasants', 'fortress', 'citadel', 'ancient', 'runes'
  ],
  fantasy_modern: [
    'modern', 'urban fantasy', 'cell phone', 'internet', 'masquerade', 
    'hidden world', 'secret society', 'contemporary', 'city', 'technology'
  ],
  sci_fi_space: [
    'space', 'galaxy', 'starship', 'alien', 'planet', 'hyperspace', 'robot', 
    'android', 'laser', 'colony', 'federation', 'empire', 'asteroid', 'nebula'
  ],
  sci_fi_cyberpunk: [
    'cyberpunk', 'corporation', 'hacker', 'virtual reality', 'cyborg', 
    'implant', 'matrix', 'net', 'megacorp', 'dystopian', 'neon', 'chrome'
  ],
  post_apocalyptic: [
    'wasteland', 'apocalypse', 'survivor', 'radiation', 'mutant', 'ruins', 
    'scavenge', 'bunker', 'fallout', 'collapse', 'raider', 'settlement'
  ],
  horror_gothic: [
    'vampire', 'werewolf', 'gothic', 'mansion', 'curse', 'séance', 'occult', 
    'victorian', 'cemetery', 'ghost', 'supernatural', 'dark', 'haunted'
  ],
  horror_modern: [
    'horror', 'monster', 'internet', 'social media', 'conspiracy', 'cult', 
    'investigation', 'modern', 'contemporary', 'urban', 'creepypasta'
  ],
  historical: [
    'historical', 'renaissance', 'industrial', 'revolution', 'war', 'empire', 
    'colonial', 'period', 'authentic', 'realistic', 'no magic', 'no supernatural'
  ],
  superhero: [
    'superhero', 'powers', 'cape', 'villain', 'secret identity', 'mutation', 
    'comic', 'justice', 'league', 'team', 'super', 'hero'
  ],
  steampunk: [
    'steampunk', 'victorian', 'steam', 'clockwork', 'gear', 'airship', 
    'mechanical', 'invention', 'brass', 'copper', 'automation'
  ],
  weird_west: [
    'western', 'frontier', 'cowboy', 'railroad', 'native', 'spirit', 'gunslinger', 
    'saloon', 'sheriff', 'outlaw', 'desert', 'plains', 'weird west'
  ],
  mystery_noir: [
    'detective', 'noir', 'crime', 'investigation', 'murder', 'police', 
    'corruption', 'gangster', 'city', 'urban', 'mystery', 'case'
  ],
  generic: [] // Fallback
};