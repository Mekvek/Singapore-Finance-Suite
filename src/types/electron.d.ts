export interface IElectronAPI {
  getVersion: () => Promise<string>
  openExternal: (url: string) => Promise<void>
  getNativeTheme: () => Promise<'dark' | 'light'>
}

declare global {
  interface Window {
    electronAPI?: IElectronAPI
  }
}
