# Kubernetes Multi-OS Installer

A cross-platform Electron.js GUI application that automates Kubernetes setup on Windows, macOS, and Linux systems.

## Features

- **Automatic OS Detection**: Detects Windows, macOS, or Linux and uses the appropriate package manager
- **Smart Package Manager Selection**:
  - **Windows**: Winget or Chocolatey
  - **macOS**: Homebrew
  - **Linux**: APT, YUM, DNF, or Pacman
- **Component Installation**:
  - Docker/containerd
  - kubectl CLI
  - Minikube or Kind (local Kubernetes clusters)
  - Helm (optional)
  - Git
- **Step-by-Step Wizard**: User-friendly installation flow with progress tracking
- **Installation Verification**: Checks and verifies all installed components
- **Real-time Logging**: Monitor installation progress in real-time

## Prerequisites

Before running the installer, ensure you have:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- Internet connection for downloading packages

### Platform-Specific Prerequisites

#### macOS
- macOS 10.15 or higher
- Administrator access for installations

#### Windows
- Windows 10 or higher
- Administrator privileges
- PowerShell 5.1 or higher

#### Linux
- Ubuntu 20.04+, Fedora 35+, or Arch Linux
- sudo privileges
- Package manager (apt, yum, dnf, or pacman)

## Installation

### Clone and Install Dependencies

```bash
git clone <repository-url>
cd kubernetes-multios-installer
npm install
```

## Development

### Run in Development Mode

```bash
npm run electron:dev
```

This will:
1. Start the Vite development server on port 5173
2. Launch the Electron application
3. Enable hot module replacement for the renderer process

### Build for Production

#### Build for Current Platform

```bash
npm run build
```

#### Build for Specific Platforms

```bash
# macOS (DMG and ZIP)
npm run build:mac

# Windows (NSIS installer and Portable)
npm run build:win

# Linux (AppImage, DEB, and RPM)
npm run build:linux
```

Built applications will be in the `dist-electron` directory.

## Application Structure

```
kubernetes-multios-installer/
├── electron/                  # Electron main process
│   ├── main.cjs              # Main process with installer logic
│   └── preload.cjs           # Preload script for IPC
├── src/                      # React renderer process
│   ├── components/           # React components
│   │   ├── ProgressBar.tsx
│   │   ├── InstallationLog.tsx
│   │   └── steps/           # Wizard step components
│   │       ├── WelcomeStep.tsx
│   │       ├── OSDetectionStep.tsx
│   │       ├── PrerequisitesStep.tsx
│   │       ├── InstallationStep.tsx
│   │       ├── ClusterSetupStep.tsx
│   │       └── VerificationStep.tsx
│   ├── types.ts             # TypeScript definitions
│   ├── App.tsx              # Main application component
│   └── main.tsx             # React entry point
├── dist/                    # Built web assets
├── dist-electron/           # Built Electron applications
└── package.json
```

## Usage

### Running the Application

1. **Launch the Installer**
   - Run the built executable for your platform
   - Or use `npm run electron:dev` for development

2. **Follow the Wizard Steps**:
   - **Step 1: Welcome** - Introduction to the installer
   - **Step 2: OS Detection** - Automatic system detection
   - **Step 3: Prerequisites Check** - Scan for existing components
   - **Step 4: Installation** - Install missing components
   - **Step 5: Cluster Setup** - Start Minikube or Kind
   - **Step 6: Verification** - Verify the installation

3. **Monitor Progress**
   - Real-time logs show installation progress
   - Progress bar tracks your position in the wizard

### Post-Installation

After successful installation, you can:

1. **Check cluster status**:
   ```bash
   kubectl get nodes
   kubectl cluster-info
   ```

2. **Deploy your first application**:
   ```bash
   kubectl create deployment hello-world --image=nginx
   kubectl expose deployment hello-world --type=NodePort --port=80
   ```

3. **Access Kubernetes Dashboard** (Minikube):
   ```bash
   minikube dashboard
   ```

## Component Details

### Docker
- **macOS**: Docker Desktop via Homebrew Cask
- **Windows**: Docker Desktop via Winget/Chocolatey
- **Linux**: Docker Engine via get.docker.com script

### kubectl
- **macOS**: Via Homebrew
- **Windows**: Via Winget/Chocolatey
- **Linux**: Via package manager or direct download

### Minikube
- Local single-node Kubernetes cluster
- Includes dashboard
- Great for learning and development

### Kind
- Kubernetes in Docker
- Supports multi-node clusters
- Fast and lightweight
- CI/CD friendly

## Troubleshooting

### Installation Failures

If a component fails to install:

1. **Check the installation log** for error details
2. **Verify internet connection**
3. **Ensure you have administrator/sudo privileges**
4. **Try manual installation** of the failed component
5. **Restart the installer** and try again

### Common Issues

#### macOS: "command not found" after Homebrew installation
```bash
# Add Homebrew to PATH
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
source ~/.zprofile
```

#### Windows: Winget not available
- Ensure Windows is up to date (Windows 10 1809+)
- Install from Microsoft Store
- Alternatively, the installer will fallback to Chocolatey

#### Linux: Permission denied
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

#### Cluster won't start
```bash
# Reset and try again
minikube delete
minikube start

# For Kind
kind delete cluster
kind create cluster
```

## Security Considerations

- **Elevated Privileges**: Some installations require administrator/sudo access
- **Code Signing**: Production builds should be code-signed for your platform
- **Download Verification**: All packages are downloaded from official sources
- **Secure IPC**: Uses Electron's contextBridge for secure communication

## Technical Stack

- **Electron**: Cross-platform desktop framework
- **React**: UI framework
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **electron-builder**: Multi-platform packaging
- **electron-store**: Persistent configuration storage

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on your target platform
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing issues for solutions
- Consult Kubernetes official documentation

## Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/home/)
- [Minikube Documentation](https://minikube.sigs.k8s.io/docs/)
- [Kind Documentation](https://kind.sigs.k8s.io/)
- [Docker Documentation](https://docs.docker.com/)
- [kubectl Reference](https://kubernetes.io/docs/reference/kubectl/)

## Version History

### v1.0.0 (Current)
- Initial release
- Support for Windows, macOS, and Linux
- Automated installation of Docker, kubectl, Minikube/Kind
- Step-by-step wizard interface
- Real-time installation logging
- Installation verification
