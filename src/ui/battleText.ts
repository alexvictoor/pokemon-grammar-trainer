import type { BattleEvent } from '../domain/battle';

const effectLine = (multiplier: number): string[] => {
  if (multiplier === 0) return ['It had no effect…'];
  if (multiplier > 1) return ["It's super effective!"];
  if (multiplier < 1) return ["It's not very effective…"];
  return [];
};

export const battleLines = (events: BattleEvent[], leader: string): string[] =>
  events.flatMap(event => {
    switch (event.kind) {
      case 'attack':
        return [`${event.by === 'leader' ? `${leader}'s ` : ''}${event.attacker} used ${event.move}!`, ...effectLine(event.multiplier)];
      case 'fainted':
        return [`${event.side === 'leader' ? `${leader}'s ` : ''}${event.name} fainted!`];
      case 'sent-out':
        return [event.side === 'leader' ? `${leader} sent out ${event.name}!` : `Go, ${event.name}!`];
      case 'won':
        return [`You defeated ${leader}!`];
      case 'lost':
        return ['All your Pokémon fainted…'];
    }
  });
