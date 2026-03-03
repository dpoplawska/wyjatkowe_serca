import React from 'react';

// Shared styles used across app pages (PatientProfile, Medications, etc.)
export const shared: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f8f8f8',
    fontFamily: 'Quicksand, sans-serif',
  },
  loadingPage: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Quicksand, sans-serif',
    color: '#616161',
  },
  main: {
    maxWidth: '760px',
    margin: '0 auto',
    padding: '32px 24px 64px',
  },
  pageTitle: {
    fontWeight: 700,
    fontSize: '24px',
    color: '#2E2E2E',
    marginBottom: '24px',
  },
  centerLoader: {
    display: 'flex',
    justifyContent: 'center',
    padding: '64px 0',
  },
  saveBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#EC1A3B',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '16px',
    padding: '14px 36px',
    cursor: 'pointer',
  },
  saveBtnDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
};
