import React from 'react';
import { Menu, X, Wrench } from 'lucide-react';
import { useSiteSettings } from '../contexts/SettingsContext';
import { SECTION_PATHS, Section, handleLinkClick } from '../lib/router';

interface HeaderProps {
  activeSection: string;
  onAdminClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeSection, onAdminClick }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { settings } = useSiteSettings();

  const menuItems = [
    { id: 'home', label: 'Accueil' },
    { id: 'gallery', label: 'Galerie' },
    { id: 'timeline', label: 'Chronologie' },
    { id: 'technical', label: 'Technique' },
    { id: 'costs', label: 'Coûts' },
  ];

  return (
    <header className="fixed top-0 w-full bg-zinc-900/95 backdrop-blur-sm border-b border-orange-500/20 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <a href="/" onClick={e => handleLinkClick(e, '/')} className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-lg">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{String(settings.site_title)}</h1>
              <p className="text-sm text-orange-400">Restauration {String(settings.bike_year)}</p>
            </div>
          </a>

          {/* Desktop Menu */}
          <nav className="hidden md:flex space-x-8">
            {menuItems.map((item) => (
              <a
                key={item.id}
                href={SECTION_PATHS[item.id as Section]}
                onClick={e => handleLinkClick(e, SECTION_PATHS[item.id as Section])}
                aria-current={activeSection === item.id ? 'page' : undefined}
                className={`px-4 py-2 rounded-lg transition-all duration-300 font-medium ${
                  activeSection === item.id
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'text-zinc-300 hover:text-orange-400 hover:bg-zinc-800/50'
                }`}
              >
                {item.label}
              </a>
            ))}
            {onAdminClick && (
              <button
                onClick={onAdminClick}
                className="px-4 py-2 rounded-lg transition-all duration-300 font-medium text-zinc-300 hover:text-orange-400 hover:bg-zinc-800/50 border border-zinc-700 hover:border-orange-500/50"
              >
                Admin
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-zinc-800">
            <nav className="flex flex-col space-y-2">
              {menuItems.map((item) => (
                <a
                  key={item.id}
                  href={SECTION_PATHS[item.id as Section]}
                  onClick={e => handleLinkClick(e, SECTION_PATHS[item.id as Section], () => setIsMenuOpen(false))}
                  aria-current={activeSection === item.id ? 'page' : undefined}
                  className={`px-4 py-3 rounded-lg text-left transition-all duration-300 ${
                    activeSection === item.id
                      ? 'bg-orange-500 text-white'
                      : 'text-zinc-300 hover:text-orange-400 hover:bg-zinc-800/50'
                  }`}
                >
                  {item.label}
                </a>
              ))}
              {onAdminClick && (
                <button
                  onClick={() => {
                    onAdminClick();
                    setIsMenuOpen(false);
                  }}
                  className="px-4 py-3 rounded-lg text-left transition-all duration-300 text-zinc-300 hover:text-orange-400 hover:bg-zinc-800/50 border border-zinc-700"
                >
                  Admin
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;