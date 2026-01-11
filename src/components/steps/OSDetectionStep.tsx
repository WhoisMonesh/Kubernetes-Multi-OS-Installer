import React, { useEffect, useState } from 'react';
import { Monitor, Cpu, HardDrive, Loader } from 'lucide-react';
import { OSInfo, PackageManagerInfo } from '../../types';

interface OSDetectionStepProps {
  onNext: () => void;
  onOSDetected: (osInfo: OSInfo, pmInfo: PackageManagerInfo) => void;
}

export const OSDetectionStep: React.FC<OSDetectionStepProps> = ({ onNext, onOSDetected }) => {
  const [osInfo, setOSInfo] = useState<OSInfo | null>(null);
  const [pmInfo, setPMInfo] = useState<PackageManagerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    detectSystem();
  }, []);

  const detectSystem = async () => {
    if (!window.electronAPI) {
      console.error('Electron API not available');
      return;
    }

    try {
      const os = await window.electronAPI.detectOS();
      const pm = await window.electronAPI.detectPackageManager();

      setOSInfo(os);
      setPMInfo(pm);
      onOSDetected(os, pm);
      setLoading(false);
    } catch (error) {
      console.error('Failed to detect system:', error);
      setLoading(false);
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'darwin':
        return 'macOS';
      case 'win32':
        return 'Windows';
      case 'linux':
        return 'Linux';
      default:
        return platform;
    }
  };

  const getPackageManagerName = (pm: string) => {
    switch (pm) {
      case 'homebrew':
        return 'Homebrew';
      case 'winget':
        return 'Winget';
      case 'choco':
        return 'Chocolatey';
      case 'apt':
        return 'APT';
      case 'yum':
        return 'YUM';
      case 'dnf':
        return 'DNF';
      case 'pacman':
        return 'Pacman';
      default:
        return pm;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader size={48} className="text-blue-600 animate-spin mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Detecting Your System</h2>
        <p className="text-gray-600">Please wait while we analyze your environment...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">System Information</h2>

      {osInfo && pmInfo && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Monitor size={24} className="text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Operating System</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Platform</p>
                <p className="font-semibold text-gray-900">{getPlatformName(osInfo.platform)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Architecture</p>
                <p className="font-semibold text-gray-900">{osInfo.arch}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Release</p>
                <p className="font-semibold text-gray-900">{osInfo.release}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Hostname</p>
                <p className="font-semibold text-gray-900">{osInfo.hostname}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Cpu size={24} className="text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Hardware</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">CPU Cores</p>
                <p className="font-semibold text-gray-900">{osInfo.cpus}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Memory</p>
                <p className="font-semibold text-gray-900">{osInfo.memory} GB</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <HardDrive size={24} className="text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Package Manager</h3>
            </div>
            <div>
              <p className="text-sm text-gray-600">Detected Package Manager</p>
              <p className="font-semibold text-gray-900">{getPackageManagerName(pmInfo.packageManager)}</p>
            </div>
          </div>

          {osInfo.memory < 4 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> Your system has less than 4GB of RAM. Kubernetes may experience performance issues.
              </p>
            </div>
          )}

          <div className="text-center pt-4">
            <button
              onClick={onNext}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
