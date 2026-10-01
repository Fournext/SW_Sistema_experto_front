import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cpu, ArrowRight, Menu, X, BookOpen, Layers, Zap } from 'lucide-react';

export const LandingNavbar: React.FC = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-stone-200/80 py-3'
          : 'bg-transparent py-5'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-700/20 group-hover:scale-105 transition-transform duration-300">
            <Cpu className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-stone-800 tracking-tight flex items-center gap-1.5 font-sans">
              ExpertoLab
              <span className="text-[10px] font-semibold tracking-wider uppercase bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200/60">
                Docente
              </span>
            </span>
            <span className="text-[11px] text-stone-500 font-medium">Sistemas Expertos Interativos</span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600">
          <button
            onClick={() => scrollToSection('caracteristicas')}
            className="hover:text-teal-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-4 h-4 text-teal-600" />
            Características
          </button>
          <button
            onClick={() => scrollToSection('demostracion')}
            className="hover:text-teal-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-teal-600" />
            Demostración
          </button>
          <button
            onClick={() => scrollToSection('docentes')}
            className="hover:text-teal-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-teal-600" />
            Para Docentes
          </button>
        </nav>

        {/* CTA Button */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => navigate('/sistemas')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-800 hover:to-teal-700 text-white font-semibold text-sm shadow-md shadow-teal-700/20 hover:shadow-lg hover:shadow-teal-700/30 transition-all duration-300 transform active:scale-95 cursor-pointer"
          >
            <span>Ingresar a la Plataforma</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors"
            aria-label="Menú principal"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-stone-200 px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top duration-200">
          <div className="flex flex-col gap-3 font-medium text-stone-700">
            <button
              onClick={() => scrollToSection('caracteristicas')}
              className="text-left py-2 border-b border-stone-100 flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-teal-600" />
              Características
            </button>
            <button
              onClick={() => scrollToSection('demostracion')}
              className="text-left py-2 border-b border-stone-100 flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-teal-600" />
              Demostración Interactiva
            </button>
            <button
              onClick={() => scrollToSection('docentes')}
              className="text-left py-2 border-b border-stone-100 flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-teal-600" />
              Para Docentes y Alumnos
            </button>
            <div className="pt-2">
              <button
                onClick={() => navigate('/sistemas')}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-teal-700 text-white font-semibold text-sm shadow-md"
              >
                <span>Ingresar a la Plataforma</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default LandingNavbar;
