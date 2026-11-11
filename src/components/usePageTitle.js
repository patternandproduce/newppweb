import { useEffect } from 'react';
export default function usePageTitle(t) {
  useEffect(() => { document.title = t ? `${t} | Pattern & Produce` : 'Pattern & Produce'; }, [t]);
}
