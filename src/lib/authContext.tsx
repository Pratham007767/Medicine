'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSession } from '@/types';

interface AuthContextType {
  user: UserSession | null;
  login: (email: string, role: 'patient' | 'pharmacy_owner', name?: string, pharmacyId?: string) => void;
  logout: () => void;
  switchRole: (role: 'patient' | 'pharmacy_owner') => void;
  isPharmacyOwner: boolean;
  isPatient: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_PATIENT: UserSession = {
  id: 'usr-patient-1',
  name: 'Alex Morgan',
  email: 'alex.morgan@example.com',
  role: 'patient'
};

const DEMO_PHARMACIST: UserSession = {
  id: 'usr-pharm-1',
  name: 'Dr. Evelyn Reed, PharmD',
  email: 'evelyn@careplusmetro.com',
  role: 'pharmacy_owner',
  pharmacy_id: 'pharm-1'
};

const AUTH_STORAGE_KEY = 'medfinder_user_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(DEMO_PATIENT); // Default to Patient for ease of initial exploration

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const login = (email: string, role: 'patient' | 'pharmacy_owner', name?: string, pharmacyId?: string) => {
    const newUser: UserSession = {
      id: `usr-${Date.now()}`,
      name: name || (role === 'pharmacy_owner' ? 'Pharmacy Manager' : 'Verified Patient'),
      email,
      role,
      pharmacy_id: role === 'pharmacy_owner' ? (pharmacyId || 'pharm-1') : undefined
    };
    setUser(newUser);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    } catch {}
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {}
  };

  const switchRole = (newRole: 'patient' | 'pharmacy_owner') => {
    const targetUser = newRole === 'pharmacy_owner' ? DEMO_PHARMACIST : DEMO_PATIENT;
    setUser(targetUser);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(targetUser));
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        switchRole,
        isPharmacyOwner: user?.role === 'pharmacy_owner',
        isPatient: user?.role === 'patient' || !user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
