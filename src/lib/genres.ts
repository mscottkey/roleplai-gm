
export const genres = [
  'Sci-Fi',
  'Medieval Fantasy',
  'Modern Horror',
  'High Seas Adventure',
  'Post-Apocalyptic',
] as const;

export type Genre = (typeof genres)[number];
