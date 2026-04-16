export type DataProviderMode = 'mock' | 'api';

export interface AppRuntimeConfig {
  dataProviderMode: DataProviderMode;
}

export const APP_RUNTIME_CONFIG: AppRuntimeConfig = {
  // While backend is under development, keep app in mock mode.
  dataProviderMode: 'mock'
};
