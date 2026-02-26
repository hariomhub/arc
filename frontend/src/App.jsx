import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import UserManagement from './pages/UserManagement';
import AdminDashboard from './pages/AdminDashboard';
import AdminPanel from './pages/AdminPanel';
// Pages
import Home from './pages/Home';
import About from './pages/About';
import Framework from './pages/Framework';
// import Assessment from './pages/Assessment';
import Services from './pages/Services';
import Resources from './pages/Resources';
import Certifications from './pages/Certifications';
import Membership from './pages/Membership';
import Contact from './pages/Contact';
import RiskDomain from './pages/RiskDomain';
import CommunityQnA from './pages/CommunityQnA';
import Events from './pages/Events';
import ProductReviews from './pages/ProductReviews';
import Workshops from './pages/Workshops';
import Profile from './pages/Profile';

function App() {
  const { pathname } = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/risk-domains/:id" element={<RiskDomain />} />
          <Route path="/about" element={<About />} />
          <Route path="/framework" element={<Framework />} />
          {/* <Route path="/assessment" element={<Assessment />} /> */}
          <Route path="/services" element={<Services />} />
          <Route path="/services/product-reviews" element={<ProductReviews />} />
          <Route path="/services/workshops" element={<Workshops />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/certifications" element={<Certifications />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/contact" element={<Contact />} />
          {/* Admin routes */}
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/panel" element={<AdminPanel />} />
          <Route path="/admin" element={<AdminDashboard />} />
          {/* Other routes */}
          <Route path="/community" element={<CommunityQnA />} />
          <Route path="/events" element={<Events />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;