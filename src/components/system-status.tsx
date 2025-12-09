// src/components/system-status.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SystemStatus() {
  const [status, setStatus] = useState<'ok' | 'degraded' | 'loading'>('loading');
  
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
            setStatus('ok');
        } else {
            setStatus('degraded');
        }
      } catch (e) {
        setStatus('degraded');
      }
    };

    // Initial check
    checkHealth();

    // Poll every 30s
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-8 bg-[#0f0a1a] border-t border-slate-800 flex items-center px-4 justify-end z-50">
        <div className="flex items-center gap-2 text-xs font-mono">
            {status === 'loading' && (
                <span className="text-slate-500 flex items-center gap-1">
                    <Activity className="h-3 w-3 animate-pulse" /> Connecting...
                </span>
            )}
            
            {status === 'ok' && (
                <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> System Operational
                </span>
            )}

            {status === 'degraded' && (
                <span className="text-amber-400 flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="h-3 w-3" /> System Degraded
                </span>
            )}
        </div>
    </div>
  );
}
