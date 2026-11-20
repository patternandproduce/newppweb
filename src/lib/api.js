import { rpc } from './adminApi.js';

export const FAIL = 'Sorry, we could not send your message. Please try again, or message us on WhatsApp: +234 903 990 2994.';

function formKind(kind, data) {
  if (kind === 'checklist') return 'checklist';
  if (kind === 'enquiries') {
    if (data.type === 'biz') return 'consultations';
    if (data.type === 'quote') return 'quotes';
    return 'training';
  }
  if (kind === 'contacts') return 'contacts';
  return 'contacts';
}

export async function submitForm(kind, data) {
  const target = formKind(kind, data);
  return rpc('lead.create', { kind: target, data });
}

export const fieldsOf = (form) => {
  const fd = new FormData(form);
  const g = (k) => (fd.get(k) || '').toString().trim();
  return { g, honey: !!g('website_url') };
};
