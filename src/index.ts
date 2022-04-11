import type { EventFilter, MaybeRef, RemovableRef } from '@vueuse/shared';
import {
  noop,
  tryOnScopeDispose,
  until,
  watchWithFilter,
} from '@vueuse/shared';
import type { Ref } from 'vue';
import { ref, shallowRef, unref } from 'vue-demi';
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

export interface UseWebextStorageReturn<T> {
  data: RemovableRef<T>;
  error: Ref<unknown>;
  isReady: Ref<boolean>;
}

export function useWebextStorage<T>(
  key: string,
  storageType: StorageType,
  initialValue: MaybeRef<T>,
  options: BrowserStorageOptions = {},
): UseWebextStorageReturn<T> & PromiseLike<UseWebextStorageReturn<T>> {
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
  const error = ref<unknown>();
  const isReady = ref(false);

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

    try {
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
    } catch (e) {
      error.value = e;
    } finally {
      isReady.value = true;
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
        try {
          if (data.value == null) {
            await storage.removeItem(key);
          } else {
            await storage.setItem(key, data.value);
          }
        } catch (e) {
          error.value = e;
        } finally {
          isReady.value = true;
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

  const state = { data: data as RemovableRef<T>, error, isReady };
  return {
    ...state,
    then(onFulfilled, onRejected) {
      return new Promise<UseWebextStorageReturn<T>>((resolve, reject) => {
        until(isReady)
          .toBeTruthy()
          .then(() => resolve(state))
          .catch(() => reject(state));
      }).then(onFulfilled, onRejected);
    },
  };
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
