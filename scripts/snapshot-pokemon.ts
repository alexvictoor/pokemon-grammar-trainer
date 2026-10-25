import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { toSnapshotEntry, toTypeChart, type ApiPokemon, type ApiSpecies, type ApiType } from './snapshot';

const API = 'https://pokeapi.co/api/v2';
// PokéAPI's fair-use policy asks callers to limit their request rate.
const CONCURRENCY = 10;

const getJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return (await response.json()) as T;
};

const spriteDataUrl = async (url: string | null): Promise<string | undefined> => {
  if (!url) return undefined;
  const response = await fetch(url);
  if (!response.ok) return undefined;
  return `data:image/png;base64,${Buffer.from(await response.arrayBuffer()).toString('base64')}`;
};

const snapshotOf = async (id: number) => {
  const pokemon = await getJson<ApiPokemon & { sprites: { front_default: string | null } }>(`${API}/pokemon/${id}`);
  const species = await getJson<ApiSpecies>(`${API}/pokemon-species/${id}`);
  return toSnapshotEntry(pokemon, species, await spriteDataUrl(pokemon.sprites.front_default));
};

const speciesCount = (await getJson<{ count: number }>(`${API}/pokemon-species?limit=1`)).count;
const ids = Array.from({ length: speciesCount }, (_, index) => index + 1);
const entries = [];
for (let start = 0; start < ids.length; start += CONCURRENCY) {
  entries.push(...(await Promise.all(ids.slice(start, start + CONCURRENCY).map(snapshotOf))));
  process.stdout.write(`\r${entries.length} / ${ids.length}`);
}
const missingSprites = entries.filter(entry => !entry.sprite).map(entry => entry.id);

const dataDir = join(import.meta.dirname, '..', 'src', 'data');
writeFileSync(join(dataDir, 'pokemon.json'), `${JSON.stringify(entries, null, 1)}\n`);
console.log(`\n${entries.length} Pokémon written.`);

const typeList = await getJson<{ results: { name: string; url: string }[] }>(`${API}/type?limit=100`);
const types: ApiType[] = [];
for (const { url } of typeList.results) {
  const type = await getJson<ApiType & { pokemon: unknown[] }>(url);
  if (type.pokemon.length > 0) types.push(type);
}
writeFileSync(join(dataDir, 'type-chart.json'), `${JSON.stringify(toTypeChart(types), null, 1)}\n`);
console.log(`Type chart written for ${types.length} types.`);
if (missingSprites.length > 0) console.warn(`No sprite for: ${missingSprites.join(', ')}`);
