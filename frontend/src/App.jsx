import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminProvider } from './context/AdminContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import ApiKeys from './pages/ApiKeys';
import UsageAnalytics from './pages/UsageAnalytics';
import Playground from './pages/Playground';
import Settings from './pages/Settings';

export default function App() {
  return (
    <AdminProvider>
      <BrowserRouter>
        <Routes>
          <Route 
            path="/" 
            element={
              <Layout 
                onRefresh={() => window.location.reload()} 
                isRefreshing={false} 
              />
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="keys" element={<ApiKeys />} />
            <Route path="usage" element={<UsageAnalytics />} />
            <Route path="playground" element={<Playground />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AdminProvider>
  );
}
