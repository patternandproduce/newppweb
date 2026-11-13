/* Public application settings. Secrets are kept in Vercel server environment variables. */


export const API_BASE = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);
export const SHEET_URL = "";
export const CONTACT = {
  email: "root@patternandproduce.com",
  phone: "+234 903 990 2994",
  phoneHref: "tel:+2349039902994",
  whatsapp: "https://wa.me/2349039902994",
  instagram: "https://www.instagram.com/patternandproduce/",
  address: "312 Murtala Mohammed Way, Alagomeji, Yaba, Lagos.",
  hours: "Monday to Friday, 9:00am to 5:00pm",
};
