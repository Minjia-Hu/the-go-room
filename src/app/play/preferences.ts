import type { GameStorage } from '../replay/records'
export const COACHING_KEY = 'the-go-room.coaching.v1'
export function readCoaching(storage: GameStorage): boolean {
  try {
    const raw: unknown = JSON.parse(storage.getItem(COACHING_KEY) ?? 'null')
    if (typeof raw === 'object' && raw !== null && 'version' in raw && raw.version === 1 && 'enabled' in raw && typeof raw.enabled === 'boolean') return raw.enabled
  } catch { /* 无法读取时默认陪练。 */ }
  return true
}
export function writeCoaching(storage: GameStorage, enabled: boolean): boolean {
  try { storage.setItem(COACHING_KEY, JSON.stringify({ version: 1, enabled })); return true } catch { return false }
}
