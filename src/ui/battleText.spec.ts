import { describe, expect, it } from 'vitest';
import { battleLines } from './battleText';

describe('battleLines', () => {
  it('describes a super-effective hit', () => {
    const lines = battleLines([{ kind: 'attack', by: 'player', attacker: 'Pikachu', move: 'Thunderbolt', damage: 75, multiplier: 2 }], 'Misty');

    expect(lines).toEqual(['Pikachu used Thunderbolt!', "It's super effective!"]);
  });

  it('describes a weak hit and an immune target', () => {
    const lines = battleLines(
      [
        { kind: 'attack', by: 'leader', attacker: 'Staryu', move: 'Surf', damage: 20, multiplier: 0.5 },
        { kind: 'attack', by: 'player', attacker: 'Pikachu', move: 'Thunderbolt', damage: 0, multiplier: 0 },
      ],
      'Misty',
    );

    expect(lines).toEqual(["Misty's Staryu used Surf!", "It's not very effective…", 'Pikachu used Thunderbolt!', 'It had no effect…']);
  });

  it('describes fainting, the next Pokémon and the end of the battle', () => {
    const lines = battleLines(
      [
        { kind: 'fainted', side: 'leader', name: 'Staryu' },
        { kind: 'sent-out', side: 'leader', name: 'Gyarados' },
        { kind: 'fainted', side: 'player', name: 'Pikachu' },
        { kind: 'sent-out', side: 'player', name: 'Bulbasaur' },
        { kind: 'won' },
        { kind: 'lost' },
      ],
      'Misty',
    );

    expect(lines).toEqual([
      "Misty's Staryu fainted!",
      'Misty sent out Gyarados!',
      'Pikachu fainted!',
      'Go, Bulbasaur!',
      'You defeated Misty!',
      'All your Pokémon fainted…',
    ]);
  });
});
