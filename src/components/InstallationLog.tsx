import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

interface InstallationLogProps {
  logs: string[];
}

export const InstallationLog: React.FC<InstallationLogProps> = ({ logs }) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="mt-6 border border-gray-300 rounded-lg overflow-hidden">
      <div className="bg-gray-800 text-white px-4 py-2 flex items-center gap-2">
        <Terminal size={16} />
        <span className="text-sm font-semibold">Installation Log</span>
      </div>
      <div className="bg-gray-900 text-green-400 p-4 font-mono text-sm h-48 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-gray-500">Waiting for installation to start...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1">
              {log}
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};
