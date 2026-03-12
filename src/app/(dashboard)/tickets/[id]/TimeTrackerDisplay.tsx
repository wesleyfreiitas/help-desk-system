'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Play } from 'lucide-react';

interface Props {
  totalSeconds: number;
  lastStartedAt: Date | null;
}

export default function TimeTrackerDisplay({ totalSeconds, lastStartedAt }: Props) {
  const [currentElapsed, setCurrentElapsed] = useState(0);

  useEffect(() => {
    if (!lastStartedAt) {
      setCurrentElapsed(0);
      return;
    }

    const start = new Date(lastStartedAt).getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = Math.floor((now - start) / 1000);
      setCurrentElapsed(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastStartedAt]);

  const total = totalSeconds + currentElapsed;

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="time-tracker-container" style={{
      marginTop: '1rem',
      padding: '0.75rem',
      backgroundColor: 'var(--bg-color)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-color)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          <Clock size={14} />
          REGISTRO DE TEMPO
        </div>
        {lastStartedAt && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--success)', fontWeight: 600 }}>
             <div className="pulse-dot" style={{ width: 6, height: 6, backgroundColor: 'currentColor', borderRadius: '50%' }}></div>
             EM ANDAMENTO
          </div>
        )}
      </div>
      
      <div style={{ 
        fontSize: '1.25rem', 
        fontWeight: 700, 
        color: lastStartedAt ? 'var(--primary)' : 'var(--text-dark)',
        fontFamily: 'monospace',
        letterSpacing: '0.05em'
      }}>
        {formatTime(total)}
      </div>
    </div>
  );
}
