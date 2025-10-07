import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import Gallery from './components/Gallery';
import BeforeAfter from './components/BeforeAfter';
import Timeline from './components/Timeline';
import TechnicalSpecs from './components/TechnicalSpecs';
import CostsOverview from './components/CostsOverview';
import Footer from './components/Footer';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeSection, setActiveSection] = useState('home');
  const [showAdmin, setShowAdmin] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  // Show admin interface if user is logged in
  if (user) {
    return <AdminDashboard />;
  }

  // Show admin login if admin mode is requested
  if (showAdmin) {
    return <AdminLogin />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header 
        activeSection={activeSection} 
        setActiveSection={setActiveSection}
        onAdminClick={() => setShowAdmin(true)}
      />
      
      {activeSection === 'home' && (
        <>
          <HeroSection />
          <div className="py-16">
            <BeforeAfter />
          </div>
        </>
      )}
      
      {activeSection === 'gallery' && <Gallery />}
      {activeSection === 'timeline' && <Timeline />}
      {activeSection === 'technical' && <TechnicalSpecs />}
      {activeSection === 'costs' && <CostsOverview />}
      
      <Footer />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;