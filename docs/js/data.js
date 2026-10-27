// Данные студии. Всё вымышлено, это демо для портфолио.
// В реальном проекте те же структуры приходят из API или CRM.

export const CATEGORIES = [
  { id: 'hair', name: 'Волосы', icon: 'i-hair' },
  { id: 'nails', name: 'Ногти', icon: 'i-nails' },
  { id: 'brows', name: 'Брови и ресницы', icon: 'i-brows' },
  { id: 'face', name: 'Лицо', icon: 'i-face' },
  { id: 'makeup', name: 'Макияж', icon: 'i-makeup' },
];

// minutes: длительность, from: цена «от», hit: метка «хит»,
// masters: кто делает услугу (если не задано, все мастера категории)
export const SERVICES = [
  { id: 'cut-women', cat: 'hair', name: 'Женская стрижка', minutes: 60, price: 2500, masters: ['anna', 'ekaterina'] },
  { id: 'cut-men', cat: 'hair', name: 'Мужская стрижка', minutes: 45, price: 1800, masters: ['dmitry', 'ekaterina'] },
  { id: 'color-tone', cat: 'hair', name: 'Окрашивание в один тон', minutes: 120, price: 5500, from: true, masters: ['anna', 'ekaterina'] },
  { id: 'airtouch', cat: 'hair', name: 'AirTouch, шатуш, балаяж', minutes: 240, price: 11000, from: true, hit: true, masters: ['anna'] },
  { id: 'hair-care', cat: 'hair', name: 'Уход и восстановление', minutes: 60, price: 3200, masters: ['anna', 'ekaterina'] },
  { id: 'styling', cat: 'hair', name: 'Укладка', minutes: 40, price: 1500 },

  { id: 'mani', cat: 'nails', name: 'Маникюр без покрытия', minutes: 60, price: 1200 },
  { id: 'mani-gel', cat: 'nails', name: 'Маникюр с покрытием гель-лаком', minutes: 120, price: 2400, hit: true },
  { id: 'pedi-gel', cat: 'nails', name: 'Педикюр с покрытием', minutes: 120, price: 2900 },
  { id: 'nail-ext', cat: 'nails', name: 'Наращивание ногтей', minutes: 180, price: 3800, from: true, masters: ['maria'] },

  { id: 'brow-shape', cat: 'brows', name: 'Коррекция бровей', minutes: 30, price: 900 },
  { id: 'brow-tint', cat: 'brows', name: 'Окрашивание и коррекция бровей', minutes: 45, price: 1400 },
  { id: 'brow-lam', cat: 'brows', name: 'Ламинирование бровей', minutes: 60, price: 2300 },
  { id: 'lash-lam', cat: 'brows', name: 'Ламинирование ресниц', minutes: 90, price: 2800, hit: true },
  { id: 'lash-ext', cat: 'brows', name: 'Наращивание ресниц, классика', minutes: 150, price: 3500 },

  { id: 'face-massage', cat: 'face', name: 'Массаж лица', minutes: 60, price: 2500 },
  { id: 'peel', cat: 'face', name: 'Пилинг по типу кожи', minutes: 60, price: 3000, from: true },
  { id: 'hydra', cat: 'face', name: 'Увлажняющий уход', minutes: 60, price: 3500 },
  { id: 'face-clean', cat: 'face', name: 'Комбинированная чистка лица', minutes: 90, price: 3800, hit: true },

  { id: 'makeup-day', cat: 'makeup', name: 'Дневной макияж', minutes: 60, price: 2000 },
  { id: 'makeup-evening', cat: 'makeup', name: 'Вечерний макияж', minutes: 90, price: 3200 },
  { id: 'makeup-wedding', cat: 'makeup', name: 'Свадебный образ с пробным', minutes: 180, price: 7500, from: true },
];

export const MASTERS = [
  { id: 'anna', name: 'Анна С.', role: 'топ-колорист', rating: '4,9', cats: ['hair'], photo: 'img/master-anna.webp' },
  { id: 'ekaterina', name: 'Екатерина К.', role: 'стилист, визажист', rating: '4,8', cats: ['hair', 'makeup'], initials: 'ЕК', tint: '#E3EDDF' },
  { id: 'dmitry', name: 'Дмитрий О.', role: 'мужской стилист', rating: '4,8', cats: ['hair'], photo: 'img/master-dmitry.webp' },
  { id: 'maria', name: 'Мария Л.', role: 'мастер маникюра', rating: '5,0', cats: ['nails'], photo: 'img/master-maria.webp' },
  { id: 'alina', name: 'Алина П.', role: 'мастер маникюра', rating: '4,8', cats: ['nails'], initials: 'АП', tint: '#E8E3EE' },
  { id: 'olga', name: 'Ольга Б.', role: 'бровист, лэшмейкер', rating: '4,9', cats: ['brows'], photo: 'img/master-olga.webp' },
  { id: 'svetlana', name: 'Светлана М.', role: 'косметолог', rating: '4,9', cats: ['face'], initials: 'СМ', tint: '#F3E5D6' },
];

export const ANY_MASTER = 'any';

export function getService(id) {
  return SERVICES.find((service) => service.id === id);
}

export function getMaster(id) {
  return MASTERS.find((master) => master.id === id);
}

export function getServicesByCategory(cat) {
  return SERVICES.filter((service) => service.cat === cat);
}

export function getMastersForService(service) {
  if (service.masters) return service.masters.map(getMaster);
  return MASTERS.filter((master) => master.cats.includes(service.cat));
}
