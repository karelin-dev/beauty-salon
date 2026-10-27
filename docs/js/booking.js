// Онлайн-запись: услуга → мастер → дата и время, справа «билет» с итогом.
// Состояние в одном объекте, после каждого выбора перерисовываются только
// зависящие от него шаги, чтобы не терять фокус в группе радиокнопок.
import {
  ANY_MASTER, CATEGORIES, getMaster, getMastersForService, getService, getServicesByCategory,
} from './data.js';
import { escapeHtml, formatDay, formatDuration, formatPrice, weekdayShort } from './format.js';
import { fromISODate, getDays, getSlots, markBooked, toISODate } from './schedule.js';
import { buildLead, sendLead, validateFields, watchFieldErrors, withPending } from './forms.js';

const DEFAULTS = { cat: 'hair', serviceId: 'color-tone', masterId: 'anna' };

const ANY = { id: ANY_MASTER, name: 'Любой мастер', note: 'ближайшее время' };

// Порядок перерисовки: изменение шага тянет за собой все следующие
const RENDER_CHAIN = ['cat', 'service', 'master', 'date', 'time'];

function avatar(master, size) {
  if (master.photo) {
    return `<img class="${size} shrink-0 rounded-full object-cover" src="${master.photo}" width="600" height="700" alt="">`;
  }
  if (master.initials) {
    return `<span class="grid ${size} shrink-0 place-items-center rounded-full text-[15px] font-medium" style="background:${master.tint}">${master.initials}</span>`;
  }
  return `<span class="grid ${size} shrink-0 place-items-center rounded-full bg-[#F3E5D6] text-muted"><svg class="icon size-[22px]" aria-hidden="true"><use href="#i-users"/></svg></span>`;
}

export function initBooking() {
  const form = document.querySelector('[data-booking]');
  if (!form) return null;

  const $ = (name) => form.querySelector(`[data-${name}]`);
  const el = {
    cats: $('booking-cats'),
    services: $('booking-services'),
    masters: $('booking-masters'),
    dates: $('booking-dates'),
    times: $('booking-times'),
    timesEmpty: $('booking-times-empty'),
    error: $('booking-error'),
    status: $('ticket-status'),
    avatar: $('ticket-avatar'),
    master: $('ticket-master'),
    masterNote: $('ticket-master-note'),
    icon: $('ticket-icon'),
    service: $('ticket-service'),
    when: $('ticket-when'),
    price: $('ticket-price'),
    ticketForm: $('ticket-form'),
    success: $('booking-success'),
    successText: $('booking-success-text'),
    again: $('booking-again'),
  };

  const days = getDays(7);
  const state = { ...DEFAULTS, iso: null, time: null };

  const currentService = () => getService(state.serviceId);
  const candidates = () => getMastersForService(currentService());
  const masterIds = () => (state.masterId === ANY_MASTER ? candidates().map((m) => m.id) : [state.masterId]);
  const slotsFor = (iso) => getSlots({ masterIds: masterIds(), iso, minutes: currentService().minutes });
  const hasFree = (iso) => slotsFor(iso).some((slot) => !slot.busy);

  // Приводит состояние к допустимому после любого изменения
  function normalize() {
    const service = getService(state.serviceId);
    if (!service || service.cat !== state.cat) state.serviceId = getServicesByCategory(state.cat)[0].id;

    const list = candidates();
    if (state.masterId === ANY_MASTER && list.length === 1) state.masterId = list[0].id;
    if (state.masterId !== ANY_MASTER && !list.some((m) => m.id === state.masterId)) {
      state.masterId = list.length > 1 ? ANY_MASTER : list[0].id;
    }

    if (!state.iso) state.iso = toISODate(days.find((day) => hasFree(toISODate(day))) ?? days[0]);

    if (state.time) {
      const slot = slotsFor(state.iso).find((s) => s.time === state.time);
      if (!slot || slot.busy) state.time = null;
    }
  }

  function renderCats() {
    el.cats.innerHTML = CATEGORIES.map((cat) => `
      <button class="chip" type="button" aria-pressed="${cat.id === state.cat}" data-cat="${cat.id}">${cat.name}</button>`).join('');
  }

  function renderServices() {
    el.services.innerHTML = getServicesByCategory(state.cat).map((service) => {
      const duration = formatDuration(service.minutes);
      return `
      <label class="choice flex min-h-16 items-center gap-3 rounded-[18px] px-4 py-3 sm:gap-3.5 sm:px-5">
        <input class="size-5 shrink-0 cursor-pointer accent-berry" type="radio" name="service" value="${service.id}"${service.id === state.serviceId ? ' checked' : ''}>
        <span class="grow leading-snug">
          <span class="font-medium">${service.name}</span>${service.hit ? ' <span class="ml-1 inline-block rounded-md bg-blush px-2 py-[3px] text-xs font-medium text-berry">хит</span>' : ''}
          <span class="mt-0.5 block text-sm text-muted sm:hidden">${duration}</span>
        </span>
        <span class="hidden text-sm whitespace-nowrap text-muted sm:inline">${duration}</span>
        <span class="text-right font-display text-lg whitespace-nowrap sm:min-w-24">${formatPrice(service)}</span>
      </label>`;
    }).join('');
  }

  function renderMasters() {
    const list = candidates();
    const options = list.length > 1 ? [...list, ANY] : list;
    el.masters.innerHTML = options.map((master) => `
      <label class="choice ring-focus flex items-center gap-3.5 rounded-[18px] px-4 py-3.5">
        <input class="sr-only" type="radio" name="master" value="${master.id}"${master.id === state.masterId ? ' checked' : ''}>
        ${avatar(master, 'size-12')}
        <span class="leading-[1.35]">
          <span class="block font-display text-[19px]">${master.name}</span>
          <span class="block text-[13px] text-muted">${master.note ?? `${master.role} · ★ ${master.rating}`}</span>
        </span>
      </label>`).join('');
  }

  function renderDates() {
    el.dates.innerHTML = days.map((day) => {
      const iso = toISODate(day);
      return `
      <label class="ring-focus group flex cursor-pointer flex-col items-center rounded-2xl bg-white px-1 py-3 transition-colors hover:bg-rose has-checked:bg-berry has-checked:text-white has-checked:hover:bg-berry">
        <input class="sr-only" type="radio" name="date" value="${iso}"${iso === state.iso ? ' checked' : ''}>
        <span class="text-[13px] text-muted group-has-checked:text-[#E9C9D5]" aria-hidden="true">${weekdayShort(day)}</span>
        <span class="font-display text-[22px] leading-tight" aria-hidden="true">${day.getDate()}</span>
        <span class="sr-only">${formatDay(day)}</span>
      </label>`;
    }).join('');
  }

  function renderTimes() {
    const slots = slotsFor(state.iso);
    el.times.innerHTML = slots.map((slot) => `
      <label class="ring-focus grid h-12 cursor-pointer place-items-center rounded-[14px] bg-white text-[15px] font-medium transition-colors hover:bg-rose has-checked:bg-peony has-checked:hover:bg-peony has-disabled:cursor-not-allowed has-disabled:bg-transparent has-disabled:hover:bg-transparent has-disabled:font-normal has-disabled:text-muted has-disabled:line-through">
        <input class="sr-only" type="radio" name="time" value="${slot.time}"${slot.busy ? ' disabled' : ''}${slot.time === state.time ? ' checked' : ''}>
        ${slot.time}${slot.busy ? '<span class="sr-only">, занято</span>' : ''}
      </label>`).join('');

    const freeCount = slots.filter((slot) => !slot.busy).length;
    el.times.hidden = !slots.length;
    el.timesEmpty.hidden = freeCount > 0;
    if (!slots.length) el.timesEmpty.textContent = 'На этот день запись уже закрыта, выберите другую дату.';
    else if (!freeCount) el.timesEmpty.textContent = 'На этот день всё занято. Выберите другую дату или другого мастера.';
  }

  function renderTicket() {
    const service = currentService();
    const master = state.masterId === ANY_MASTER ? ANY : getMaster(state.masterId);
    const cat = CATEGORIES.find((c) => c.id === service.cat);

    el.avatar.innerHTML = avatar(master, 'size-14');
    el.master.textContent = master.name;
    el.masterNote.textContent = master.role ? `${master.role} · ★ ${master.rating}` : 'подберём свободного мастера';
    el.icon.setAttribute('href', `#${cat.icon}`);
    el.service.textContent = `${service.name}, ${formatDuration(service.minutes)}`;
    const day = formatDay(fromISODate(state.iso));
    el.when.textContent = state.time ? `${day}, ${state.time}` : `${day}, время не выбрано`;
    el.price.textContent = formatPrice(service);
    el.status.textContent = state.time ? 'почти готово' : 'выберите время';
  }

  const renderers = {
    cat: [renderCats, renderServices],
    service: [renderMasters],
    master: [renderDates],
    date: [renderTimes],
    time: [renderTicket],
  };

  function update(from = 'cat') {
    normalize();
    RENDER_CHAIN.slice(RENDER_CHAIN.indexOf(from)).forEach((step) => renderers[step].forEach((render) => render()));
  }

  function showForm() {
    el.success.hidden = true;
    el.ticketForm.hidden = false;
  }

  // Внешний выбор: из карточек мастеров, прайса, свободных окон первого экрана
  function select({ cat, serviceId, masterId, iso, time } = {}) {
    let nextCat = cat;
    let nextService = serviceId;
    if (masterId && masterId !== ANY_MASTER && !cat && !serviceId) {
      const canDoCurrent = candidates().some((m) => m.id === masterId);
      if (!canDoCurrent) {
        nextCat = getMaster(masterId).cats[0];
        nextService = getServicesByCategory(nextCat)
          .find((service) => getMastersForService(service).some((m) => m.id === masterId)).id;
      }
    }
    if (nextService) {
      state.serviceId = nextService;
      state.cat = getService(nextService).cat;
    } else if (nextCat && nextCat !== state.cat) {
      state.cat = nextCat;
      state.serviceId = null;
    }
    if (masterId) state.masterId = masterId;
    if (iso) state.iso = iso;
    state.time = time ?? null;
    el.error.textContent = '';
    showForm();
    update('cat');
  }

  el.cats.addEventListener('click', (e) => {
    const button = e.target.closest('[data-cat]');
    if (!button || button.dataset.cat === state.cat) return;
    state.cat = button.dataset.cat;
    state.serviceId = null;
    update('cat');
  });

  form.addEventListener('change', (e) => {
    const { name, value } = e.target;
    if (name === 'service') {
      state.serviceId = value;
      update('service');
    } else if (name === 'master') {
      state.masterId = value;
      update('master');
    } else if (name === 'date') {
      state.iso = value;
      update('date');
    } else if (name === 'time') {
      state.time = value;
      el.error.textContent = '';
      update('time');
    }
  });

  watchFieldErrors(el.ticketForm);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.time) {
      el.error.textContent = 'Выберите удобное время в шаге 3';
      el.times.querySelector('input:not(:disabled)')?.focus();
      return;
    }
    el.error.textContent = '';
    if (!validateFields(el.ticketForm)) return;

    const slot = slotsFor(state.iso).find((s) => s.time === state.time);
    if (!slot || slot.busy) {
      update('date');
      el.error.textContent = 'Это время только что заняли, выберите другое';
      return;
    }

    const service = currentService();
    const master = getMaster(state.masterId === ANY_MASTER ? slot.free[0] : state.masterId);
    const name = form.elements.name.value.trim();
    const phone = form.elements.phone.value;
    const lead = buildLead('booking', {
      service: service.name,
      price: service.price,
      master: master.name,
      date: state.iso,
      time: state.time,
      name,
      phone,
    });

    try {
      await withPending(form.querySelector('[type="submit"]'), () => sendLead(lead));
    } catch (error) {
      console.error(error);
      el.error.textContent = 'Не удалось отправить запись. Позвоните нам: 8 800 000-00-00';
      return;
    }

    markBooked(master.id, state.iso, state.time);
    el.successText.innerHTML = [
      `${escapeHtml(name)}, ждём вас: ${formatDay(fromISODate(state.iso)).toLowerCase()}, ${state.time}.`,
      `Мастер: ${master.name}`,
      `Пришлём SMS с подтверждением на ${escapeHtml(phone)}.`,
    ].join('<br>');
    el.status.textContent = 'запись создана';
    el.ticketForm.hidden = true;
    el.success.hidden = false;
    el.success.focus();
  });

  el.again.addEventListener('click', () => {
    state.time = null;
    showForm();
    update('date');
    el.times.querySelector('input:not(:disabled)')?.focus();
  });

  update('cat');
  return { select };
}
