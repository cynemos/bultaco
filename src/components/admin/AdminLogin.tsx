import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) {
          setError('Erreur lors de l\'inscription: ' + error.message);
        } else {
          setError('');
          setIsSignUp(false);
          setEmail('');
          setPassword('');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError('Email ou mot de passe incorrect');
        }
      }
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800">
          <div className="text-center mb-8">
            <div className="bg-orange-500/20 p-3 rounded-lg inline-flex mb-4">
              <Lock className="h-8 w-8 text-orange-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Administration</h1>
            <p className="text-zinc-400">{isSignUp ? 'Créer un compte' : 'Connectez-vous pour gérer le contenu'}</p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-5 w-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  placeholder="admin@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-5 w-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (isSignUp ? 'Inscription...' : 'Connexion...') : (isSignUp ? 'S\'inscrire' : 'Se connecter')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-zinc-400 hover:text-orange-400 text-sm transition-colors"
            >
              {isSignUp ? 'Vous avez déjà un compte? Connectez-vous' : 'Pas de compte? S\'inscrire'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;