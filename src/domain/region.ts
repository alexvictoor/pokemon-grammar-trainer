import type { Rarity, WildPokemon } from './encounter';
import type { Gym } from './gym';

export const CHAPTER_TITLES: Record<number, string> = {
  15: 'The verb be',
  16: 'The verb have',
  17: 'Simple present',
  18: 'Present continuous',
  19: 'Simple past',
  20: 'Past continuous',
  21: 'Present perfect',
  22: 'Simple past or present perfect',
  23: 'Present perfect continuous',
  24: 'Past perfect',
  25: 'The future',
  26: 'Modal auxiliaries',
  27: 'Ability',
  28: 'Obligation',
  29: 'Advice and suggestion',
  30: 'Probability with modals',
  31: 'Questions',
  32: 'The passive',
  33: 'Relative clauses',
};

export const isGymOpen = (gyms: Gym[], index: number, badges: string[]): boolean => {
  const previous = gyms[index - 1];
  return index === 0 || (previous !== undefined && badges.includes(previous.id));
};

export const openChapters = (gyms: Gym[], badges: string[]): number[] =>
  gyms.flatMap((gym, index) => (isGymOpen(gyms, index, badges) ? gym.chapters : []));

export const gymOfChapter = (gyms: Gym[], chapter: number): Gym | undefined => gyms.find(gym => gym.chapters.includes(chapter));

export const encounterTable = (
  pokemon: { id: number; types: string[]; rarity: Rarity; legendary?: boolean }[],
  gyms: Gym[],
  chapter: number,
): WildPokemon[] => {
  const gym = gymOfChapter(gyms, chapter);
  const wild = pokemon.filter(entry => !entry.legendary);
  const themed = gym ? [...wild].sort((a, b) => a.id - b.id).filter(entry => entry.types.some(type => gym.types.includes(type))) : [];
  const routeIndex = gym ? gym.chapters.indexOf(chapter) : 0;
  const routes = gym?.chapters.length ?? 1;
  const table = themed.filter((_, index) => index % routes === routeIndex);
  return (table.length > 0 ? table : wild).map(({ id, rarity }) => ({ id, rarity }));
};
