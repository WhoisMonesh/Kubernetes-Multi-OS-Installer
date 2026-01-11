import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { PrerequisitesCheck } from '../../types';

interface PrerequisitesStepProps {
  onNext: () => void;
  onChecked: (checks: PrerequisitesCheck) => void;
}

export const PrerequisitesStep: React.FC<PrerequisitesStepProps> = ({ onNext, onChecked }) => {
  const [checks, setChecks] = useState<PrerequisitesCheck | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    performChecks();
  }, []);

  const performChecks = async () => {
    if (!window.electronAPI) return;

    try {
      const results = await window.electronAPI.checkPrerequisites();
      setChecks(results);
      onChecked(results);
      setLoading(false);
    } catch (error) {
      console.error('Failed to check prerequisites:', error);
      setLoading(false);
    }
  };

  const getComponentName = (key: string) => {
    const names: { [key: string]: string } = {
      docker: 'Docker',
      kubectl: 'kubectl CLI',
      helm: 'Helm (Optional)',
      git: 'Git',
      minikube: 'Minikube',
      kind: 'Kind'
    };
    return names[key] || key;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader size={48} className="text-blue-600 animate-spin mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Checking Prerequisites</h2>
        <p className="text-gray-600">Scanning your system for existing installations...</p>
      </div>
    );
  }

  const installedCount = checks ? Object.values(checks).filter(c => c.installed).length : 0;
  const totalCount = checks ? Object.keys(checks).length : 0;
  const missingRequired = checks ? ['docker', 'kubectl'].filter(key => !checks[key as keyof PrerequisitesCheck].installed) : [];

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Prerequisites Check</h2>
      <p className="text-gray-600 mb-6 text-center">
        {installedCount} of {totalCount} components detected
      </p>

      <div className="space-y-3 mb-6">
        {checks && Object.entries(checks).map(([key, result]) => (
          <div
            key={key}
            className={`border rounded-lg p-4 flex items-center justify-between ${
              result.installed
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {result.installed ? (
                <CheckCircle size={24} className="text-green-600" />
              ) : (
                <XCircle size={24} className="text-gray-400" />
              )}
              <div>
                <p className="font-semibold text-gray-900">{getComponentName(key)}</p>
                {result.installed && result.version && (
                  <p className="text-sm text-gray-600">{result.version}</p>
                )}
              </div>
            </div>
            <div>
              {result.installed ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  Installed
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-200 text-gray-700 text-sm font-medium rounded-full">
                  Not Installed
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {missingRequired.length > 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Some required components are missing. The installer will guide you through
            installing {missingRequired.map(k => getComponentName(k)).join(' and ')}.
          </p>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-800">
            <strong>Great!</strong> All required components are already installed. You can proceed to cluster setup
            or reinstall any components if needed.
          </p>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={onNext}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
