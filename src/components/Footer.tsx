import React from 'react';
import { Heart, Mail, Phone, Calendar } from 'lucide-react';
import { useSiteSettings } from '../contexts/SettingsContext';
import { formatMonthYear } from '../lib/siteSettings';

interface FooterProps {
  onNavigate?: (section: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { settings } = useSiteSettings();
  const startLabel = formatMonthYear(String(settings.project_start_date));
  const email = settings.show_contact_email ? String(settings.owner_email) : '';
  const phone = settings.show_contact_phone ? String(settings.owner_phone) : '';
  const owner = String(settings.owner_name);
  const startYear = new Date(String(settings.project_start_date)).getFullYear() || 2025;
  const currentYear = new Date().getFullYear();
  const handleNavClick = (section: string) => {
    if (onNavigate) {
      onNavigate(section);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold text-orange-400 mb-4">{String(settings.site_title)}</h3>
            <p className="text-zinc-400 leading-relaxed mb-4 whitespace-pre-line">
              {String(settings.site_description)}
            </p>
            <div className="flex items-center text-zinc-400">
              <Heart className="h-4 w-4 text-red-500 mr-2" />
              <span>Restauré avec passion</span>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Informations</h4>
            <div className="space-y-3">
              {startLabel && (
                <div className="flex items-center text-zinc-400">
                  <Calendar className="h-4 w-4 mr-3" />
                  <span>Projet débuté en {startLabel.toLowerCase()}</span>
                </div>
              )}
              {email && (
                <a href={`mailto:${email}`} className="flex items-center text-zinc-400 hover:text-orange-400">
                  <Mail className="h-4 w-4 mr-3" />
                  <span>{email}</span>
                </a>
              )}
              {phone && (
                <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-center text-zinc-400 hover:text-orange-400">
                  <Phone className="h-4 w-4 mr-3" />
                  <span>{phone}</span>
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Navigation</h4>
            <div className="space-y-2">
              <button onClick={() => handleNavClick('home')} className="block text-zinc-400 hover:text-orange-400 cursor-pointer transition-colors text-left">
                Accueil
              </button>
              <button onClick={() => handleNavClick('gallery')} className="block text-zinc-400 hover:text-orange-400 cursor-pointer transition-colors text-left">
                Galerie
              </button>
              <button onClick={() => handleNavClick('timeline')} className="block text-zinc-400 hover:text-orange-400 cursor-pointer transition-colors text-left">
                Chronologie
              </button>
              <button onClick={() => handleNavClick('technical')} className="block text-zinc-400 hover:text-orange-400 cursor-pointer transition-colors text-left">
                Technique
              </button>
              <button onClick={() => handleNavClick('costs')} className="block text-zinc-400 hover:text-orange-400 cursor-pointer transition-colors text-left">
                Coûts
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-800 mt-8 pt-8 text-center">
          <p className="text-zinc-500">
            © {startYear < currentYear ? `${startYear}–${currentYear}` : currentYear} {owner ? `${owner} — ` : ''}Restauration {String(settings.site_title)}. Tous droits réservés.
          </p>
          <p className="text-zinc-700 text-xs mt-1">v{__APP_VERSION__}</p>
          <p className="text-zinc-600 text-sm mt-2">
            Développé avec ❤️ pour les passionnés de motos anciennes
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;