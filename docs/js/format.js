const NBSP = ' ';

const WEEKDAYS_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
const MONTHS_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

export function formatPrice(service) {
  const amount = String(service.price).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return `${service.from ? `от${NBSP}` : ''}${amount}${NBSP}₽`;
}

export function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}${NBSP}мин`;
  return rest ? `${hours}${NBSP}ч ${rest}${NBSP}мин` : `${hours}${NBSP}ч`;
}

export function formatTime(totalMinutes) {
  const h = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const m = String(totalMinutes % 60).padStart(2, '0');
  return `${h}:${m}`;
}

export function weekdayShort(date) {
  return WEEKDAYS_SHORT[date.getDay()];
}

// «27 октября»
export function dayMonth(date) {
  return `${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]}`;
}

// «Сегодня, 27 октября» / «Завтра, 28 октября» / «Четверг, 29 октября»
export function formatDay(date, today = new Date()) {
  const diff = Math.round((startOfDay(date) - startOfDay(today)) / 86400000);
  let name = WEEKDAYS[date.getDay()];
  if (diff === 0) name = 'сегодня';
  if (diff === 1) name = 'завтра';
  return `${name[0].toUpperCase()}${name.slice(1)}, ${dayMonth(date)}`;
}

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}
