const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  detectOS: () => ipcRenderer.invoke('detect-os'),

  detectPackageManager: () => ipcRenderer.invoke('detect-package-manager'),

  checkPrerequisites: () => ipcRenderer.invoke('check-prerequisites'),

  installHomebrew: () => ipcRenderer.invoke('install-homebrew'),

  updatePackageManager: () => ipcRenderer.invoke('update-package-manager'),

  installComponent: (component) => ipcRenderer.invoke('install-component', component),

  startCluster: (clusterType) => ipcRenderer.invoke('start-cluster', clusterType),

  verifyInstallation: () => ipcRenderer.invoke('verify-installation'),

  executeCommand: (command) => ipcRenderer.invoke('execute-command', command),

  showDialog: (options) => ipcRenderer.invoke('show-dialog', options),

  saveConfig: (key, value) => ipcRenderer.invoke('save-config', key, value),

  loadConfig: (key) => ipcRenderer.invoke('load-config', key),

  platform: process.platform
});
