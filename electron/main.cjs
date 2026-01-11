const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { exec, spawn } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');
const Store = require('electron-store');

const store = new Store();
let mainWindow = null;

class KubernetesInstaller {
  constructor() {
    this.platform = os.platform();
    this.architecture = os.arch();
    this.packageManager = this.detectPackageManager();
    this.installationSteps = [];
    this.currentStep = 0;
  }

  detectPackageManager() {
    switch(this.platform) {
      case 'darwin':
        return 'homebrew';
      case 'win32':
        return this.checkCommandSync('winget --version') ? 'winget' : 'choco';
      case 'linux':
        return this.detectLinuxPackageManager();
      default:
        return 'unknown';
    }
  }

  detectLinuxPackageManager() {
    if (fs.existsSync('/etc/debian_version')) return 'apt';
    if (fs.existsSync('/etc/redhat-release')) return 'yum';
    if (fs.existsSync('/etc/arch-release')) return 'pacman';
    if (this.checkCommandSync('dnf --version')) return 'dnf';
    return 'unknown';
  }

  checkCommandSync(command) {
    try {
      require('child_process').execSync(command, { stdio: 'ignore' });
      return true;
    } catch (error) {
      return false;
    }
  }

  async checkCommand(command) {
    return new Promise((resolve) => {
      exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
        resolve({
          installed: !error,
          version: error ? null : stdout.trim(),
          error: error ? stderr : null
        });
      });
    });
  }

  async checkPrerequisites() {
    const checks = {
      docker: await this.checkCommand('docker --version'),
      kubectl: await this.checkCommand('kubectl version --client'),
      helm: await this.checkCommand('helm version'),
      git: await this.checkCommand('git --version'),
      minikube: await this.checkCommand('minikube version'),
      kind: await this.checkCommand('kind version')
    };
    return checks;
  }

  async executeCommand(command, options = {}) {
    return new Promise((resolve) => {
      const child = exec(command, {
        shell: true,
        maxBuffer: 1024 * 1024 * 10,
        timeout: options.timeout || 300000,
        ...options
      }, (error, stdout, stderr) => {
        resolve({
          success: !error,
          output: stdout,
          error: stderr,
          code: error ? error.code : 0
        });
      });

      if (options.onData) {
        child.stdout.on('data', (data) => {
          options.onData(data.toString());
        });
        child.stderr.on('data', (data) => {
          options.onData(data.toString());
        });
      }
    });
  }

  async installHomebrew() {
    if (this.platform !== 'darwin') {
      return { success: true, skip: true, message: 'Not macOS, skipping Homebrew installation' };
    }

    const homebrewCheck = await this.checkCommand('brew --version');
    if (homebrewCheck.installed) {
      return { success: true, skip: true, message: 'Homebrew already installed' };
    }

    const script = '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"';
    const result = await this.executeCommand(script, { timeout: 600000 });

    return {
      success: result.success,
      message: result.success ? 'Homebrew installed successfully' : 'Homebrew installation failed',
      output: result.output,
      error: result.error
    };
  }

  async updatePackageManager() {
    let command = '';

    switch(this.packageManager) {
      case 'homebrew':
        command = 'brew update';
        break;
      case 'apt':
        command = 'sudo apt update';
        break;
      case 'yum':
        command = 'sudo yum update -y';
        break;
      case 'dnf':
        command = 'sudo dnf update -y';
        break;
      case 'pacman':
        command = 'sudo pacman -Sy';
        break;
      case 'winget':
        command = 'winget upgrade --all';
        break;
      case 'choco':
        command = 'choco upgrade all -y';
        break;
      default:
        return { success: false, message: 'Unknown package manager' };
    }

    const result = await this.executeCommand(command);
    return {
      success: result.success,
      message: result.success ? 'Package manager updated' : 'Failed to update package manager',
      output: result.output,
      error: result.error
    };
  }

  async installDocker() {
    let command = '';

    switch(this.platform) {
      case 'darwin':
        command = 'brew install --cask docker';
        break;
      case 'win32':
        command = this.packageManager === 'winget'
          ? 'winget install Docker.DockerDesktop'
          : 'choco install docker-desktop -y';
        break;
      case 'linux':
        command = 'curl -fsSL https://get.docker.com -o /tmp/get-docker.sh && sudo sh /tmp/get-docker.sh';
        break;
    }

    const result = await this.executeCommand(command, { timeout: 600000 });
    return {
      success: result.success,
      message: result.success ? 'Docker installed successfully' : 'Docker installation failed',
      output: result.output,
      error: result.error
    };
  }

  async installKubectl() {
    let command = '';

    switch(this.platform) {
      case 'darwin':
        command = 'brew install kubectl';
        break;
      case 'win32':
        command = this.packageManager === 'winget'
          ? 'winget install Kubernetes.kubectl'
          : 'choco install kubernetes-cli -y';
        break;
      case 'linux':
        if (this.packageManager === 'apt') {
          command = 'sudo apt-get update && sudo apt-get install -y kubectl';
        } else {
          command = 'curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl';
        }
        break;
    }

    const result = await this.executeCommand(command);
    return {
      success: result.success,
      message: result.success ? 'kubectl installed successfully' : 'kubectl installation failed',
      output: result.output,
      error: result.error
    };
  }

  async installMinikube() {
    let command = '';

    switch(this.platform) {
      case 'darwin':
        command = 'brew install minikube';
        break;
      case 'win32':
        command = this.packageManager === 'winget'
          ? 'winget install Kubernetes.minikube'
          : 'choco install minikube -y';
        break;
      case 'linux':
        command = 'curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64 && sudo install minikube-linux-amd64 /usr/local/bin/minikube';
        break;
    }

    const result = await this.executeCommand(command);
    return {
      success: result.success,
      message: result.success ? 'Minikube installed successfully' : 'Minikube installation failed',
      output: result.output,
      error: result.error
    };
  }

  async installKind() {
    let command = '';

    switch(this.platform) {
      case 'darwin':
        command = 'brew install kind';
        break;
      case 'win32':
        command = 'choco install kind -y';
        break;
      case 'linux':
        command = 'curl -Lo ./kind https://kind.sigs.k8s.io/dl/latest/kind-linux-amd64 && chmod +x ./kind && sudo mv ./kind /usr/local/bin/kind';
        break;
    }

    const result = await this.executeCommand(command);
    return {
      success: result.success,
      message: result.success ? 'Kind installed successfully' : 'Kind installation failed',
      output: result.output,
      error: result.error
    };
  }

  async installHelm() {
    let command = '';

    switch(this.platform) {
      case 'darwin':
        command = 'brew install helm';
        break;
      case 'win32':
        command = this.packageManager === 'winget'
          ? 'winget install Helm.Helm'
          : 'choco install kubernetes-helm -y';
        break;
      case 'linux':
        command = 'curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash';
        break;
    }

    const result = await this.executeCommand(command);
    return {
      success: result.success,
      message: result.success ? 'Helm installed successfully' : 'Helm installation failed',
      output: result.output,
      error: result.error
    };
  }

  async startMinikube() {
    const result = await this.executeCommand('minikube start', { timeout: 600000 });
    return {
      success: result.success,
      message: result.success ? 'Minikube cluster started' : 'Failed to start Minikube',
      output: result.output,
      error: result.error
    };
  }

  async verifyInstallation() {
    const checks = await this.checkPrerequisites();
    const results = {
      docker: checks.docker.installed,
      kubectl: checks.kubectl.installed,
      cluster: false
    };

    const clusterCheck = await this.executeCommand('kubectl cluster-info');
    results.cluster = clusterCheck.success;

    return results;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    backgroundColor: '#667eea',
    show: false,
    // Remove default menus
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../public/icon.png') // Set the app icon
  });

  // Remove menu bar completely
  mainWindow.setMenu(null);

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('detect-os', async () => {
  return {
    platform: os.platform(),
    arch: os.arch(),
    release: os.release(),
    hostname: os.hostname(),
    type: os.type(),
    cpus: os.cpus().length,
    memory: Math.round(os.totalmem() / 1024 / 1024 / 1024)
  };
});

ipcMain.handle('detect-package-manager', async () => {
  const installer = new KubernetesInstaller();
  return {
    packageManager: installer.packageManager,
    platform: installer.platform
  };
});

ipcMain.handle('check-prerequisites', async () => {
  const installer = new KubernetesInstaller();
  return await installer.checkPrerequisites();
});

ipcMain.handle('install-homebrew', async () => {
  const installer = new KubernetesInstaller();
  return await installer.installHomebrew();
});

ipcMain.handle('update-package-manager', async () => {
  const installer = new KubernetesInstaller();
  return await installer.updatePackageManager();
});

ipcMain.handle('install-component', async (event, component) => {
  const installer = new KubernetesInstaller();

  switch(component) {
    case 'docker':
      return await installer.installDocker();
    case 'kubectl':
      return await installer.installKubectl();
    case 'minikube':
      return await installer.installMinikube();
    case 'kind':
      return await installer.installKind();
    case 'helm':
      return await installer.installHelm();
    default:
      return { success: false, message: 'Unknown component' };
  }
});

ipcMain.handle('start-cluster', async (event, clusterType) => {
  const installer = new KubernetesInstaller();

  if (clusterType === 'minikube') {
    return await installer.startMinikube();
  } else if (clusterType === 'kind') {
    const result = await installer.executeCommand('kind create cluster');
    return {
      success: result.success,
      message: result.success ? 'Kind cluster created' : 'Failed to create Kind cluster',
      output: result.output,
      error: result.error
    };
  }

  return { success: false, message: 'Unknown cluster type' };
});

ipcMain.handle('verify-installation', async () => {
  const installer = new KubernetesInstaller();
  return await installer.verifyInstallation();
});

ipcMain.handle('execute-command', async (event, command) => {
  const installer = new KubernetesInstaller();
  return await installer.executeCommand(command);
});

ipcMain.handle('show-dialog', async (event, options) => {
  return await dialog.showMessageBox(mainWindow, options);
});

ipcMain.handle('save-config', async (event, key, value) => {
  store.set(key, value);
  return { success: true };
});

ipcMain.handle('load-config', async (event, key) => {
  return store.get(key);
});
