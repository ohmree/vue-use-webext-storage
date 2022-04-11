import { useBrowserLocalStorage } from 'vue-use-webext-storage';

export const storageDemo = useBrowserLocalStorage(
  'webext-demo',
  'Storage Demo',
  { listenToStorageChanges: true },
);
