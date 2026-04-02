import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EventType, MeetWeSession, TransportMode } from '../types';
import { EVENT_TYPE_PRIORITY } from '../types';

/**
 * 本地会话持久化（MVP）
 */

const STORAGE_KEY = '@meetwe_last_session_v1';

const VALID_EVENT = new Set<EventType>([...EVENT_TYPE_PRIORITY]);
const VALID_TRANSPORT = new Set<TransportMode>(['car', 'bus', 'walk', 'ebike', 'bike']);

function migrateEventType(raw: unknown): EventType {
  if (raw === 'dining') return 'food';
  if (typeof raw === 'string' && VALID_EVENT.has(raw as EventType)) return raw as EventType;
  return 'food';
}

function migrateTransport(raw: unknown): TransportMode {
  if (typeof raw === 'string' && VALID_TRANSPORT.has(raw as TransportMode)) return raw as TransportMode;
  return 'bus';
}

function migrateLatLng(raw: unknown): { lat: number; lng: number } | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const latRaw = o.lat ?? o.latitude;
  const lngRaw = o.lng ?? o.longitude ?? o.lon;
  const lat = typeof latRaw === 'number' ? latRaw : Number(latRaw);
  const lng = typeof lngRaw === 'number' ? lngRaw : Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  return { lat, lng };
}

function normalizeSession(data: unknown): MeetWeSession | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  if (!Array.isArray(o.participants)) return null;
  const participants = o.participants
    .filter((p): p is Record<string, unknown> => !!p && typeof p === 'object')
    .map((p) => ({
      id: String(p.id ?? ''),
      displayName: String(p.displayName ?? ''),
      addressText: String(p.addressText ?? ''),
      transport: migrateTransport(p.transport),
      selectedCoordinate: migrateLatLng(p.selectedCoordinate),
      selectedCityCode:
        typeof p.selectedCityCode === 'string' && p.selectedCityCode.trim().length > 0
          ? p.selectedCityCode
          : undefined,
      selectedAdCode:
        typeof p.selectedAdCode === 'string' && p.selectedAdCode.trim().length > 0
          ? p.selectedAdCode
          : undefined,
      collapsed: typeof p.collapsed === 'boolean' ? p.collapsed : undefined,
    }))
    .filter((p) => p.id.length > 0);

  if (participants.length < 2) return null;

  return {
    eventType: migrateEventType(o.eventType),
    participants,
  };
}

export async function saveLastSession(session: MeetWeSession): Promise<void> {
  const payload = JSON.stringify(session);
  await AsyncStorage.setItem(STORAGE_KEY, payload);
}

export async function loadLastSession(): Promise<MeetWeSession | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return normalizeSession(parsed);
  } catch {
    return null;
  }
}

export async function clearLastSession(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
