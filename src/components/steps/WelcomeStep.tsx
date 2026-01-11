import React from 'react';
import { Rocket, Server, Box } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Server size={48} className="text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to Kubernetes Installer
        </h2>
        <p className="text-lg text-gray-600">
          This wizard will guide you through setting up Kubernetes on your system.
          We'll install all necessary components and get your local cluster up and running.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Box size={24} className="text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Auto-Detection</h3>
          <p className="text-sm text-gray-600">
            Automatically detects your OS and uses the appropriate package manager
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Server size={24} className="text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Complete Setup</h3>
          <p className="text-sm text-gray-600">
            Installs Docker, kubectl, and your choice of Minikube or Kind
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Rocket size={24} className="text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Ready to Use</h3>
          <p className="text-sm text-gray-600">
            Verifies installation and starts your cluster automatically
          </p>
        </div>
      </div>

      <button
        onClick={onNext}
        className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        Start Installation
      </button>
    </div>
  );
};
