import React from 'react';
import { Heart, Mail, Phone, Calendar } from 'lucide-react';

interface FooterProps {
  onNavigate?: (section: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
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
            <h3 className="text-xl font-bold text-orange-400 mb-4">Bultaco Sherpa 350</h3>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Documentation complète de la restauration d'une légende du trial espagnol. 
              Un projet passionné pour redonner vie à une machine d'exception.
            </p>
            <div className="flex items-center text-zinc-400">
              <Heart className="h-4 w-4 text-red-500 mr-2" />
              <span>Restauré avec passion</span>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Informations</h4>
            <div className="space-y-3">
              <div className="flex items-center text-zinc-400">
                <Calendar className="h-4 w-4 mr-3" />
                <span>Projet débuté en Aout 2025</span>
              </div>
              <div className="flex items-center text-zinc-400">
                <Mail className="h-4 w-4 mr-3" />
                <span>cnectoux@free.fr</span>
              </div>
              <div className="flex items-center text-zinc-400">
                <Phone className="h-4 w-4 mr-3" />
                <span>+33 6 14 21 61 46</span>
              </div>
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
            © 2025–{new Date().getFullYear()} Restauration Bultaco Sherpa 350. Tous droits réservés.
          </p>
          <p className="text-zinc-600 text-sm mt-2">
            Développé avec ❤️ pour les passionnés de motos anciennes
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;