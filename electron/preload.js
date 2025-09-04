import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  store: {
    get: (key) => ipcRenderer.invoke('store:get', key),
    set: (key, value) => ipcRenderer.invoke('store:set', key, value),
    delete: (key) => ipcRenderer.invoke('store:delete', key)
  },
  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url)
  },
  export: {
    saveFile: (opts) => ipcRenderer.invoke('export:saveFile', opts)
  },
  nexus: {
    setApiKey: (key) => ipcRenderer.invoke('nexus:setApiKey', key),
    getApiKey: () => ipcRenderer.invoke('nexus:getApiKey'),
    fetchLatestMods: (opts) => ipcRenderer.invoke('nexus:fetchLatestMods', opts),
    getModDetails: (id) => ipcRenderer.invoke('nexus:getModDetails', id),
    getChangelogs: (id) => ipcRenderer.invoke('nexus:getChangelogs', id),
    scrapeComments: (id, opts) => ipcRenderer.invoke('nexus:scrapeComments', id, opts)
  }
});
