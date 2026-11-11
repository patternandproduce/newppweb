import { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import useOpeningScreen from './components/useOpeningScreen.js';
import { trackVisit } from './lib/track.js';

/* Every page except Home is its own small file that loads only when visited (faster first load). */
const FashionTech = lazy(() => import('./pages/FashionTech.jsx'));
const Manufacturing = lazy(() => import('./pages/Manufacturing.jsx'));
const Workforce = lazy(() => import('./pages/Workforce.jsx'));
const Tutorials = lazy(() => import('./pages/Tutorials.jsx'));
const Register = lazy(() => import('./pages/FormPages.jsx').then((m) => ({ default: m.Register })));
const Contact = lazy(() => import('./pages/FormPages.jsx').then((m) => ({ default: m.Contact })));
const NotFound = lazy(() => import('./pages/FormPages.jsx').then((m) => ({ default: m.NotFound })));
const Admin = lazy(() => import('./pages/admin/Admin.jsx'));

/* Quietly fetch the other pages once the browser is idle, so clicking feels instant. */
if (typeof window !== 'undefined') {
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1500));
  idle(() => { import('./pages/Workforce.jsx'); import('./pages/FashionTech.jsx'); import('./pages/Manufacturing.jsx'); });
}

export default function App() {
  useOpeningScreen();
  const { pathname } = useLocation();
  useEffect(() => { trackVisit(pathname); }, [pathname]);
  return (
    <Suspense fallback={null}>
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="fashiontech" element={<FashionTech />} />
        <Route path="garment-manufacturing" element={<Manufacturing />} />
        <Route path="workforce-upskilling" element={<Workforce />} />
        <Route path="workforce-upskilling/tutorials" element={<Tutorials />} />
        <Route path="register" element={<Register />} />
        <Route path="contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="admin/*" element={<Admin />} />
    </Routes>
    </Suspense>
  );
}
