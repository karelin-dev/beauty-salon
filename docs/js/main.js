import { initMenu } from './menu.js';
import { initBooking } from './booking.js';
import { initPrices } from './prices.js';
import { initHero } from './hero.js';
import { initLeadForms } from './forms.js';

initMenu();
initLeadForms();

const booking = initBooking();
initPrices({ onBook: (cat) => booking?.select({ cat }) });
initHero(booking);

document.querySelectorAll('[data-book-master]').forEach((link) => {
  link.addEventListener('click', () => booking?.select({ masterId: link.dataset.bookMaster }));
});
