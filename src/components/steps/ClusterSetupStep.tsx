import React, { useState } from 'react';
import { Server, Loader, CheckCircle, AlertCircle } from 'lucide-react';

interface ClusterSetupStepProps {
  onNext: () => void;
  onLog: (message: string) => void;
}

type ClusterType = 'minikube' | 'kind' | null;
type SetupStatus = 'idle' | 'starting' | 'success' | 'error';

export const ClusterSetupStep: React.FC<ClusterSetupStepProps> = ({ onNext, onLog }) => {
  const [selectedCluster, setSelectedCluster] = useState<ClusterType>(null);
  const [setupStatus, setSetupStatus] = useState<SetupStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleStartCluster = async () => {
    if (!selectedCluster || !window.electronAPI) return;

    setSetupStatus('starting');
    setErrorMessage('');
    onLog(`Starting ${selectedCluster} cluster...`);

    try {
      const result = await window.electronAPI.startCluster(selectedCluster);

      if (result.success) {
        setSetupStatus('success');
        onLog(`✓ ${selectedCluster} cluster started successfully`);
        if (result.output) {
          onLog(result.output);
        }
      } else {
        setSetupStatus('error');
        setErrorMessage(result.message || 'Failed to start cluster');
        onLog(`✗ Failed to start cluster: ${result.message}`);
        if (result.error) {
          onLog(`Error: ${result.error}`);
        }
      }
    } catch (error) {
      setSetupStatus('error');
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(errorMsg);
      onLog(`✗ Error: ${errorMsg}`);
    }
  };

  const clusterOptions = [
    {
      id: 'minikube' as ClusterType,
      name: 'Minikube',
      description: 'Easy to use, great for beginners. Runs a single-node cluster in a VM.',
      features: ['Single-node cluster', 'Easy setup', 'Good for learning', 'Dashboard included'],
      recommended: true
    },
    {
      id: 'kind' as ClusterType,
      name: 'Kind',
      description: 'Kubernetes IN Docker. Lightweight and fast, great for testing.',
      features: ['Multi-node support', 'Fast startup', 'Uses Docker', 'CI/CD friendly'],
      recommended: false
    }
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Cluster Setup</h2>
      <p className="text-gray-600 mb-6 text-center">
        Choose your local Kubernetes cluster type and start it
      </p>

      {setupStatus === 'idle' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {clusterOptions.map((option) => (
              <div
                key={option.id}
                onClick={() => setSelectedCluster(option.id)}
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                  selectedCluster === option.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                {option.recommended && (
                  <div className="mb-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                      RECOMMENDED
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <Server size={24} className="text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-900">{option.name}</h3>
                </div>
                <p className="text-gray-600 mb-4">{option.description}</p>
                <ul className="space-y-2">
                  {option.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle size={16} className="text-green-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={handleStartCluster}
              disabled={!selectedCluster}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {selectedCluster ? `Start ${selectedCluster} Cluster` : 'Select a Cluster Type'}
            </button>
          </div>
        </>
      )}

      {setupStatus === 'starting' && (
        <div className="text-center py-12">
          <Loader size={48} className="text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Starting {selectedCluster} Cluster
          </h3>
          <p className="text-gray-600">This may take a few minutes. Please wait...</p>
          <div className="mt-4 text-sm text-gray-500">
            <p>The cluster is downloading images and initializing components</p>
          </div>
        </div>
      )}

      {setupStatus === 'success' && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Cluster Started Successfully!</h3>
          <p className="text-gray-600 mb-6">
            Your {selectedCluster} cluster is now running and ready to use.
          </p>
          <button
            onClick={onNext}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Continue to Verification
          </button>
        </div>
      )}

      {setupStatus === 'error' && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={40} className="text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Cluster Setup Failed</h3>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setSetupStatus('idle');
                setErrorMessage('');
              }}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onNext}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Skip and Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
