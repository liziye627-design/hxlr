import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { UserProvider } from '@/contexts/UserContext';
import { AgentSelectionProvider } from '@/contexts/AgentSelectionContext';
import routes from './routes';
import MainLayout from '@/components/layout/MainLayout';
import GameIntro from './pages/GameIntro';

const App: React.FC = () => {
  return (
    <Router>
      <UserProvider>
        <AgentSelectionProvider>
          <div className="min-h-screen bg-[#0a0a0a]">
            <Routes>
              {/* Isolated Game Intro page - outside MainLayout */}
              <Route path="/intro" element={<GameIntro />} />

              {/* Main app routes with MainLayout */}
              <Route element={<MainLayout />}>
                {routes.map((route, index) => (
                  <Route key={index} path={route.path} element={route.element} />
                ))}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </div>
        </AgentSelectionProvider>
        <Toaster />
      </UserProvider>
    </Router>
  );
};

export default App;
