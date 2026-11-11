const P = {
  arrow: 'M5 12h14M13 6l6 6-6 6', check: 'M5 12.5l4.5 4.5L19 7.5', mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z',
  pin: 'M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2', chat: 'M4 5h16v11H9l-5 4z',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4', plus: 'M12 5v14M5 12h14',
  trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13', edit: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
  up: 'M6 15l6-6 6 6', down: 'M6 9l6 6 6-6', download: 'M12 4v11M7 11l5 5 5-5M5 20h14', upload: 'M12 16V5M7 9l5-5 5 5M5 20h14',
  close: 'M6 6l12 12M18 6L6 18', chevL: 'M15 6l-6 6 6 6', chevR: 'M9 6l6 6-6 6', panel: 'M4 5h16v14H4zM9 5v14',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', lock: 'M6 11h12v9H6zM8 11V8a4 4 0 118 0v3',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
  needle: 'M20 4l-9 9M11 13l-2 6-4 2 2-4 6-2M17 7l-3-3',
  scissors: 'M6 9a3 3 0 100-6 3 3 0 000 6zM6 21a3 3 0 100-6 3 3 0 000 6zM8.5 7.5L20 18M8.5 16.5L20 6',
  ruler: 'M3 15L15 3l6 6L9 21zM7 11l2 2M10 8l2 2M13 5l2 2',
  shirt: 'M8 4l-5 3 2.5 4L8 10v10h8V10l2.5 1L21 7l-5-3a4 4 0 01-8 0z', layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
  book: 'M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 19V5', star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.3 1 2.1h5c0-.8.4-1.6 1-2.1A6 6 0 0012 3z',
};
export const PHASE_ICONS = ['book', 'scissors', 'layers', 'star', 'needle', 'ruler', 'shirt', 'bulb'];

export default function Icon({ name, size = 20, className = '', fill = false }) {
  if (name === 'play') return (<svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>);
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name] || ''} />
    </svg>
  );
}
