"use client";

import { useCallback, useSyncExternalStore } from "react";

const listeners = new Map<string, Set<() => void>>();

function subscribeToKey(key: string, onStoreChange: () => void) {
  let keyListeners = listeners.get(key);
  if (!keyListeners) {
    keyListeners = new Set();
    listeners.set(key, keyListeners);
  }
  keyListeners.add(onStoreChange);
  return () => {
    keyListeners?.delete(onStoreChange);
  };
}

function readPreference(key: string, fallback: string) {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function emit(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

export function useUiPreference<T extends string>(
  key: string,
  fallback: T
): [T, (value: T) => void] {
  const subscribe = useCallback(
    (onStoreChange: () => void) => subscribeToKey(key, onStoreChange),
    [key]
  );
  const getSnapshot = useCallback(
    () => readPreference(key, fallback) as T,
    [fallback, key]
  );
  const getServerSnapshot = useCallback(() => fallback, [fallback]);
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const update = (next: T) => {
    try {
      window.localStorage.setItem(key, next);
    } catch {
      // Ignore quota / private-mode failures.
    }
    emit(key);
  };

  return [value, update];
}
