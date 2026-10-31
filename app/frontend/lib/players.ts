import type { Level, PlayerGender } from '../types/dashboard-data'

export const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced']
export const GENDERS: PlayerGender[] = ['male', 'female']

// Lowercase and without accents, so "joao" finds "João".
export function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

// Whether `name` holds what was typed into a name search.
export function nameMatches(name: string, query: string) {
  return normalize(name).includes(normalize(query.trim()))
}
