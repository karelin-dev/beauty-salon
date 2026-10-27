// Прайс с вкладками по категориям. Клавиатура как у ARIA tabs:
// стрелки влево и вправо, Home, End.
import { CATEGORIES, getServicesByCategory } from './data.js';
import { formatDuration, formatPrice } from './format.js';

export function initPrices({ onBook }) {
  const tabs = document.querySelector('[data-price-tabs]');
  const panel = document.querySelector('[data-price-panel]');
  const list = document.querySelector('[data-price-list]');
  const book = document.querySelector('[data-price-book]');
  if (!tabs || !panel || !list) return null;

  let current = CATEGORIES[0].id;

  tabs.innerHTML = CATEGORIES.map((cat) => `
    <button class="chip chip-soft" type="button" role="tab" id="price-tab-${cat.id}" aria-controls="price-panel" aria-selected="false" tabindex="-1" data-tab="${cat.id}">${cat.name}</button>`).join('');
  const buttons = [...tabs.querySelectorAll('[role="tab"]')];

  function select(cat, focus = false) {
    current = cat;
    buttons.forEach((button) => {
      const isActive = button.dataset.tab === cat;
      button.setAttribute('aria-selected', String(isActive));
      button.tabIndex = isActive ? 0 : -1;
      if (isActive && focus) button.focus();
    });
    panel.setAttribute('aria-labelledby', `price-tab-${cat}`);
    // На телефоне длительность под названием, на широком экране в строке с пунктиром
    list.innerHTML = getServicesByCategory(cat).map((service) => {
      const duration = formatDuration(service.minutes);
      return `
      <li class="flex items-baseline gap-3 border-b border-line py-4 last:border-b-0 sm:py-[18px]">
        <span class="grow sm:grow-0">
          <span class="font-display text-lg sm:text-[19px]">${service.name}</span>
          <span class="mt-0.5 block text-sm text-muted sm:hidden">${duration}</span>
        </span>
        <span class="hidden min-w-3 grow border-b-2 border-dotted border-[#E2CDD5] sm:block" aria-hidden="true"></span>
        <span class="hidden text-sm whitespace-nowrap text-muted sm:inline">${duration}</span>
        <span class="text-right font-display text-lg whitespace-nowrap sm:min-w-[110px] sm:text-[19px]">${formatPrice(service)}</span>
      </li>`;
    }).join('');
  }

  tabs.addEventListener('click', (e) => {
    const button = e.target.closest('[role="tab"]');
    if (button) select(button.dataset.tab);
  });

  tabs.addEventListener('keydown', (e) => {
    const index = buttons.findIndex((button) => button.dataset.tab === current);
    const moves = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: buttons.length - 1,
    };
    if (!(e.key in moves)) return;
    e.preventDefault();
    const next = (moves[e.key] + buttons.length) % buttons.length;
    select(buttons[next].dataset.tab, true);
  });

  book?.addEventListener('click', () => onBook(current));

  document.querySelectorAll('a[data-price-tab]').forEach((link) => {
    link.addEventListener('click', () => select(link.dataset.priceTab));
  });

  select(current);
  return { select };
}
