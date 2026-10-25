import type { PokemonEntry, TypeChart } from './pokemon';

export interface Move {
  name: string;
  type: string;
  power: number;
  risk: 'safe' | 'strong';
}

export interface Combatant {
  entry: PokemonEntry;
  hp: number;
  maxHp: number;
}

export interface Battle {
  player: Combatant[];
  leader: Combatant[];
  playerActive: number;
  leaderActive: number;
  status: 'ongoing' | 'won' | 'lost';
}

export type Side = 'player' | 'leader';

export type BattleEvent =
  | { kind: 'attack'; by: Side; attacker: string; move: string; damage: number; multiplier: number }
  | { kind: 'fainted'; side: Side; name: string }
  | { kind: 'sent-out'; side: Side; name: string }
  | { kind: 'won' }
  | { kind: 'lost' };

const STRONG_MOVES: Record<string, string> = {
  normal: 'Body Slam',
  fire: 'Flamethrower',
  water: 'Surf',
  electric: 'Thunderbolt',
  grass: 'Energy Ball',
  ice: 'Ice Beam',
  fighting: 'Brick Break',
  poison: 'Sludge Bomb',
  ground: 'Earthquake',
  flying: 'Air Slash',
  psychic: 'Psychic',
  bug: 'X-Scissor',
  rock: 'Rock Slide',
  ghost: 'Shadow Ball',
  dragon: 'Dragon Pulse',
  dark: 'Crunch',
  steel: 'Iron Head',
  fairy: 'Moonblast',
};

export const movesFor = (pokemon: PokemonEntry): Move[] => {
  const type = pokemon.types[0] ?? 'normal';
  return [
    { name: 'Tackle', type: 'normal', power: 40, risk: 'safe' },
    { name: STRONG_MOVES[type] ?? 'Body Slam', type, power: 90, risk: 'strong' },
  ];
};

export const effectiveness = (chart: TypeChart, moveType: string, defenderTypes: string[]): number =>
  defenderTypes.reduce((multiplier, type) => multiplier * (chart[moveType]?.[type] ?? 1), 1);

export const battleHp = (pokemon: PokemonEntry): number => 2 * pokemon.stats.hp + 60;

export const damage = (attacker: PokemonEntry, defender: PokemonEntry, power: number, multiplier: number): number => {
  if (multiplier === 0) return 0;
  const attack = Math.max(attacker.stats.attack, attacker.stats.specialAttack);
  const defense = (defender.stats.defense + defender.stats.specialDefense) / 2;
  return Math.floor(((power * attack) / defense) * multiplier * 0.4) + 3;
};

const combatant = (entry: PokemonEntry): Combatant => ({ entry, hp: battleHp(entry), maxHp: battleHp(entry) });

export const startBattle = (playerTeam: PokemonEntry[], leaderTeam: PokemonEntry[]): Battle => ({
  player: playerTeam.map(combatant),
  leader: leaderTeam.map(combatant),
  playerActive: 0,
  leaderActive: 0,
  status: 'ongoing',
});

export const playTurn = (battle: Battle, playerMove: Move, correct: boolean, chart: TypeChart): { battle: Battle; events: BattleEvent[] } => {
  if (battle.status !== 'ongoing') throw new Error('The battle is over');
  const by: Side = correct ? 'player' : 'leader';
  const target: Side = correct ? 'leader' : 'player';
  const attacking = correct ? battle.player[battle.playerActive] : battle.leader[battle.leaderActive];
  const activeKey = target === 'leader' ? 'leaderActive' : 'playerActive';
  const defending = battle[target][battle[activeKey]];
  if (!attacking || !defending) throw new Error('A side has no active Pokémon');

  const move = correct ? playerMove : (movesFor(attacking.entry)[1] as Move);
  const multiplier = effectiveness(chart, move.type, defending.entry.types);
  const dealt = damage(attacking.entry, defending.entry, move.power, multiplier);
  const hit = { ...defending, hp: Math.max(0, defending.hp - dealt) };
  const team = battle[target].map((member, index) => (index === battle[activeKey] ? hit : member));
  const events: BattleEvent[] = [{ kind: 'attack', by, attacker: attacking.entry.name, move: move.name, damage: dealt, multiplier }];
  let next: Battle = { ...battle, [target]: team };

  if (hit.hp === 0) {
    events.push({ kind: 'fainted', side: target, name: hit.entry.name });
    const replacement = team.findIndex(member => member.hp > 0);
    if (replacement === -1) {
      next = { ...next, status: target === 'leader' ? 'won' : 'lost' };
      events.push({ kind: target === 'leader' ? 'won' : 'lost' });
    } else {
      next = { ...next, [activeKey]: replacement };
      events.push({ kind: 'sent-out', side: target, name: (team[replacement] as Combatant).entry.name });
    }
  }
  return { battle: next, events };
};
