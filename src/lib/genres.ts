
export const genres = [
  'Sci-Fi',
  'Medieval Fantasy',
  'Cyberpunk',
  'Gothic Horror',
  'Post-Apocalyptic',
  'Steampunk',
  'High Seas Adventure',
] as const;

export type Genre = (typeof genres)[number];
