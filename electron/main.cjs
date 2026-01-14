// Handle squirrel events for Windows installer
const electronSquirrelStart = require('electron-squirrel-startup');

if (electronSquirrelStart) {
  // If squirrel event was handled, exit the app
  process.exit(0);
}

// Only import Electron modules after checking squirrel events
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
        // On Windows, check for winget first, then chocolatey
        return this.checkCommandSync('winget --version') ? 'winget' : 
               this.checkCommandSync('choco --version') ? 'choco' : 'unknown';
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
      let fullCommand, shell, windowsVerbatimArguments;
      
      if (this.platform === 'win32') {
        // On Windows, use cmd.exe with /c flag for better compatibility
        // Escape special characters in the command
        const escapedCommand = command.replace(/&/g, '^&').replace(/</g, '^<').replace(/>/g, '^>');
        fullCommand = `cmd /c ${escapedCommand}`;
        shell = 'cmd.exe';
        windowsVerbatimArguments = true;
      } else {
        fullCommand = command;
        shell = this.platform === 'win32' ? 'cmd.exe' : 'bash';
      }
      console.log(`Executing sync command: ${fullCommand}`);
      require('child_process').execSync(fullCommand, { 
        stdio: 'pipe',
        shell: shell,
        windowsVerbatimArguments: windowsVerbatimArguments,
        env: { ...process.env }
      });
      return true;
    } catch (error) {
      console.log(`Sync command failed: ${error.message}`);
      return false;
    }
  }

  async checkCommand(command) {
    return new Promise((resolve) => {
      let fullCommand, shell, windowsVerbatimArguments;
      
      if (this.platform === 'win32') {
        // On Windows, use cmd.exe with /c flag for better compatibility
        // Escape special characters in the command
        const escapedCommand = command.replace(/&/g, '^&').replace(/</g, '^<').replace(/>/g, '^>');
        fullCommand = `cmd /c ${escapedCommand}`;
        shell = 'cmd.exe';
        windowsVerbatimArguments = true;
      } else {
        fullCommand = command;
        shell = this.platform === 'win32' ? 'cmd.exe' : 'bash';
      }
      console.log(`Executing async check command: ${fullCommand}`);
      exec(fullCommand, { 
        shell: shell,
        windowsVerbatimArguments: windowsVerbatimArguments,
        timeout: 10000, // Increased timeout for Windows commands
        env: { ...process.env }
      }, (error, stdout, stderr) => {
        console.log(`Check command result: success=${!error}, version="${stdout.trim()}"`);
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
      let fullCommand, shell, windowsVerbatimArguments;
      
      if (this.platform === 'win32') {
        // On Windows, use cmd.exe with /c flag for better compatibility
        // Also escape special characters and use proper quoting
        fullCommand = `cmd /c ${command}`;
        shell = 'cmd.exe';
        windowsVerbatimArguments = true;
      } else {
        fullCommand = command;
        shell = this.platform === 'win32' ? 'cmd.exe' : 'bash';
      }
      
      console.log(`Executing command: ${fullCommand}`);
      
      const child = exec(fullCommand, {
        shell: shell,
        windowsVerbatimArguments: windowsVerbatimArguments,
        maxBuffer: 1024 * 1024 * 10,
        timeout: options.timeout || 300000, // Increased default timeout to 5 minutes
        env: { ...process.env }, // Pass through environment variables
        ...options
      }, (error, stdout, stderr) => {
        console.log(`Command completed. Success: ${!error}, Error: ${error ? error.message : 'none'}`);
        console.log(`Stdout: ${stdout.substring(0, 500)}...`); // Limit output length
        if (stderr) console.log(`Stderr: ${stderr.substring(0, 500)}...`); // Limit output length
        
        resolve({
          success: !error,
          output: stdout,
          error: stderr,
          code: error ? error.code : 0
        });
      });

      if (options.onData) {
        child.stdout.on('data', (data) => {
          console.log(`Command output: ${data.toString().substring(0, 200)}...`);
          options.onData(data.toString());
        });
        child.stderr.on('data', (data) => {
          console.error(`Command error: ${data.toString().substring(0, 200)}...`);
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
        command = 'winget upgrade --all --silent'; // Added silent flag for better Windows experience
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

    // Log the detected OS for debugging
    console.log(`Installing Docker for platform: ${this.platform}`);

    switch(this.platform) {
      case 'darwin': // macOS
        console.log('Using Homebrew to install Docker Desktop for Mac...');
        command = 'brew install --cask docker';
        break;
      case 'win32': // Windows
        console.log(`Using ${this.packageManager} to install Docker Desktop for Windows...`);
        // Use more specific package IDs and handle already installed case
        // Note: winget doesn't have --overwrite, so we just use --force
        command = this.packageManager === 'winget'
          ? 'winget install --id Docker.DockerDesktop --accept-package-agreements --accept-source-agreements --silent --force'
          : 'choco install docker-desktop -y --force';
        break;
      case 'linux': // Linux
        console.log('Downloading and installing Docker for Linux...');
        command = 'curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh && rm get-docker.sh';
        break;
      default:
        return {
          success: false,
          message: `Unsupported platform: ${this.platform}`,
          output: '',
          error: `Installation not supported on ${this.platform}`
        };
    }

    const result = await this.executeCommand(command, { timeout: 600000 });
    
    // Check if the failure was due to already installed package
    if (!result.success) {
      if (result.error && (result.error.includes("already installed") || result.error.includes("No available upgrade"))) {
        console.log("Docker is already installed, treating as success");
        return {
          success: true,
          message: 'Docker is already installed',
          output: result.output,
          error: result.error
        };
      }
    }
    
    return {
      success: result.success,
      message: result.success ? 'Docker installed successfully' : 'Docker installation failed',
      output: result.output,
      error: result.error
    };
  }

  async installKubectl() {
    let command = '';

    // Log the detected OS for debugging
    console.log(`Installing kubectl for platform: ${this.platform}`);

    switch(this.platform) {
      case 'darwin': // macOS
        console.log('Using Homebrew to install kubectl for Mac...');
        command = 'brew install kubectl';
        break;
      case 'win32': // Windows
        console.log(`Using ${this.packageManager} to install kubectl for Windows...`);
        // Use more specific installation commands for Windows
        // Note: winget doesn't have --overwrite, so we just use --force
        command = this.packageManager === 'winget'
          ? 'winget install --id Kubernetes.kubectl --accept-package-agreements --accept-source-agreements --silent --force'
          : 'choco install kubernetes-cli -y';
        break;
      case 'linux': // Linux
        console.log('Downloading and installing kubectl for Linux...');
        if (this.packageManager === 'apt') {
          command = 'sudo apt-get update && sudo apt-get install -y kubectl';
        } else {
          command = 'curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && chmod +x kubectl && sudo install kubectl /usr/local/bin/ && rm kubectl';
        }
        break;
      default:
        return {
          success: false,
          message: `Unsupported platform: ${this.platform}`,
          output: '',
          error: `Installation not supported on ${this.platform}`
        };
    }

    const result = await this.executeCommand(command);
    
    // Check if the failure was due to already installed package
    if (!result.success) {
      if (result.error && (result.error.includes("already installed") || result.error.includes("No available upgrade"))) {
        console.log("kubectl is already installed, treating as success");
        return {
          success: true,
          message: 'kubectl is already installed',
          output: result.output,
          error: result.error
        };
      }
    }
    
    return {
      success: result.success,
      message: result.success ? 'kubectl installed successfully' : 'kubectl installation failed',
      output: result.output,
      error: result.error
    };
  }

  async installMinikube() {
    let command = '';

    // Log the detected OS for debugging
    console.log(`Installing Minikube for platform: ${this.platform}`);

    switch(this.platform) {
      case 'darwin': // macOS
        console.log('Using Homebrew to install Minikube for Mac...');
        command = 'brew install minikube';
        break;
      case 'win32': // Windows
        console.log(`Using ${this.packageManager} to install Minikube for Windows...`);
        // Use more specific installation commands for Windows
        // Note: winget doesn't have --overwrite, so we just use --force
        command = this.packageManager === 'winget'
          ? 'winget install --id Kubernetes.minikube --accept-package-agreements --accept-source-agreements --silent --force'
          : 'choco install minikube -y';
        break;
      case 'linux': // Linux
        console.log('Downloading and installing Minikube for Linux...');
        command = 'curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64 && chmod +x minikube-linux-amd64 && sudo install minikube-linux-amd64 /usr/local/bin/minikube && rm minikube-linux-amd64';
        break;
      default:
        return {
          success: false,
          message: `Unsupported platform: ${this.platform}`,
          output: '',
          error: `Installation not supported on ${this.platform}`
        };
    }

    const result = await this.executeCommand(command);
    
    // Check if the failure was due to already installed package
    if (!result.success) {
      if (result.error && (result.error.includes("already installed") || result.error.includes("No available upgrade"))) {
        console.log("Minikube is already installed, treating as success");
        return {
          success: true,
          message: 'Minikube is already installed',
          output: result.output,
          error: result.error
        };
      }
    }
    
    return {
      success: result.success,
      message: result.success ? 'Minikube installed successfully' : 'Minikube installation failed',
      output: result.output,
      error: result.error
    };
  }

  async installKind() {
    let command = '';

    // Log the detected OS for debugging
    console.log(`Installing Kind for platform: ${this.platform}`);

    switch(this.platform) {
      case 'darwin': // macOS
        console.log('Using Homebrew to install Kind for Mac...');
        command = 'brew install kind';
        break;
      case 'win32': // Windows
        console.log(`Using ${this.packageManager} to install Kind for Windows...`);
        // Use more specific installation commands for Windows
        // Note: winget doesn't have --overwrite, so we just use --force
        command = this.packageManager === 'winget'
          ? 'winget install --id Kubernetes.Kind --accept-package-agreements --accept-source-agreements --silent --force'
          : 'choco install kind -y';
        break;
      case 'linux': // Linux
        console.log('Downloading and installing Kind for Linux...');
        command = 'curl -Lo kind "https://kind.sigs.k8s.io/dl/latest/kind-linux-amd64" && chmod +x kind && sudo install kind /usr/local/bin/ && rm kind';
        break;
      default:
        return {
          success: false,
          message: `Unsupported platform: ${this.platform}`,
          output: '',
          error: `Installation not supported on ${this.platform}`
        };
    }

    const result = await this.executeCommand(command);
    
    // Check if the failure was due to already installed package
    if (!result.success) {
      if (result.error && (result.error.includes("already installed") || result.error.includes("No available upgrade"))) {
        console.log("Kind is already installed, treating as success");
        return {
          success: true,
          message: 'Kind is already installed',
          output: result.output,
          error: result.error
        };
      }
    }
    
    return {
      success: result.success,
      message: result.success ? 'Kind installed successfully' : 'Kind installation failed',
      output: result.output,
      error: result.error
    };
  }

  async installHelm() {
    let command = '';

    // Log the detected OS for debugging
    console.log(`Installing Helm for platform: ${this.platform}`);

    switch(this.platform) {
      case 'darwin': // macOS
        console.log('Using Homebrew to install Helm for Mac...');
        command = 'brew install helm';
        break;
      case 'win32': // Windows
        console.log(`Using ${this.packageManager} to install Helm for Windows...`);
        // Use more specific installation commands for Windows
        // Note: winget doesn't have --overwrite, so we just use --force
        command = this.packageManager === 'winget'
          ? 'winget install --id Helm.Helm --accept-package-agreements --accept-source-agreements --silent --force'
          : 'choco install kubernetes-helm -y';
        break;
      case 'linux': // Linux
        console.log('Downloading and installing Helm for Linux...');
        command = 'curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash';
        break;
      default:
        return {
          success: false,
          message: `Unsupported platform: ${this.platform}`,
          output: '',
          error: `Installation not supported on ${this.platform}`
        };
    }

    const result = await this.executeCommand(command);
    
    // Check if the failure was due to already installed package
    if (!result.success) {
      if (result.error && (result.error.includes("already installed") || result.error.includes("No available upgrade"))) {
        console.log("Helm is already installed, treating as success");
        return {
          success: true,
          message: 'Helm is already installed',
          output: result.output,
          error: result.error
        };
      }
    }
    
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

// Initialize Electron app
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
