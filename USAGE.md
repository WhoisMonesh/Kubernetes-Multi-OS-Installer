# Kubernetes Multi-OS Installer - Usage Guide

## Quick Start

### Development Mode

To run the application in development mode with hot-reloading:

```bash
npm install
npm run electron:dev
```

This will start both the Vite development server and the Electron application.

### Production Build

To build the application for your current platform:

```bash
npm run build
```

The built files will be in the `dist-electron` directory.

## Installation Wizard Steps

### Step 1: Welcome Screen

The welcome screen introduces you to the installer and explains what will be installed:

- Docker (container runtime)
- kubectl (Kubernetes CLI)
- Minikube or Kind (local cluster)
- Helm (optional package manager)

Click "Start Installation" to begin.

### Step 2: OS Detection

The installer automatically detects:
- Operating system (Windows, macOS, Linux)
- Architecture (x64, arm64)
- Available RAM and CPU cores
- Package manager (Homebrew, Winget, APT, etc.)

This information is used to determine the best installation method for your system.

### Step 3: Prerequisites Check

The installer scans your system for existing installations:
- ✓ Green checkmark: Component already installed
- ✗ Gray X: Component not installed

The installer will only install missing components.

### Step 4: Component Installation

This step installs all missing components:

1. **Package Manager Setup** (macOS only)
   - Installs Homebrew if not present
   - Updates package cache

2. **Docker Installation**
   - macOS: Docker Desktop via Homebrew
   - Windows: Docker Desktop via Winget/Chocolatey
   - Linux: Docker Engine via official script

3. **kubectl Installation**
   - Downloads and installs the latest stable version
   - Configures PATH automatically

4. **Cluster Tool Installation**
   - Installs Minikube (default)
   - Can also install Kind

5. **Helm Installation** (optional)
   - Kubernetes package manager
   - Useful for deploying applications

### Step 5: Cluster Setup

Choose between two cluster options:

#### Minikube (Recommended)
- Best for beginners
- Includes web dashboard
- Single-node cluster
- Easy to use

Click "Start minikube Cluster" to create your cluster.

#### Kind
- Kubernetes in Docker
- Faster startup
- Supports multi-node clusters
- Great for CI/CD

Click "Start kind Cluster" to create your cluster.

### Step 6: Verification

The final step verifies your installation:

- ✓ Docker is running
- ✓ kubectl is configured
- ✓ Kubernetes cluster is accessible

If all checks pass, you'll see "Installation Complete!" with next steps.

## Post-Installation

### Verify Installation

Open a terminal and run:

```bash
kubectl version --client
kubectl get nodes
kubectl cluster-info
```

### Deploy Your First Application

```bash
kubectl create deployment hello-nginx --image=nginx
kubectl expose deployment hello-nginx --type=NodePort --port=80
```

Check the deployment:

```bash
kubectl get deployments
kubectl get pods
kubectl get services
```

### Access Minikube Dashboard

If you installed Minikube:

```bash
minikube dashboard
```

This opens a web-based dashboard in your browser.

### Get Service URL

For Minikube:

```bash
minikube service hello-nginx
```

For Kind:

```bash
kubectl port-forward service/hello-nginx 8080:80
# Then visit http://localhost:8080
```

## Common Commands

### Cluster Management

```bash
# Start cluster
minikube start
kind create cluster

# Stop cluster
minikube stop
kind delete cluster

# Check cluster status
kubectl cluster-info
kubectl get nodes

# View cluster details
minikube status
kind get clusters
```

### Application Deployment

```bash
# Create deployment
kubectl create deployment my-app --image=nginx

# Expose service
kubectl expose deployment my-app --port=80 --type=NodePort

# Scale deployment
kubectl scale deployment my-app --replicas=3

# Delete deployment
kubectl delete deployment my-app
```

### Viewing Resources

```bash
# List all resources
kubectl get all

# Get pods
kubectl get pods
kubectl get pods -o wide

# Get services
kubectl get services

# Get deployments
kubectl get deployments

# Describe resource
kubectl describe pod <pod-name>
kubectl describe service <service-name>
```

### Logs and Debugging

```bash
# View pod logs
kubectl logs <pod-name>

# Follow logs in real-time
kubectl logs -f <pod-name>

# Execute command in pod
kubectl exec -it <pod-name> -- /bin/bash

# Get events
kubectl get events
```

## Troubleshooting

### Docker Not Running

**Issue**: "Docker is not running" error

**Solution**:
```bash
# macOS/Windows: Start Docker Desktop application
# Linux:
sudo systemctl start docker
sudo systemctl enable docker
```

### kubectl Connection Refused

**Issue**: "connection refused" when running kubectl commands

**Solution**:
```bash
# Check cluster is running
minikube status
# or
kind get clusters

# Restart cluster if needed
minikube start
# or
kind create cluster
```

### Permission Denied (Linux)

**Issue**: Permission denied when running Docker commands

**Solution**:
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Or run with sudo
sudo docker ps
```

### Minikube Won't Start

**Issue**: Minikube fails to start

**Solution**:
```bash
# Delete and recreate
minikube delete
minikube start

# Try different driver
minikube start --driver=docker
minikube start --driver=virtualbox
```

### Insufficient Resources

**Issue**: "insufficient memory" or "insufficient CPU" errors

**Solution**:
```bash
# Minikube: Allocate more resources
minikube start --memory=4096 --cpus=2

# Kind: Edit configuration before creating
kind create cluster --config=kind-config.yaml
```

## Advanced Usage

### Custom Cluster Configuration

#### Minikube with Custom Resources

```bash
minikube start \
  --cpus=4 \
  --memory=8192 \
  --disk-size=20g \
  --kubernetes-version=v1.28.0
```

#### Kind Multi-Node Cluster

Create a file `kind-config.yaml`:

```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
- role: worker
- role: worker
```

Create cluster:

```bash
kind create cluster --config=kind-config.yaml --name multi-node
```

### Installing Helm Charts

```bash
# Add Helm repository
helm repo add bitnami https://charts.bitnami.com/bitnami

# Update repositories
helm repo update

# Install chart
helm install my-redis bitnami/redis

# List installed charts
helm list

# Uninstall
helm uninstall my-redis
```

### Port Forwarding

```bash
# Forward local port to pod
kubectl port-forward pod/my-pod 8080:80

# Forward to service
kubectl port-forward service/my-service 8080:80

# Forward to deployment
kubectl port-forward deployment/my-app 8080:80
```

### Working with Namespaces

```bash
# Create namespace
kubectl create namespace dev

# Deploy to namespace
kubectl create deployment my-app --image=nginx -n dev

# Set default namespace
kubectl config set-context --current --namespace=dev

# List all namespaces
kubectl get namespaces
```

## Uninstalling

### Remove Cluster

```bash
# Minikube
minikube delete

# Kind
kind delete cluster
```

### Remove Components

#### macOS

```bash
brew uninstall kubectl minikube helm
brew uninstall --cask docker
```

#### Windows

```bash
# Using Winget
winget uninstall Docker.DockerDesktop
winget uninstall Kubernetes.kubectl
winget uninstall Kubernetes.minikube

# Using Chocolatey
choco uninstall docker-desktop kubernetes-cli minikube
```

#### Linux

```bash
# Docker
sudo apt remove docker-ce docker-ce-cli containerd.io

# kubectl
sudo rm /usr/local/bin/kubectl

# Minikube
sudo rm /usr/local/bin/minikube
```

## Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Minikube Documentation](https://minikube.sigs.k8s.io/docs/)
- [Kind Documentation](https://kind.sigs.k8s.io/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Helm Documentation](https://helm.sh/docs/)

## Support

For issues with the installer:
1. Check the installation log in the application
2. Review error messages carefully
3. Consult the troubleshooting section
4. Open an issue on GitHub with logs and system info

For Kubernetes issues:
1. Check Kubernetes official documentation
2. Use `kubectl describe` to get detailed information
3. Check pod logs with `kubectl logs`
4. Visit Kubernetes community forums
