import { masteryOf, type Cards } from './mastery';
import type { Question } from './question';

export interface Gym {
  id: string;
  leader: string;
  city: string;
  badge: string;
  chapters: number[];
  team: number[];
  unlockAt: number;
  types: string[];
  reward: number;
}

export const GYMS: Gym[] = [
  { id: 'boulder', leader: 'Brock', city: 'Pewter City', badge: 'Boulder Badge', chapters: [15, 16], team: [74, 111, 95], unlockAt: 70, types: ['rock', 'ground', 'normal'], reward: 377 },
  { id: 'cascade', leader: 'Misty', city: 'Cerulean City', badge: 'Cascade Badge', chapters: [17, 18], team: [120, 54, 121], unlockAt: 70, types: ['water', 'ice'], reward: 245 },
  { id: 'thunder', leader: 'Lt. Surge', city: 'Vermilion City', badge: 'Thunder Badge', chapters: [19, 20], team: [100, 25, 26], unlockAt: 70, types: ['electric', 'steel'], reward: 145 },
  { id: 'rainbow', leader: 'Erika', city: 'Celadon City', badge: 'Rainbow Badge', chapters: [21, 22], team: [71, 114, 45], unlockAt: 70, types: ['grass', 'bug'], reward: 251 },
  { id: 'soul', leader: 'Koga', city: 'Fuchsia City', badge: 'Soul Badge', chapters: [23, 24], team: [109, 89, 110], unlockAt: 70, types: ['poison', 'dark'], reward: 491 },
  { id: 'marsh', leader: 'Sabrina', city: 'Saffron City', badge: 'Marsh Badge', chapters: [25, 31], team: [64, 122, 65], unlockAt: 70, types: ['psychic', 'fairy', 'ghost'], reward: 150 },
  { id: 'volcano', leader: 'Blaine', city: 'Cinnabar Island', badge: 'Volcano Badge', chapters: [26, 27, 28, 29, 30], team: [58, 77, 59], unlockAt: 70, types: ['fire', 'fighting'], reward: 146 },
  { id: 'earth', leader: 'Giovanni', city: 'Viridian City', badge: 'Earth Badge', chapters: [32, 33], team: [111, 51, 34], unlockAt: 70, types: ['dragon', 'flying'], reward: 384 },
];

export const gymProgress = (gym: Gym, questions: Question[], cards: Cards): { mastery: number; unlocked: boolean } => {
  const mastery = masteryOf(
    questions.filter(question => gym.chapters.includes(question.chapter)),
    cards,
  );
  return { mastery, unlocked: mastery >= gym.unlockAt };
};
