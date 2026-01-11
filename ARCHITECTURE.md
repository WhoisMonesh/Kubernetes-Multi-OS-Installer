# Architecture Documentation

## Overview

The Kubernetes Multi-OS Installer is built using Electron.js, combining Node.js for system operations with React for the user interface. This document explains the technical architecture, design decisions, and implementation details.

## Technology Stack

### Core Technologies

- **Electron 28**: Cross-platform desktop framework
- **Node.js**: Backend runtime for system operations
- **React 18**: UI library for the renderer process
- **TypeScript**: Type-safe development
- **Vite 5**: Fast build tool and development server
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Modern icon library

### Development Tools

- **electron-builder**: Package and distribute the application
- **electron-store**: Persistent storage for user preferences
- **concurrently**: Run multiple commands simultaneously
- **wait-on**: Wait for resources before starting

## Application Architecture

### Three-Process Model

Electron applications use a multi-process architecture:

```
┌─────────────────────────────────────────┐
│         Main Process (Node.js)          │
│  - OS detection                         │
│  - Installation logic                   │
│  - System commands execution            │
│  - IPC handlers                         │
└──────────────────┬──────────────────────┘
                   │
                   │ IPC Communication
                   │
┌──────────────────┴──────────────────────┐
│       Renderer Process (Chromium)       │
│  - React UI                             │
│  - User interactions                    │
│  - State management                     │
│  - Progress visualization               │
└──────────────────┬──────────────────────┘
                   │
                   │ Context Bridge
                   │
┌──────────────────┴──────────────────────┐
│         Preload Script (Isolated)       │
│  - Secure IPC bridge                    │
│  - API exposure                         │
│  - Security boundary                    │
└─────────────────────────────────────────┘
```

### Main Process (`electron/main.cjs`)

The main process is the application's entry point and handles:

#### 1. Window Management
```javascript
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,      // Security
      contextIsolation: true,      // Security
      preload: path.join(__dirname, 'preload.cjs')
    }
  });
}
```

#### 2. Installer Class

The `KubernetesInstaller` class encapsulates all installation logic:

```javascript
class KubernetesInstaller {
  constructor() {
    this.platform = os.platform();        // darwin, win32, linux
    this.architecture = os.arch();        // x64, arm64
    this.packageManager = this.detectPackageManager();
  }

  detectPackageManager() {
    // Returns: homebrew, winget, choco, apt, yum, dnf, pacman
  }

  async checkPrerequisites() {
    // Checks for: docker, kubectl, helm, git, minikube, kind
  }

  async installComponent(component) {
    // Platform-specific installation logic
  }
}
```

#### 3. IPC Handlers

IPC (Inter-Process Communication) handlers respond to renderer requests:

```javascript
ipcMain.handle('detect-os', async () => {
  return {
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length,
    memory: Math.round(os.totalmem() / 1024 / 1024 / 1024)
  };
});

ipcMain.handle('install-component', async (event, component) => {
  const installer = new KubernetesInstaller();
  return await installer.installComponent(component);
});
```

### Preload Script (`electron/preload.cjs`)

The preload script creates a secure bridge between main and renderer:

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  detectOS: () => ipcRenderer.invoke('detect-os'),
  installComponent: (component) => ipcRenderer.invoke('install-component', component),
  // ... other methods
});
```

**Security Benefits:**
- Renderer cannot access Node.js APIs directly
- Only explicitly exposed functions are available
- Prevents XSS attacks from accessing system resources

### Renderer Process (`src/`)

The renderer process is a React application with a wizard-based UI.

#### Component Hierarchy

```
App.tsx (Root)
├── ProgressBar
├── InstallationLog
└── Steps (conditional rendering)
    ├── WelcomeStep
    ├── OSDetectionStep
    ├── PrerequisitesStep
    ├── InstallationStep
    ├── ClusterSetupStep
    └── VerificationStep
```

#### State Management

State is managed using React hooks at the App level:

```typescript
const [currentStep, setCurrentStep] = useState(1);
const [logs, setLogs] = useState<string[]>([]);
const [osInfo, setOSInfo] = useState<OSInfo | null>(null);
const [prerequisites, setPrerequisites] = useState<PrerequisitesCheck | null>(null);
```

#### Step Components

Each step is a self-contained React component:

```typescript
interface StepProps {
  onNext: () => void;
  onLog?: (message: string) => void;
  // ... step-specific props
}

export const InstallationStep: React.FC<StepProps> = ({ onNext, onLog }) => {
  // Step implementation
};
```

## Installation Flow

### 1. OS Detection Flow

```
User Opens App
     ↓
Main Process: Detect OS
     ↓
Return: platform, arch, cpus, memory
     ↓
Renderer: Display system info
     ↓
Main Process: Detect package manager
     ↓
Return: packageManager (homebrew, apt, etc.)
     ↓
Renderer: Show detected package manager
```

### 2. Prerequisites Check Flow

```
User Clicks "Continue"
     ↓
Renderer: Request prerequisites check
     ↓
Main Process: Execute version commands
     ├─ docker --version
     ├─ kubectl version --client
     ├─ helm version
     ├─ git --version
     ├─ minikube version
     └─ kind version
     ↓
Main Process: Parse results
     ↓
Return: { docker: {installed, version}, ... }
     ↓
Renderer: Display results with checkmarks/X marks
```

### 3. Installation Flow

```
User Clicks "Continue"
     ↓
Renderer: Determine missing components
     ↓
For each missing component:
     ├─ Update UI: "Installing..."
     ├─ Send IPC: install-component(name)
     ├─ Main Process: Execute install command
     │   ├─ macOS: brew install <package>
     │   ├─ Windows: winget install <package>
     │   └─ Linux: apt/yum install <package>
     ├─ Main Process: Monitor output
     ├─ Send logs to renderer
     ├─ Return: {success, message, output}
     └─ Update UI: "Success" or "Failed"
     ↓
All components processed
     ↓
Renderer: Enable "Continue" button
```

### 4. Command Execution Flow

```javascript
async executeCommand(command, options = {}) {
  return new Promise((resolve) => {
    const child = exec(command, {
      shell: true,
      maxBuffer: 10MB,
      timeout: 5 minutes
    });

    // Stream output back to renderer
    child.stdout.on('data', (data) => {
      options.onData?.(data.toString());
    });

    // Handle completion
    child.on('close', (code) => {
      resolve({
        success: code === 0,
        output: stdout,
        error: stderr
      });
    });
  });
}
```

## Platform-Specific Implementation

### macOS

**Package Manager**: Homebrew

```javascript
async installDocker() {
  return 'brew install --cask docker';
}

async installKubectl() {
  return 'brew install kubectl';
}

async installMinikube() {
  return 'brew install minikube';
}
```

**Special Considerations:**
- Homebrew installation required first
- Cask for GUI applications (Docker Desktop)
- ARM64 (Apple Silicon) vs x64 support

### Windows

**Package Managers**: Winget (preferred) or Chocolatey (fallback)

```javascript
async installDocker() {
  return this.packageManager === 'winget'
    ? 'winget install Docker.DockerDesktop'
    : 'choco install docker-desktop -y';
}

async installKubectl() {
  return this.packageManager === 'winget'
    ? 'winget install Kubernetes.kubectl'
    : 'choco install kubernetes-cli -y';
}
```

**Special Considerations:**
- Administrator privileges required
- PowerShell execution policy
- Windows Subsystem for Linux (WSL2) for Docker
- PATH configuration

### Linux

**Package Managers**: apt, yum, dnf, or pacman

```javascript
detectLinuxPackageManager() {
  if (fs.existsSync('/etc/debian_version')) return 'apt';
  if (fs.existsSync('/etc/redhat-release')) return 'yum';
  if (fs.existsSync('/etc/arch-release')) return 'pacman';
  if (this.checkCommandSync('dnf --version')) return 'dnf';
  return 'unknown';
}

async installDocker() {
  // Use official Docker installation script
  return 'curl -fsSL https://get.docker.com -o /tmp/get-docker.sh && sudo sh /tmp/get-docker.sh';
}

async installKubectl() {
  if (this.packageManager === 'apt') {
    return 'sudo apt-get update && sudo apt-get install -y kubectl';
  } else {
    // Direct download for other distributions
    return 'curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl';
  }
}
```

**Special Considerations:**
- sudo privileges required
- Distribution-specific package names
- Docker group permissions
- SystemD service management

## Security Architecture

### Context Isolation

```javascript
webPreferences: {
  nodeIntegration: false,      // Disable Node.js in renderer
  contextIsolation: true,      // Isolate preload context
  sandbox: true,               // Enable Chromium sandbox
  preload: path.join(__dirname, 'preload.cjs')
}
```

### IPC Security

All IPC communication goes through the preload script:

```javascript
// SECURE: Via preload
window.electronAPI.installComponent('docker');

// INSECURE: Direct Node.js (disabled)
// require('child_process').exec('docker install');  ❌
```

### Command Execution

Commands are executed with safeguards:

```javascript
async executeCommand(command, options = {}) {
  return new Promise((resolve) => {
    exec(command, {
      shell: true,
      maxBuffer: 1024 * 1024 * 10,    // 10MB limit
      timeout: options.timeout || 300000,  // 5 minute timeout
    }, (error, stdout, stderr) => {
      // Never expose raw error objects to renderer
      resolve({
        success: !error,
        message: error ? stderr : 'Success',
        output: stdout
      });
    });
  });
}
```

### Input Sanitization

Component names are validated:

```javascript
ipcMain.handle('install-component', async (event, component) => {
  const allowedComponents = ['docker', 'kubectl', 'minikube', 'kind', 'helm'];

  if (!allowedComponents.includes(component)) {
    return { success: false, message: 'Invalid component' };
  }

  const installer = new KubernetesInstaller();
  return await installer.installComponent(component);
});
```

## Build System

### Development Build

```bash
npm run electron:dev
```

Flow:
1. Vite starts dev server on port 5173
2. wait-on waits for server to be ready
3. Electron launches and loads http://localhost:5173
4. Hot module replacement enabled

### Production Build

```bash
npm run build
```

Flow:
1. Vite builds React app to `dist/`
2. electron-builder packages everything:
   - Bundles Electron with app
   - Creates platform-specific installers
   - Code signs (if configured)
   - Outputs to `dist-electron/`

### Build Configuration

```json
{
  "build": {
    "appId": "com.kubernetes.installer",
    "directories": {
      "output": "dist-electron"
    },
    "files": [
      "dist/**/*",       // Built web app
      "electron/**/*",   // Main process
      "package.json"
    ],
    "mac": {
      "target": ["dmg", "zip"]
    },
    "win": {
      "target": ["nsis", "portable"]
    },
    "linux": {
      "target": ["AppImage", "deb"]
    }
  }
}
```

## Error Handling

### Main Process

```javascript
ipcMain.handle('install-component', async (event, component) => {
  try {
    const installer = new KubernetesInstaller();
    return await installer.installComponent(component);
  } catch (error) {
    console.error('Installation error:', error);
    return {
      success: false,
      message: error.message,
      error: error.stack
    };
  }
});
```

### Renderer Process

```typescript
const installComponent = async (component: string) => {
  try {
    const result = await window.electronAPI.installComponent(component);

    if (result.success) {
      updateStatus('success', result.message);
    } else {
      updateStatus('error', result.message);
    }
  } catch (error) {
    updateStatus('error', 'Unexpected error occurred');
    console.error(error);
  }
};
```

## Performance Considerations

### Command Execution

- **Timeout**: 5 minutes default, configurable
- **Buffer Size**: 10MB max output
- **Streaming**: Output streamed to renderer in real-time

### UI Responsiveness

- **Async Operations**: All system commands are async
- **Progress Updates**: Real-time feedback during installation
- **Non-blocking**: UI remains responsive during installations

### Memory Management

- **Log Limits**: Installation logs capped at reasonable size
- **Resource Cleanup**: Child processes properly terminated
- **State Management**: Minimal state in renderer

## Testing Strategy

### Unit Tests

Test individual installer functions:

```javascript
describe('KubernetesInstaller', () => {
  test('detectPackageManager on macOS', () => {
    const installer = new KubernetesInstaller();
    expect(installer.packageManager).toBe('homebrew');
  });

  test('checkCommand returns installed status', async () => {
    const result = await installer.checkCommand('docker --version');
    expect(result).toHaveProperty('installed');
    expect(result).toHaveProperty('version');
  });
});
```

### Integration Tests

Test IPC communication:

```javascript
test('IPC: install-component returns result', async () => {
  const result = await ipcRenderer.invoke('install-component', 'kubectl');
  expect(result).toHaveProperty('success');
  expect(result).toHaveProperty('message');
});
```

### End-to-End Tests

Test complete installation flow:

```javascript
test('Complete installation flow', async () => {
  // Detect OS
  const osInfo = await electronAPI.detectOS();
  expect(osInfo.platform).toBeDefined();

  // Check prerequisites
  const prereqs = await electronAPI.checkPrerequisites();
  expect(prereqs.docker).toBeDefined();

  // Install component
  const result = await electronAPI.installComponent('kubectl');
  expect(result.success).toBe(true);
});
```

## Future Enhancements

### Planned Features

1. **Offline Mode**: Cache installation packages
2. **Custom Configuration**: Save/load installation preferences
3. **Multiple Cluster Types**: Support K3s, MicroK8s
4. **Update Mechanism**: Auto-update the installer
5. **Proxy Support**: Configure HTTP/HTTPS proxy
6. **Uninstall Feature**: Remove installed components
7. **Resource Monitoring**: Show disk space, network usage
8. **Multi-language**: i18n support
9. **Telemetry**: Anonymous usage statistics
10. **Plugin System**: Extend with custom installers

### Architecture Improvements

1. **Plugin Architecture**: Modular installer plugins
2. **State Machine**: Formal state management for wizard
3. **Undo/Rollback**: Revert failed installations
4. **Dependency Graph**: Visualize component dependencies
5. **Parallel Installation**: Install independent components simultaneously

## Debugging

### Development Tools

```javascript
// In development mode
if (isDev) {
  mainWindow.webContents.openDevTools();
  console.log('Development mode enabled');
}
```

### Logging

```javascript
// Main process
console.log('[Main]', 'Message');

// Renderer process
console.log('[Renderer]', 'Message');

// Installation log (visible to user)
onLog(`Installing ${component}...`);
```

### IPC Debugging

```javascript
// Log all IPC calls
ipcMain.on('*', (event, channel, ...args) => {
  console.log('[IPC]', channel, args);
});
```

## Contributing

### Code Style

- TypeScript for type safety
- Functional components with hooks
- Async/await for promises
- Error boundaries in React
- Comprehensive error handling

### Git Workflow

1. Fork repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request
5. Code review
6. Merge to main

### Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Build for all platforms
4. Test on target systems
5. Create GitHub release
6. Upload artifacts
7. Update documentation

---

This architecture document provides a comprehensive overview of the application's design and implementation. For specific implementation details, refer to the source code and inline documentation.
