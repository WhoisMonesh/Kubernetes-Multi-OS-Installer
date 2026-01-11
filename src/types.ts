export interface OSInfo {
  platform: string;
  arch: string;
  release: string;
  hostname: string;
  type: string;
  cpus: number;
  memory: number;
}

export interface PackageManagerInfo {
  packageManager: string;
  platform: string;
}

export interface CommandResult {
  installed: boolean;
  version: string | null;
  error: string | null;
}

export interface PrerequisitesCheck {
  docker: CommandResult;
  kubectl: CommandResult;
  helm: CommandResult;
  git: CommandResult;
  minikube: CommandResult;
  kind: CommandResult;
}

export interface InstallationResult {
  success: boolean;
  skip?: boolean;
  message: string;
  output?: string;
  error?: string;
}

export interface VerificationResults {
  docker: boolean;
  kubectl: boolean;
  cluster: boolean;
}

export interface StepConfig {
  id: number;
  title: string;
  description: string;
}

export interface ElectronAPI {
  detectOS: () => Promise<OSInfo>;
  detectPackageManager: () => Promise<PackageManagerInfo>;
  checkPrerequisites: () => Promise<PrerequisitesCheck>;
  installHomebrew: () => Promise<InstallationResult>;
  updatePackageManager: () => Promise<InstallationResult>;
  installComponent: (component: string) => Promise<InstallationResult>;
  startCluster: (clusterType: string) => Promise<InstallationResult>;
  verifyInstallation: () => Promise<VerificationResults>;
  executeCommand: (command: string) => Promise<InstallationResult>;
  showDialog: (options: any) => Promise<any>;
  saveConfig: (key: string, value: any) => Promise<{ success: boolean }>;
  loadConfig: (key: string) => Promise<any>;
  platform: string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
