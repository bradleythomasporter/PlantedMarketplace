import React, { useState, useEffect } from 'react';
import './App.css';

// Import all components
import Header from './components/Header';
import Hero from './components/Hero';
import FeaturedPlants from './components/FeaturedPlants';
import ProductPage from './components/ProductPage';
import Footer from './components/Footer';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import GrowerDashboard from './components/GrowerDashboard';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [authModal, setAuthModal] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [isGrower, setIsGrower] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      const userData = JSON.parse(localStorage.getItem('user'));
      setIsGrower(userData?.isGrower || false);
    }
  }, [isLoggedIn]);

  const handleViewDetails = (plant) => {
    setSelectedPlant(plant);
    setCurrentPage('product');
  };

  const handleGoBack = () => {
    setCurrentPage('home');
    setSelectedPlant(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setIsGrower(false);
    setCurrentPage('home');
  };

  return (
    <div className="page">
      <Header 
        onShowSignup={setAuthModal}
        isLoggedIn={isLoggedIn}
        isGrower={isGrower}
        onLogout={handleLogout}
        setCurrentPage={setCurrentPage}
      />
      {currentPage === 'home' ? (
        <>
          <Hero />
          <FeaturedPlants onViewDetails={handleViewDetails} />
        </>
      ) : currentPage === 'product' ? (
        <ProductPage plant={selectedPlant} onGoBack={handleGoBack} />
      ) : currentPage === 'grower-dashboard' ? (
        <GrowerDashboard />
      ) : null}
      <Footer />

      {authModal === 'login' && (
        <LoginForm 
          onClose={() => setAuthModal(null)}
          onSuccess={(userData) => {
            setIsLoggedIn(true);
            setIsGrower(userData.isGrower);
            localStorage.setItem('user', JSON.stringify(userData));
          }}
        />
      )}
      {authModal === 'register' && (
        <RegisterForm 
          onClose={() => setAuthModal(null)}
          onSuccess={(userData) => {
            setIsLoggedIn(true);
            setIsGrower(userData.isGrower);
            localStorage.setItem('user', JSON.stringify(userData));
          }}
        />
      )}
    </div>
  );
}