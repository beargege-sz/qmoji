
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UploadPage } from './pages/UploadPage';
import { GeneratingPage } from './pages/GeneratingPage';
import { ResultPage } from './pages/ResultPage';

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="antialiased text-gray-900">
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/generate/:taskId" element={<GeneratingPage />} />
          <Route path="/result/:taskId" element={<ResultPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;
