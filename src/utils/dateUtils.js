export const MIN_OPERATIONAL_DATE = '1900-01-01';
export const MAX_OPERATIONAL_DATE = '2100-12-31';

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateValue(value, noonForDateOnly = false) {
  if (!value) return null;

  const text = String(value);
  const source = noonForDateOnly && dateOnlyPattern.test(text) ? `${text}T12:00:00` : text;
  const date = new Date(source);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isOperationalDate(value) {
  return dateOnlyPattern.test(String(value ?? ''))
    && value >= MIN_OPERATIONAL_DATE
    && value <= MAX_OPERATIONAL_DATE
    && Boolean(parseDateValue(value, true));
}

export function formatDatePtBr(value, emptyFallback = 'Sem data', invalidFallback = 'Data invalida') {
  if (!value) return emptyFallback;
  if (typeof value === 'string' && /^\d+-\d{2}-\d{2}$/.test(value) && !isOperationalDate(value)) {
    return invalidFallback;
  }
  const date = parseDateValue(value, true);
  if (!date) return invalidFallback;

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatDateTimePtBr(value, fallback = '-') {
  const date = parseDateValue(value);
  if (!date) return fallback;

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
