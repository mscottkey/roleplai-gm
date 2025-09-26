
export const genres = [
  'Sci-Fi',
  'Medieval Fantasy',
  'Cyberpunk',
  'Gothic Horror',
  'Post-Apocalyptic',
] as const;

export type Genre = (typeof genres)[number];
