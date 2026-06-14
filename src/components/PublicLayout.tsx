import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { motion, AnimatePresence } from 'framer-motion';

export const PublicLayout: React.FC = () => {
  const { pathname } = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Force public landing pages to premium light theme statically
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  return (
    <div className="public-layout-wrapper">
      <PublicHeader />
      <main className="public-main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }}
            style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <PublicFooter />

      <style>{`
        .public-layout-wrapper {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          width: 100vw;
          overflow-x: hidden;
          background-color: var(--bg-secondary);
          color: var(--text-primary);
          transition: background-color var(--transition-normal);
        }

        .public-main-content {
          flex-grow: 1;
          padding-top: 80px; /* Offset for fixed header */
          width: 100%;
        }

        @media (max-width: 992px) {
          .public-main-content {
            padding-top: 80px;
          }
        }
      `}</style>
    </div>
  );
};
