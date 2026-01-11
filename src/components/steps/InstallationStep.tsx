import React, { useState, useEffect } from 'react';
import { CheckCircle, Loader, AlertCircle, Download } from 'lucide-react';
import { PrerequisitesCheck } from '../../types';

interface InstallationStepProps {
  onNext: () => void;
  onLog: (message: string) => void;
  prerequisites: PrerequisitesCheck;
  platform: string;
}

interface ComponentStatus {
  name: string;
  key: string;
  status: 'pending' | 'installing' | 'success' | 'error' | 'skipped';
  message?: string;
}

export const InstallationStep: React.FC<InstallationStepProps> = ({
  onNext,
  onLog,
  prerequisites,
  platform
}) => {
  const [components, setComponents] = useState<ComponentStatus[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    initializeComponents();
  }, []);

  useEffect(() => {
    if (currentIndex >= 0 && currentIndex < components.length) {
      installComponent(currentIndex);
    } else if (currentIndex >= components.length && !isComplete) {
      setIsComplete(true);
    }
  }, [currentIndex]);

  const initializeComponents = () => {
    const toInstall: ComponentStatus[] = [];

    if (platform === 'darwin' && !window.electronAPI) {
      toInstall.push({
        name: 'Homebrew',
        key: 'homebrew',
        status: 'pending'
      });
    }

    if (!prerequisites.docker.installed) {
      toInstall.push({
        name: 'Docker',
        key: 'docker',
        status: 'pending'
      });
    }

    if (!prerequisites.kubectl.installed) {
      toInstall.push({
        name: 'kubectl',
        key: 'kubectl',
        status: 'pending'
      });
    }

    if (!prerequisites.minikube.installed && !prerequisites.kind.installed) {
      toInstall.push({
        name: 'Minikube',
        key: 'minikube',
        status: 'pending'
      });
    }

    if (!prerequisites.helm.installed) {
      toInstall.push({
        name: 'Helm (Optional)',
        key: 'helm',
        status: 'pending'
      });
    }

    if (toInstall.length === 0) {
      toInstall.push({
        name: 'System Check',
        key: 'check',
        status: 'pending'
      });
    }

    setComponents(toInstall);
    setCurrentIndex(0);
  };

  const updateComponentStatus = (index: number, status: ComponentStatus['status'], message?: string) => {
    setComponents(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status, message };
      return updated;
    });
  };

  const installComponent = async (index: number) => {
    if (!window.electronAPI) return;

    const component = components[index];
    updateComponentStatus(index, 'installing');
    onLog(`Installing ${component.name}...`);

    try {
      let result;

      switch (component.key) {
        case 'homebrew':
          result = await window.electronAPI.installHomebrew();
          break;
        case 'check':
          result = { success: true, message: 'All components already installed' };
          break;
        default:
          result = await window.electronAPI.installComponent(component.key);
      }

      if (result.success || result.skip) {
        updateComponentStatus(index, result.skip ? 'skipped' : 'success', result.message);
        onLog(`✓ ${component.name}: ${result.message}`);
        setTimeout(() => setCurrentIndex(index + 1), 1000);
      } else {
        updateComponentStatus(index, 'error', result.message || 'Installation failed');
        onLog(`✗ ${component.name}: ${result.message || 'Installation failed'}`);
        if (result.error) {
          onLog(`Error details: ${result.error}`);
        }
        setTimeout(() => setCurrentIndex(index + 1), 2000);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateComponentStatus(index, 'error', errorMessage);
      onLog(`✗ ${component.name}: ${errorMessage}`);
      setTimeout(() => setCurrentIndex(index + 1), 2000);
    }
  };

  const getStatusIcon = (status: ComponentStatus['status']) => {
    switch (status) {
      case 'installing':
        return <Loader size={20} className="text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle size={20} className="text-green-600" />;
      case 'error':
        return <AlertCircle size={20} className="text-red-600" />;
      case 'skipped':
        return <CheckCircle size={20} className="text-gray-400" />;
      default:
        return <Download size={20} className="text-gray-400" />;
    }
  };

  const hasErrors = components.some(c => c.status === 'error');

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Installing Components</h2>
      <p className="text-gray-600 mb-6 text-center">
        {isComplete
          ? 'Installation process completed'
          : `Installing ${components.length} component${components.length !== 1 ? 's' : ''}...`}
      </p>

      <div className="space-y-3 mb-6">
        {components.map((component, index) => (
          <div
            key={component.key}
            className={`border rounded-lg p-4 transition-all ${
              component.status === 'success'
                ? 'bg-green-50 border-green-200'
                : component.status === 'error'
                ? 'bg-red-50 border-red-200'
                : component.status === 'installing'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(component.status)}
                <div>
                  <p className="font-semibold text-gray-900">{component.name}</p>
                  {component.message && (
                    <p className="text-sm text-gray-600 mt-1">{component.message}</p>
                  )}
                </div>
              </div>
              <div>
                {component.status === 'success' && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    Installed
                  </span>
                )}
                {component.status === 'error' && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                    Failed
                  </span>
                )}
                {component.status === 'installing' && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    Installing...
                  </span>
                )}
                {component.status === 'skipped' && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                    Skipped
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasErrors && isComplete && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Warning:</strong> Some components failed to install. You can continue and try manual
            installation later, or restart the installer.
          </p>
        </div>
      )}

      {isComplete && (
        <div className="text-center">
          <button
            onClick={onNext}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Continue to Cluster Setup
          </button>
        </div>
      )}
    </div>
  );
};
