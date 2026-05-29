import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OSCURO = {
  bg: '#001230',
  bgCard: '#111827',
  bgCardHigh: '#1F2937',
  bgInput: '#1B263B',
  bgModal: '#0B1424',
  bgNavBar: 'rgba(0,13,39,0.95)',
  primary: '#00C2D1',
  primaryHover: '#45DEED',
  primaryFaint: 'rgba(0,194,209,0.06)',
  primaryLight: 'rgba(0,194,209,0.12)',
  primaryMid: 'rgba(0,194,209,0.2)',
  primaryBorder: 'rgba(0,194,209,0.15)',
  secondary: '#7C3AED',
  onSurface: '#E5E7EB',
  onSurfaceVariant: '#9CA3AF',
  outline: '#6B7280',
  outlineVariant: 'rgba(36,53,84,0.4)',
  navBorder: 'rgba(36,53,84,0.3)',
  headerBg: 'rgba(0,18,48,0.95)',
  success: '#10B981',
  successFaint: 'rgba(16,185,129,0.15)',
  alert: '#F87171',
  alertFaint: 'rgba(248,113,113,0.12)',
  warning: '#FBBF24',
  glow: 'rgba(0,194,209,0.06)',
};

const CLARO = {
  bg: '#F7FAFE',
  bgCard: '#FFFFFF',
  bgCardHigh: '#EBF0F8',
  bgInput: '#F1F5F9',
  bgModal: '#FFFFFF',
  bgNavBar: 'rgba(247,250,254,0.95)',
  primary: '#004AC6',
  primaryHover: '#003A9E',
  primaryFaint: 'rgba(0,74,198,0.06)',
  primaryLight: 'rgba(0,74,198,0.1)',
  primaryMid: 'rgba(0,74,198,0.18)',
  primaryBorder: 'rgba(0,74,198,0.12)',
  secondary: '#712AE2',
  onSurface: '#181C1F',
  onSurfaceVariant: '#434655',
  outline: '#737686',
  outlineVariant: 'rgba(195,198,215,0.5)',
  navBorder: 'rgba(195,198,215,0.4)',
  headerBg: 'rgba(247,250,254,0.95)',
  success: '#059669',
  successFaint: 'rgba(16,185,129,0.1)',
  alert: '#BA1A1A',
  alertFaint: 'rgba(186,26,26,0.08)',
  warning: '#D97706',
  glow: 'rgba(0,74,198,0.06)',
};

const TemaContext = createContext(null);

export function TemaProvider({ children }) {
  const [tema, setTema] = useState('oscuro');

  useEffect(() => {
    AsyncStorage.getItem('tema').then(v => {
      if (v === 'claro' || v === 'oscuro') setTema(v);
    });
  }, []);

  const toggleTema = (t) => {
    setTema(t);
    AsyncStorage.setItem('tema', t);
  };

  return (
    <TemaContext.Provider value={{ tema, paleta: tema === 'oscuro' ? OSCURO : CLARO, toggleTema }}>
      {children}
    </TemaContext.Provider>
  );
}

export function useTema() {
  const ctx = useContext(TemaContext);
  if (!ctx) throw new Error('useTema debe usarse dentro de TemaProvider');
  return ctx;
}
