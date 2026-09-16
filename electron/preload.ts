import { contextBridge, ipcRenderer } from 'electron'

export interface IElectronAPI {
  getVersion: () => Promise<string>
  openExternal: (url: string) => Promise<void>
  getNativeTheme: () => Promise<'dark' | 'light'>
}

contextBridge.exposeInMainWorld('electronAPI', {
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion'),
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('app:openExternal', url),
  getNativeTheme: (): Promise<'dark' | 'light'> => ipcRenderer.invoke('theme:getNative'),
} satisfies IElectronAPI)
