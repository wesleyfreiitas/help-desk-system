'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      onClick={toggleTheme}
      className={`theme-toggle-btn ${theme}`}
      title={theme === 'light' ? 'Ativar Modo Noturno' : 'Ativar Modo Claro'}
      aria-label="Alternar tema"
    >
      <div className="icon-wrapper">
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </div>
      
      <style jsx>{`
        .theme-toggle-btn {
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          color: var(--text-main);
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 0;
          overflow: hidden;
          position: relative;
        }

        .theme-toggle-btn:hover {
          border-color: var(--primary);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          animation: scaleIn 0.3s ease-out;
        }

        @keyframes scaleIn {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        /* Ambient glow in dark mode */
        .theme-toggle-btn.dark:hover {
          box-shadow: 0 0 15px rgba(2, 132, 199, 0.3);
        }
      `}</style>
    </button>
  );
}
