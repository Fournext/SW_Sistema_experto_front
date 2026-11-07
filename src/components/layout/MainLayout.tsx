import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('se_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('se_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Atajo de teclado global Ctrl+B o Cmd+B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        if (window.innerWidth < 1024) {
          setSidebarOpen((prev) => !prev);
        } else {
          toggleCollapse();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isEditorVisual = location.pathname.includes('/editor');

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex">
      {/* Sidebar fijo/colapsable en desktop, drawer en móvil */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />

      {/* Contenedor principal con transición fluida de padding lateral */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-0' : 'lg:pl-64'
        }`}
      >
        <Header
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          isSidebarCollapsed={isCollapsed}
          onToggleCollapseDesktop={toggleCollapse}
        />

        <main
          className={`flex-1 p-3 md:p-5 lg:p-6 w-full mx-auto transition-all duration-300 ${
            isEditorVisual ? 'max-w-none' : 'max-w-7xl'
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
