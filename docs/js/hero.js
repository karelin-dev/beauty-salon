// Карточка «Свободные окна» на первом экране: ближайшие свободные слоты
// на окрашивание у любого мастера. Клик подставляет слот в форму записи.
import { ANY_MASTER, getMastersForService, getService } from './data.js';
import { getDays, getSlots, toISODate } from './schedule.js';

const HERO_SERVICE = 'color-tone';
const LABELS = ['Свободные окна сегодня', 'Свободные окна завтра'];

export function initHero(booking) {
  const box = document.querySelector('[data-hero-slots]');
  const label = document.querySelector('[data-hero-slots-label]');
  if (!box || !booking) return;

  const service = getService(HERO_SERVICE);
  const masterIds = getMastersForService(service).map((master) => master.id);

  const found = getDays(LABELS.length).map((day, index) => {
    const iso = toISODate(day);
    const free = getSlots({ masterIds, iso, minutes: service.minutes }).filter((slot) => !slot.busy);
    return { iso, index, times: free.slice(0, 3).map((slot) => slot.time) };
  }).find((day) => day.times.length);

  if (!found) return;
  label.textContent = LABELS[found.index];
  box.innerHTML = found.times.map((time) => `
    <a class="rounded-full bg-blush px-3 py-1.5 text-sm font-medium transition-colors hover:bg-rose" href="#booking" data-time="${time}">${time}</a>`).join('');

  box.addEventListener('click', (e) => {
    const link = e.target.closest('[data-time]');
    if (!link) return;
    booking.select({ serviceId: HERO_SERVICE, masterId: ANY_MASTER, iso: found.iso, time: link.dataset.time });
  });
}
