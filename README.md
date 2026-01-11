# Kubernetes Multi-OS Installer

> 🚀 **One-Click Kubernetes Setup for Windows, macOS, and Linux**

A user-friendly desktop application that automatically installs and configures Kubernetes on your computer - no command line experience needed!

## 📖 What is This?

This application helps you set up Kubernetes (a container management system) on your computer with just a few clicks. Whether you're on Windows, macOS, or Linux, this installer will:

✅ Detect your operating system automatically  
✅ Install all required software (Docker, kubectl, Minikube/Kind)  
✅ Configure everything for you  
✅ Verify the installation works correctly  

Perfect for developers, students, and anyone learning Kubernetes!

## ✨ Features

- **🖥️ Automatic OS Detection**: Detects Windows, macOS, or Linux and uses the appropriate package manager
- **📦 Smart Package Manager Selection**:
  - **Windows**: Winget or Chocolatey
  - **macOS**: Homebrew
  - **Linux**: APT, YUM, DNF, or Pacman
- **⚙️ Complete Installation**:
  - Docker/containerd (container runtime)
  - kubectl CLI (Kubernetes command-line tool)
  - Minikube or Kind (local Kubernetes clusters)
  - Helm (optional package manager)
  - Git (version control)
- **🧙 Step-by-Step Wizard**: User-friendly installation flow with progress tracking
- **✔️ Installation Verification**: Checks and verifies all installed components
- **📊 Real-time Logging**: Monitor installation progress in real-time

## 🔧 System Requirements

### Minimum Requirements (All Platforms)
- **Node.js** v18 or higher
- **npm** v9 or higher
- **Internet connection** for downloading packages
- **4GB RAM** minimum (8GB recommended)
- **10GB free disk space**

### Platform-Specific Requirements

#### 🍎 macOS
- macOS 10.15 (Catalina) or higher
- Administrator access

#### 🪟 Windows
- Windows 10 (version 1809+) or Windows 11
- Administrator privileges
- PowerShell 5.1 or higher
- **Note**: Virtualization must be enabled in BIOS

#### 🐧 Linux
- Ubuntu 20.04+, Fedora 35+, or Arch Linux
- sudo privileges
- One of these package managers: apt, yum, dnf, or pacman

## 🚀 Quick Start Guide

### Step 1: Install Node.js

If you don't have Node.js installed:

**Windows/macOS**: Download from [nodejs.org](https://nodejs.org)  
**Linux (Ubuntu/Debian)**:
```bash
sudo apt update
sudo apt install nodejs npm
```

### Step 2: Download This Project

Open your terminal (Command Prompt on Windows, Terminal on macOS/Linux) and run:

```bash
# Clone the repository
git clone https://github.com/WhoisMonesh/Kubernetes-Multi-OS-Installer.git

# Enter the project directory
cd Kubernetes-Multi-OS-Installer

# Install dependencies
npm install
```

### Step 3: Run the Installer

```bash
npm run electron:dev
```

A window will open - just follow the on-screen instructions! 🎉

## 💻 For Developers

### Development Mode

Run the app in development mode with hot-reload:

```bash
npm run electron:dev
```

This will:
1. Start the Vite development server on port 5173
2. Launch the Electron application
3. Enable hot module replacement for instant updates

### Building the Application

#### Build for Your Current Platform

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

## 📂 Project Structure

```
kubernetes-multios-installer/
├── electron/              # Main Electron process
│   ├── main.cjs          # Main process with installer logic
│   └── preload.cjs       # Secure IPC bridge
├── src/                   # React UI
│   ├── components/       # React components
│   │   ├── ProgressBar.tsx
│   │   ├── InstallationLog.tsx
│   │   └── steps/        # Wizard steps
│   ├── App.tsx           # Main app component
│   └── main.tsx          # React entry point
├── package.json          # Dependencies
└── README.md             # This file
```

## 📋 How to Use

### Step-by-Step Instructions

1. **Launch the Application**
   - Run `npm run electron:dev` (development)
   - Or use the built executable for your platform

2. **Follow the Installation Wizard**:
   - **Step 1: Welcome** - Introduction and overview
   - **Step 2: OS Detection** - Automatic system detection
   - **Step 3: Prerequisites Check** - Scans for existing software
   - **Step 4: Installation** - Installs missing components
   - **Step 5: Cluster Setup** - Starts your Kubernetes cluster
   - **Step 6: Verification** - Confirms everything works

3. **Monitor Progress**
   - Watch real-time logs in the installation window
   - Progress bar shows your current step

### After Installation

Once installation is complete, verify it worked:

```bash
# Check if Kubernetes is running
kubectl get nodes

# View cluster information
kubectl cluster-info
```

### Deploy Your First App

Try deploying a simple web server:

```bash
# Create a deployment
kubectl create deployment hello-world --image=nginx

# Expose it as a service
kubectl expose deployment hello-world --type=NodePort --port=80

# Check if it's running
kubectl get pods
```

### Access Kubernetes Dashboard (Minikube)

If you installed Minikube, you can access a web dashboard:

```bash
minikube dashboard
```

## 🔍 What Gets Installed?

### Docker
**What it is**: Software that runs containers (lightweight virtual environments)
- **macOS**: Docker Desktop via Homebrew
- **Windows**: Docker Desktop via Winget/Chocolatey
- **Linux**: Docker Engine via official script

### kubectl
**What it is**: Command-line tool to control Kubernetes clusters
- Installed via your system's package manager
- Lets you deploy apps, inspect resources, and view logs

### Minikube
**What it is**: Runs a single-node Kubernetes cluster on your laptop
- Perfect for learning and testing
- Includes a web dashboard
- Lightweight and easy to use

### Kind (Kubernetes in Docker)
**What it is**: Alternative to Minikube that runs inside Docker
- Supports multi-node clusters
- Fast and lightweight
- Great for CI/CD pipelines

## ❓ Troubleshooting

### Installation Fails

If something goes wrong:

1. **Check the logs** in the installer window for error details
2. **Verify internet connection** - packages download from the internet
3. **Run as administrator/sudo** - some installations need elevated permissions
4. **Check disk space** - ensure you have at least 10GB free
5. **Try again** - restart the installer and retry

### Common Issues

#### macOS: "command not found" after installation

**Solution**: Add Homebrew to your PATH

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
source ~/.zprofile
```

#### Windows: "Winget not available"

**Solution**: Update Windows or install from Microsoft Store
- Ensure Windows is up to date (Windows 10 1809+)
- Install "App Installer" from Microsoft Store
- Or the installer will automatically use Chocolatey instead

#### Linux: "Permission denied" when using Docker

**Solution**: Add your user to the docker group

```bash
sudo usermod -aG docker $USER
newgrp docker
```

#### Cluster won't start

**Solution**: Reset and try again

```bash
# For Minikube
minikube delete
minikube start

# For Kind
kind delete cluster
kind create cluster
```

#### Windows: "Virtualization not enabled"

**Solution**: Enable virtualization in BIOS
1. Restart your computer
2. Enter BIOS (usually F2, F10, or Del during startup)
3. Look for "Virtualization Technology" or "VT-x"
4. Enable it and save

## 🔒 Security & Privacy

- **Elevated Privileges**: Some components require administrator/sudo access
- **Official Sources**: All packages downloaded from official repositories only
- **Secure Communication**: Uses Electron's contextBridge for safe IPC
- **No Data Collection**: This installer doesn't collect or send any personal data
- **Open Source**: All code is visible for inspection

## 🛠️ Technology Stack

- **Electron** - Cross-platform desktop framework
- **React** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **Tailwind CSS** - Modern styling
- **Lucide React** - Beautiful icons
- **electron-builder** - Application packaging

## 🤝 Contributing

Contributions are welcome! Here's how:

1. **Fork** this repository
2. **Create a branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Test** on your target platform
5. **Commit** (`git commit -m 'Add amazing feature'`)
6. **Push** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

## 💬 Support & Help

Need help? Here's where to go:

- **🐛 Found a bug?** [Open an issue](https://github.com/WhoisMonesh/Kubernetes-Multi-OS-Installer/issues)
- **❓ Have a question?** [Check existing issues](https://github.com/WhoisMonesh/Kubernetes-Multi-OS-Installer/issues) first
- **📖 Learn Kubernetes** Check the resources below

## 📚 Learning Resources

New to Kubernetes? Start here:

- 📘 [Kubernetes Basics](https://kubernetes.io/docs/tutorials/kubernetes-basics/) - Official tutorial
- 📗 [Minikube Tutorial](https://minikube.sigs.k8s.io/docs/start/) - Learn Minikube
- 📕 [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/) - Common commands
- 📙 [Docker Tutorial](https://docs.docker.com/get-started/) - Learn containers
- 📔 [Kind Quick Start](https://kind.sigs.k8s.io/docs/user/quick-start/) - Kind basics

## 🎯 Roadmap

### v1.0.0 (Current) ✅
- ✅ Support for Windows, macOS, and Linux
- ✅ Automated installation of Docker, kubectl, Minikube/Kind
- ✅ Step-by-step wizard interface
- ✅ Real-time installation logging
- ✅ Installation verification

### v1.1.0 (Planned)
- [ ] Support for more Linux distributions
- [ ] Custom installation options
- [ ] Kubernetes version selection
- [ ] Installation profiles (minimal, full, custom)
- [ ] Offline installation support

## 🙏 Acknowledgments

Built with ❤️ using these amazing projects:
- [Kubernetes](https://kubernetes.io/)
- [Docker](https://www.docker.com/)
- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)

---

⭐ **Star this repository** if you find it helpful!  
🐦 **Share it** with others learning Kubernetes!  
🤝 **Contribute** to make it even better!
