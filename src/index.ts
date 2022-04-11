import type { MaybeRef, RemovableRef, EventFilter } from '@vueuse/shared';
import { noop, tryOnScopeDispose, watchWithFilter } from '@vueuse/shared';
import type { Ref } from 'vue';
import { unref, ref, shallowRef, watchEffect } from 'vue-demi';
import * as browser from 'webextension-polyfill';
import type { Storage } from 'webextension-polyfill';

export type StorageType = 'sync' | 'local' | 'managed';

export interface BrowserStorageOptions {
  listenToStorageChanges?: boolean;
  shallow?: boolean;
  writeDefaults?: boolean;
  deep?: boolean;
  eventFilter?: EventFilter;
}

export function useWebextStorage<T>(
  key: string,
  storageType: StorageType,
  initialValue: MaybeRef<T>,
  options: BrowserStorageOptions = {},
): RemovableRef<T> {
  const {
    listenToStorageChanges = false,
    shallow = false,
    writeDefaults = true,
    eventFilter,
    deep,
  } = options;

  const rawInit = unref(initialValue);

  const rawStorage = browser.storage[storageType];

  const storage = {
    async getItem(key: string) {
      const values = await rawStorage.get(key);
      return values[key];
    },
    async setItem<T>(key: string, value: T) {
      await rawStorage.set({ [key]: value });
    },

    async removeItem(key: string) {
      await rawStorage.remove(key);
    },
  };

  const data = (shallow ? shallowRef : ref)(initialValue) as Ref<T>;
  watchEffect(() => console.log(data.value));

  async function read(
    eventData: {
      changes?: Record<string, Storage.StorageChange>;
      areaName?: string;
    } = {},
  ) {
    const { areaName, changes } = eventData;
    if (
      (areaName && areaName !== storageType) ||
      (changes && !Object.hasOwn(changes, key))
    ) {
      return;
    }

    const rawValue = (await storage.getItem(key)) ?? changes?.[key].newValue;
    // NOTE: we use `==` to check for undefined or null.
    if (rawValue == null) {
      data.value = rawInit;
      if (writeDefaults && rawInit !== null) {
        await storage.setItem(key, rawInit);
      }
    } else {
      data.value = rawValue;
    }
  }

  read();

  if (listenToStorageChanges) {
    const handleChanges = (
      changes: Record<string, Storage.StorageChange>,
      areaName: string,
    ) =>
      setTimeout(() => {
        read({ changes, areaName });
      }, 0);

    let cleanup = noop;

    const stopWatch = watchWithFilter(
      data,
      async () => {
        cleanup();
        if (data.value == null) {
          await storage.removeItem(key);
        } else {
          await storage.setItem(key, data.value);
        }

        browser.storage.onChanged.addListener(handleChanges);

        cleanup = () => {
          browser.storage.onChanged.removeListener(handleChanges);
          cleanup = noop;
        };
      },
      { immediate: true, flush: 'post', eventFilter, deep },
    );

    const stop = () => {
      stopWatch();
      cleanup();
    };

    tryOnScopeDispose(stop);
  }

  return data as RemovableRef<T>;
}

export function useBrowserLocalStorage<T>(
  key: string,
  initialValue: MaybeRef<T>,
  options: BrowserStorageOptions = {},
) {
  return useWebextStorage(key, 'local', initialValue, options);
}

export function useBrowserSyncStorage<T>(
  key: string,
  initialValue: MaybeRef<T>,
  options: BrowserStorageOptions = {},
) {
  return useWebextStorage(key, 'sync', initialValue, options);
}
