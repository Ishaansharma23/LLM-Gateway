import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setApiAdminSecret, clearApiAdminSecret } from '../services/api';
import { healthService } from '../services/healthService';
import { keyService } from '../services/keyService';

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const [adminSecret, setAdminSecret] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [authStatus, setAuthStatus] = useState('unverified');
  const [healthData, setHealthData] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const saveSecret = (secret) => {
    const clean = secret ? secret.trim() : '';
    setAdminSecret(clean);
    setApiAdminSecret(clean);
    setAuthStatus('unverified');
  };

  const clearSecret = () => {
    setAdminSecret('');
    clearApiAdminSecret();
    setAuthStatus('unverified');
  };

  const testConnection = useCallback(async (candidateSecret) => {
    setIsTesting(true);
    const secretToTest = candidateSecret !== undefined ? candidateSecret : adminSecret;

    try {
      const health = await healthService.checkHealth();
      setHealthData(health);
      setBackendStatus('healthy');

      if (secretToTest) {
        setApiAdminSecret(secretToTest);
        try {
          await keyService.listKeys();
          setAuthStatus('verified');
          return { success: true, backendHealthy: true, authValid: true };
        } catch (authErr) {
          setAuthStatus('invalid');
          return { success: false, backendHealthy: true, authValid: false, error: authErr.message };
        }
      } else {
        setAuthStatus('unverified');
        return { success: true, backendHealthy: true, authValid: false };
      }
    } catch (err) {
      setBackendStatus('unhealthy');
      setAuthStatus('unverified');
      return { success: false, backendHealthy: false, authValid: false, error: err.message };
    } finally {
      setIsTesting(false);
    }
  }, [adminSecret]);

  useEffect(() => {
    testConnection();
    const timer = setInterval(() => {
      healthService.checkHealth()
        .then((h) => {
          setHealthData(h);
          setBackendStatus('healthy');
        })
        .catch(() => setBackendStatus('unhealthy'));
    }, 20000);

    return () => clearInterval(timer);
  }, [testConnection]);

  return (
    <AdminContext.Provider
      value={{
        adminSecret,
        isConfigured: Boolean(adminSecret),
        backendStatus,
        authStatus,
        healthData,
        isTesting,
        saveSecret,
        clearSecret,
        testConnection
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
