import React, { useState } from 'react';
import CatalogReview from './CatalogReview';
import MultiItemUpload from './components/MultiItemUpload';

function App() {
  const [currentView, setCurrentView] = useState('catalog'); // 'catalog' or 'multi-upload'

  const handleNavigation = (view) => {
    setCurrentView(view);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'multi-upload':
        return <MultiItemUpload onNavigate={handleNavigation} />;
      case 'catalog':
      default:
        return <CatalogReview onNavigate={handleNavigation} />;
    }
  };

  return (
    <div className="App">
      {/* Simple navigation toggle for testing */}
      <div style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 1000, background: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <button onClick={() => setCurrentView('catalog')} style={{ marginRight: '10px' }}>Catalog View</button>
        <button onClick={() => setCurrentView('multi-upload')}>Multi Upload View</button>
      </div>
      {renderCurrentView()}
    </div>
  );
}

export default App;
