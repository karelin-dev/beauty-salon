// Расписание. В демо занятость мастеров генерируется детерминированно
// по хешу «мастер + дата + время», поэтому при каждом заходе картина одна и та же.
// В реальном проекте getSlots заменяется запросом к API записи.
import { formatTime, startOfDay } from './format.js';

export const OPEN = 10 * 60;
export const CLOSE = 22 * 60;
export const STEP = 90;
const BUSY_PERCENT = 35;
// На сегодня можно записаться не раньше чем через полчаса
const LEAD_MINUTES = 30;

const booked = new Set();

export function toISODate(date) {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

export function fromISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getDays(count = 7, today = new Date()) {
  const start = startOfDay(today);
  return Array.from({ length: count }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

// FNV-1a: быстрый стабильный хеш строки
function hash(value) {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function isMasterBusy(masterId, iso, time) {
  const key = `${masterId}|${iso}|${time}`;
  return booked.has(key) || hash(key) % 100 < BUSY_PERCENT;
}

export function markBooked(masterId, iso, time) {
  booked.add(`${masterId}|${iso}|${time}`);
}

// Слоты дня для списка мастеров. Слот свободен, если свободен хотя бы один мастер,
// free хранит, кто именно свободен. Слоты, после которых услуга не успеет
// закончиться до закрытия, и прошедшее время сегодня не показываем.
export function getSlots({ masterIds, iso, minutes, now = new Date() }) {
  const isToday = iso === toISODate(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const slots = [];
  for (let start = OPEN; start + minutes <= CLOSE; start += STEP) {
    if (isToday && start < nowMinutes + LEAD_MINUTES) continue;
    const time = formatTime(start);
    const free = masterIds.filter((id) => !isMasterBusy(id, iso, time));
    slots.push({ time, free, busy: free.length === 0 });
  }
  return slots;
}
