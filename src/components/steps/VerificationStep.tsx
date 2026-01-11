import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader, PartyPopper, ExternalLink } from 'lucide-react';
import { VerificationResults } from '../../types';

interface VerificationStepProps {
  onLog: (message: string) => void;
}

export const VerificationStep: React.FC<VerificationStepProps> = ({ onLog }) => {
  const [results, setResults] = useState<VerificationResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verifyInstallation();
  }, []);

  const verifyInstallation = async () => {
    if (!window.electronAPI) return;

    onLog('Verifying installation...');

    try {
      const verification = await window.electronAPI.verifyInstallation();
      setResults(verification);
      setLoading(false);

      if (verification.docker) {
        onLog('✓ Docker is running');
      } else {
        onLog('✗ Docker is not running');
      }

      if (verification.kubectl) {
        onLog('✓ kubectl is installed and configured');
      } else {
        onLog('✗ kubectl is not properly configured');
      }

      if (verification.cluster) {
        onLog('✓ Kubernetes cluster is accessible');
      } else {
        onLog('✗ Kubernetes cluster is not accessible');
      }
    } catch (error) {
      onLog(`Error during verification: ${error}`);
      setLoading(false);
    }
  };

  const allPassed = results?.docker && results?.kubectl && results?.cluster;
  const partialPassed = results && (results.docker || results.kubectl || results.cluster);

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader size={48} className="text-blue-600 animate-spin mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Installation</h2>
        <p className="text-gray-600">Running system checks...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {allPassed ? (
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PartyPopper size={48} className="text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Installation Complete!</h2>
          <p className="text-gray-600">
            All components are installed and working correctly. You're ready to start using Kubernetes!
          </p>
        </div>
      ) : (
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Installation Results</h2>
          <p className="text-gray-600">
            {partialPassed
              ? 'Some components were installed successfully, but there were issues with others.'
              : 'There were issues during installation. Please check the details below.'}
          </p>
        </div>
      )}

      <div className="space-y-3 mb-8">
        {results && (
          <>
            <div
              className={`border rounded-lg p-4 ${
                results.docker
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {results.docker ? (
                    <CheckCircle size={24} className="text-green-600" />
                  ) : (
                    <XCircle size={24} className="text-red-600" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">Docker</p>
                    <p className="text-sm text-gray-600">
                      {results.docker ? 'Running and accessible' : 'Not running or not installed'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`border rounded-lg p-4 ${
                results.kubectl
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {results.kubectl ? (
                    <CheckCircle size={24} className="text-green-600" />
                  ) : (
                    <XCircle size={24} className="text-red-600" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">kubectl CLI</p>
                    <p className="text-sm text-gray-600">
                      {results.kubectl ? 'Installed and configured' : 'Not installed or not configured'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`border rounded-lg p-4 ${
                results.cluster
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {results.cluster ? (
                    <CheckCircle size={24} className="text-green-600" />
                  ) : (
                    <XCircle size={24} className="text-red-600" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">Kubernetes Cluster</p>
                    <p className="text-sm text-gray-600">
                      {results.cluster ? 'Cluster is accessible' : 'Cluster is not accessible'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {allPassed && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Next Steps:</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">1.</span>
              <span>Open a terminal and run <code className="bg-blue-100 px-2 py-1 rounded">kubectl get nodes</code> to see your cluster nodes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">2.</span>
              <span>Try deploying your first application with <code className="bg-blue-100 px-2 py-1 rounded">kubectl create deployment hello-world --image=nginx</code></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">3.</span>
              <span>Access the Kubernetes dashboard (if using Minikube) with <code className="bg-blue-100 px-2 py-1 rounded">minikube dashboard</code></span>
            </li>
          </ul>
        </div>
      )}

      {!allPassed && partialPassed && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Some components need attention. Check the installation log for details
            or try reinstalling the failed components manually.
          </p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Useful Resources:</h3>
        <div className="space-y-2">
          <a
            href="https://kubernetes.io/docs/home/"
            className="flex items-center gap-2 text-blue-600 hover:underline text-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={16} />
            Kubernetes Documentation
          </a>
          <a
            href="https://minikube.sigs.k8s.io/docs/"
            className="flex items-center gap-2 text-blue-600 hover:underline text-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={16} />
            Minikube Documentation
          </a>
          <a
            href="https://kind.sigs.k8s.io/"
            className="flex items-center gap-2 text-blue-600 hover:underline text-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={16} />
            Kind Documentation
          </a>
        </div>
      </div>

      <div className="text-center mt-8">
        <button
          onClick={() => {
            if (window.electronAPI) {
              window.close();
            }
          }}
          className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
        >
          Finish & Close
        </button>
      </div>
    </div>
  );
};
