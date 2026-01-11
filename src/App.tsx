import React, { useState } from 'react';
import { ProgressBar } from './components/ProgressBar';
import { InstallationLog } from './components/InstallationLog';
import { WelcomeStep } from './components/steps/WelcomeStep';
import { OSDetectionStep } from './components/steps/OSDetectionStep';
import { PrerequisitesStep } from './components/steps/PrerequisitesStep';
import { InstallationStep } from './components/steps/InstallationStep';
import { ClusterSetupStep } from './components/steps/ClusterSetupStep';
import { VerificationStep } from './components/steps/VerificationStep';
import { OSInfo, PackageManagerInfo, PrerequisitesCheck } from './types';
import { ChevronLeft } from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Welcome', description: 'Introduction' },
  { id: 2, title: 'OS Detection', description: 'System check' },
  { id: 3, title: 'Prerequisites', description: 'Check components' },
  { id: 4, title: 'Installation', description: 'Install tools' },
  { id: 5, title: 'Cluster Setup', description: 'Start cluster' },
  { id: 6, title: 'Verification', description: 'Verify setup' }
];

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [logs, setLogs] = useState<string[]>([]);
  const [osInfo, setOSInfo] = useState<OSInfo | null>(null);
  const [pmInfo, setPMInfo] = useState<PackageManagerInfo | null>(null);
  const [prerequisites, setPrerequisites] = useState<PrerequisitesCheck | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      addLog(`Proceeding to step ${currentStep + 1}: ${STEPS[currentStep].title}`);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      addLog(`Going back to step ${currentStep - 1}: ${STEPS[currentStep - 2].title}`);
    }
  };

  const handleOSDetected = (os: OSInfo, pm: PackageManagerInfo) => {
    setOSInfo(os);
    setPMInfo(pm);
    addLog(`Detected OS: ${os.platform} (${os.arch})`);
    addLog(`Package Manager: ${pm.packageManager}`);
  };

  const handlePrerequisitesChecked = (checks: PrerequisitesCheck) => {
    setPrerequisites(checks);
    const installedCount = Object.values(checks).filter(c => c.installed).length;
    addLog(`Prerequisites check complete: ${installedCount}/${Object.keys(checks).length} components installed`);
  };

  const getPlatformName = () => {
    if (!osInfo) return '';
    switch (osInfo.platform) {
      case 'darwin':
        return 'macOS';
      case 'win32':
        return 'Windows';
      case 'linux':
        return 'Linux';
      default:
        return osInfo.platform;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <WelcomeStep onNext={handleNext} />;
      case 2:
        return <OSDetectionStep onNext={handleNext} onOSDetected={handleOSDetected} />;
      case 3:
        return (
          <PrerequisitesStep
            onNext={handleNext}
            onChecked={handlePrerequisitesChecked}
          />
        );
      case 4:
        return prerequisites && osInfo ? (
          <InstallationStep
            onNext={handleNext}
            onLog={addLog}
            prerequisites={prerequisites}
            platform={osInfo.platform}
          />
        ) : null;
      case 5:
        return <ClusterSetupStep onNext={handleNext} onLog={addLog} />;
      case 6:
        return <VerificationStep onLog={addLog} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      <div className="w-full h-full flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Kubernetes Multi-OS Installer</h1>
              {osInfo && (
                <p className="text-blue-100 text-sm">
                  {getPlatformName()} • {osInfo.cpus} Cores • {osInfo.memory}GB RAM
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs text-blue-10">Step {currentStep} of {STEPS.length}</div>
              <div className="text-base font-semibold">{STEPS[currentStep - 1].title}</div>
            </div>
          </div>
        </div>

        <div className="px-4 pt-2 pb-1 flex-shrink-0">
          <ProgressBar currentStep={currentStep} totalSteps={STEPS.length} steps={STEPS} />
        </div>

        <div className="flex-grow p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg h-full overflow-hidden">
            <div className="p-6 h-full overflow-y-auto">
              {renderStep()}
            </div>
          </div>
        </div>

        {currentStep > 1 && currentStep < 6 && (
          <div className="px-4 pb-3 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-lg p-3">
              <InstallationLog logs={logs} />
            </div>
          </div>
        )}

        <div className="bg-gray-50 px-4 py-3 flex justify-between border-t border-gray-200 flex-shrink-0">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1 || currentStep === 6}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 hover:bg-gray-200 text-sm"
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <div className="text-xs text-gray-500">
            {currentStep === 6 ? (
              <span>Installation Complete</span>
            ) : (
              <span>
                Use the buttons in each step to continue
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
