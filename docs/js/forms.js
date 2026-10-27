// Заявки. В демо LEAD_ENDPOINT = null: заявка не уходит, в консоль пишется то,
// что ушло бы на сервер. Для боевого режима укажите адрес API или вебхука CRM.
const LEAD_ENDPOINT = null;

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

function getUtm() {
  const params = new URLSearchParams(window.location.search);
  return UTM_KEYS.reduce((acc, key) => {
    if (params.has(key)) acc[key] = params.get(key);
    return acc;
  }, {});
}

export function phoneDigits(value) {
  return value.replace(/\D/g, '');
}

function formatPhone(value) {
  let digits = phoneDigits(value);
  if (digits.startsWith('8')) digits = `7${digits.slice(1)}`;
  if (!digits.startsWith('7')) digits = `7${digits}`;
  const d = digits.slice(1, 11);

  let result = '+7';
  if (d.length > 0) result += ` (${d.slice(0, 3)}`;
  if (d.length >= 3) result += ')';
  if (d.length > 3) result += ` ${d.slice(3, 6)}`;
  if (d.length > 6) result += `-${d.slice(6, 8)}`;
  if (d.length > 8) result += `-${d.slice(8, 10)}`;
  return result;
}

function initPhoneMask(input) {
  input.addEventListener('focus', () => {
    if (!input.value) input.value = '+7 (';
  });
  input.addEventListener('input', (e) => {
    const isDelete = e.inputType && e.inputType.startsWith('delete');
    if (phoneDigits(input.value).length <= 1 && isDelete) {
      input.value = '';
      return;
    }
    input.value = formatPhone(input.value);
  });
  input.addEventListener('blur', () => {
    if (phoneDigits(input.value).length <= 1) input.value = '';
  });
}

function getFieldError(input) {
  if (input.type === 'checkbox') {
    return input.required && !input.checked ? 'Нужно согласие на обработку данных' : '';
  }
  const value = input.value.trim();
  if (input.hasAttribute('data-phone')) {
    const length = phoneDigits(value).length;
    if (length <= 1) return 'Укажите телефон';
    return length === 11 ? '' : 'Номер указан не полностью';
  }
  if (input.required && !value) return input.name === 'name' ? 'Укажите имя' : 'Заполните поле';
  if (input.minLength > 0 && value.length < input.minLength) return 'Слишком коротко';
  return '';
}

function setFieldError(input, message) {
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  const error = input.closest('[data-field]')?.querySelector('[data-error]');
  if (error) error.textContent = message;
}

// Проверяет обязательные поля внутри контейнера, фокус на первое ошибочное
export function validateFields(container) {
  const inputs = [...container.querySelectorAll('[required]')].filter((input) => !input.closest('[hidden]'));
  let firstInvalid = null;
  inputs.forEach((input) => {
    const message = getFieldError(input);
    setFieldError(input, message);
    if (message && !firstInvalid) firstInvalid = input;
  });
  if (firstInvalid) firstInvalid.focus();
  return !firstInvalid;
}

// Ошибка поля пропадает, как только его поправили
export function watchFieldErrors(container) {
  container.addEventListener('input', (e) => {
    if (e.target.getAttribute('aria-invalid') === 'true') setFieldError(e.target, getFieldError(e.target));
  });
  container.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox' && e.target.required) setFieldError(e.target, getFieldError(e.target));
  });
}

export function buildLead(form, data) {
  const lead = { ...data };
  if (lead.phone) lead.phone = `+${phoneDigits(lead.phone)}`;
  return {
    ...lead,
    form,
    page: window.location.href,
    utm: getUtm(),
    createdAt: new Date().toISOString(),
  };
}

export async function sendLead(lead) {
  if (!LEAD_ENDPOINT) {
    console.info('[демо] Заявка не отправлена, LEAD_ENDPOINT не задан:', lead);
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { ok: true, demo: true };
  }
  const response = await fetch(LEAD_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lead),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

// Кнопка на время отправки: блокируем и меняем подпись
export async function withPending(button, task) {
  const label = button.innerHTML;
  button.disabled = true;
  button.textContent = 'Отправляем…';
  try {
    return await task();
  } finally {
    button.disabled = false;
    button.innerHTML = label;
  }
}

function toggleSuccess(form, isSuccess) {
  const success = form.querySelector('[data-form-success]');
  [...form.children].forEach((child) => {
    child.hidden = child === success ? !isSuccess : isSuccess;
  });
  if (isSuccess) {
    success.setAttribute('tabindex', '-1');
    success.focus();
  }
}

const CALLBACK_PRESETS = {
  default: {
    title: 'Не нашли удобное время?',
    text: 'Оставьте номер, администратор подберёт окно и перезвонит',
    topic: 'Подбор времени',
  },
  gift: {
    title: 'Сертификат в подарок',
    text: 'Оставьте номер, поможем выбрать сумму или услугу и оформим сертификат',
    topic: 'Подарочный сертификат',
  },
};

function applyCallbackPreset(form, key) {
  const preset = CALLBACK_PRESETS[key];
  form.querySelector('[data-callback-title]').textContent = preset.title;
  form.querySelector('[data-callback-text]').textContent = preset.text;
  form.querySelector('[data-callback-topic]').value = preset.topic;
}

export function initLeadForms() {
  document.querySelectorAll('[data-phone]').forEach(initPhoneMask);

  document.querySelectorAll('[data-lead-form]').forEach((form) => {
    watchFieldErrors(form);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateFields(form)) return;

      const data = Object.fromEntries(new FormData(form));
      delete data.consent;
      try {
        await withPending(form.querySelector('[type="submit"]'), () => sendLead(buildLead(form.dataset.leadForm, data)));
        toggleSuccess(form, true);
      } catch (error) {
        console.error(error);
        alert('Не удалось отправить заявку. Позвоните нам: 8 800 000-00-00');
      }
    });

    form.querySelector('[data-form-again]')?.addEventListener('click', () => {
      form.reset();
      form.querySelectorAll('[aria-invalid="true"]').forEach((input) => setFieldError(input, ''));
      applyCallbackPreset(form, 'default');
      toggleSuccess(form, false);
      form.querySelector('input:not([type="hidden"])').focus();
    });
  });

  const callback = document.querySelector('[data-lead-form="callback"]');
  document.querySelectorAll('[data-gift-link]').forEach((link) => {
    link.addEventListener('click', () => applyCallbackPreset(callback, 'gift'));
  });
}
