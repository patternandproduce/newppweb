/* Sample data so you can see the admin design before the backend is connected. Never shown once the backend is on. */
const NAMES = [['Ada', 'Obi'], ['Tunde', 'Bello'], ['Chioma', 'Eze'], ['Ibrahim', 'Musa'], ['Funke', 'Adeyemi'], ['Emeka', 'Okafor'], ['Zainab', 'Lawal'], ['Seun', 'Balogun']];
const LGAS = ['Yaba', 'Surulere', 'Ikeja', 'Alimosho', 'Mushin', 'Kosofe', 'Eti-Osa', 'Ikorodu'];
const day = (n) => new Date(Date.now() - n * 86400000 - n * 3600000).toISOString();

function make(kind, i) {
  const [first_name, last_name] = NAMES[i % NAMES.length];
  const email = `${first_name}.${last_name}@example.com`.toLowerCase();
  const phone = `0803${String(1000000 + i * 137531).slice(0, 7)}`;
  const base = { first_name, last_name, email, phone, page: 'https://www.example.com/contact', submitted_at: day(i * 2 + 1) };
  let data;
  if (kind === 'registrations') {
    data = { ...base, dob: `${2004 + (i % 6)}-0${1 + (i % 9)}-1${i % 9}`, age: String(14 + (i % 6)), sex: i % 3 ? 'Female' : 'Male', school: ['Yaba College', 'Girls Secondary School', 'Community High School'][i % 3], address: `${10 + i} Sample Street, Lagos`, lga: LGAS[i % LGAS.length],
      motivation: 'To become self-reliant and financially independent', can_devote: 'Yes', availability: 'Weekdays, 10am to 2pm', parents_afford: i % 2 ? 'Yes' : 'No', guardian_name: `Mr ${last_name}`, guardian_phone: '08099990000', guardian_address: `${10 + i} Sample Street, Lagos` };
  } else if (kind === 'consultations') data = { ...base, enquiry_type: 'Consultation / business enquiry', interest: ['Business consultation', 'Upgrade my business', 'Fashion manufacturing enquiry'][i % 3], message: 'I run a small fashion label and would like advice on moving to bulk production.' };
  else if (kind === 'quotes') data = { ...base, enquiry_type: 'Get quote', interest: ['B2B garment manufacturing', 'Fabric sourcing', 'Automation'][i % 3], quantity: `${100 + i * 50} pieces`, message: 'Please send a quote for shirts in linen.' };
  else data = { ...base, enquiry_type: 'Learn fashion (training)', interest: ['Pattern making', 'Sewing & garment construction', 'Not sure yet'][i % 3], message: 'How do I join the next class?' };
  return { id: `${kind}-${i + 1}`, createdAt: day(i * 2 + 1), status: i % 3 === 0 ? 'new' : i % 3 === 1 ? 'contacted' : 'new', exported: i % 4 === 0, data };
}
export const sampleLeads = () => Object.fromEntries(['registrations', 'consultations', 'quotes', 'contacts'].map((k, n) => [k, Array.from({ length: 6 + n }, (_, i) => make(k, i))]));

export function sampleAnalytics(range) {
  const n = { day: 24, week: 7, month: 30, year: 12 }[range];
  const seed = (i) => Math.round(40 + 30 * Math.sin(i * 1.3) + (i * 7) % 23 + (range === 'year' ? i * 12 : 0));
  const now = new Date();
  const label = (i) => {
    if (range === 'day') return `${String(i).padStart(2, '0')}:00`;
    if (range === 'year') return new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1).toLocaleString('en', { month: 'short' });
    const d = new Date(now.getTime() - (n - 1 - i) * 86400000);
    return range === 'week' ? d.toLocaleString('en', { weekday: 'short' }) : String(d.getDate());
  };
  const series = Array.from({ length: n }, (_, i) => ({ label: label(i), visitors: Math.max(2, seed(i) * (range === 'day' ? 0.2 : 1)) | 0 }));
  return {
    series,
    totals: { today: 64, week: 412, month: 1480, year: 16820 },
    devices: { Mobile: 62, Desktop: 31, Tablet: 7 },
    pages: { '/': 48, '/workforce-upskilling': 26, '/fashiontech': 14, '/garment-manufacturing': 9, '/contact': 3 },
    sources: { Direct: 40, 'instagram.com': 34, 'google.com': 18, 'whatsapp.com': 8 },
  };
}
