import { rpc } from './adminApi.js';

export const FAIL = 'Sorry, we could not send your message. Please try again, or message us on WhatsApp: +234 903 990 2994.';

function leadKind(kind, data) {
  if (kind === 'registrations') return 'registrations';
  if (kind === 'enquiries') return data.type === 'biz' ? 'consultations' : data.type === 'quote' ? 'quotes' : 'contacts';
  return 'contacts';
}

export async function submitForm(kind, data) {
  const list = leadKind(kind, data);
  const payload = kind === 'checklist'
    ? { first_name: 'Checklist request', email: data.email, enquiry_type: 'Tech pack checklist', interest: 'Free checklist', page: data.page, submitted_at: data.submitted_at }
    : data;
  await rpc('lead.create', { kind: list, data: payload });
  return true;
}

export const fieldsOf = (form) => {
  const fd = new FormData(form); const g = (k) => (fd.get(k) || '').toString().trim();
  return { g, honey: !!g('company') };
};
