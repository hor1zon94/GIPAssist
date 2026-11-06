'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('gipApp', { pickFolder: () => ipcRenderer.invoke('pick-folder') });
