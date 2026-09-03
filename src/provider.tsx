"use client";

import {
  createContext,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type FrameLoopCallback,
  type FrameLoopHandle,
  frameLoop,
  type Gpu,
  type InitOptions,
  init,
} from "vgpu";

export type GpuContextValue = {
  gpu: Promise<Gpu>;
  /** Adds `callback` to this gpu's single frame loop. Returns the unsubscribe. */
  subscribe: (gpu: Gpu, callback: FrameLoopCallback) => () => void;
};

export const GpuContext = createContext<GpuContextValue | null>(null);

type GpuProviderProps = {
  children: ReactNode;
  /** Options for vgpu's `init()`, read once on mount. Remount with `key` to change them. */
  options?: InitOptions;
  /** Existing gpu to use instead of calling `init()`, read once on mount. Whoever created it disposes it. */
  gpu?: Gpu;
  /** Frame rate cap of the shared frame loop. */
  fps?: number;
};

export function GpuProvider({
  children,
  options,
  gpu: external,
  fps,
}: GpuProviderProps): ReactNode {
  const [deferred] = useState(() => Promise.withResolvers<Gpu>());

  // biome-ignore lint/correctness/useExhaustiveDependencies: options and gpu are read once on mount
  useEffect(() => {
    if (external) {
      deferred.resolve(external);
      return;
    }
    let cancelled = false;
    let instance: Gpu | undefined;

    init(options).then(
      (gpu) => {
        if (cancelled) {
          gpu.dispose();
          return;
        }

        instance = gpu;
        deferred.resolve(gpu);
      },
      (reason) => {
        if (!cancelled) {
          deferred.reject(reason);
        }
      },
    );

    return () => {
      cancelled = true;
      instance?.dispose();
    };
  }, []);

  const value = useMemo(
    () => createValue(deferred.promise, fps),
    [deferred, fps],
  );

  return <GpuContext value={value}>{children}</GpuContext>;
}

function createValue(promise: Promise<Gpu>, fps?: number): GpuContextValue {
  const callbacks = new Set<FrameLoopCallback>();
  let loop: FrameLoopHandle | undefined;

  return {
    gpu: promise,
    subscribe(gpu, callback) {
      callbacks.add(callback);
      // A throw would end vgpu's loop for every subscriber, so report it and keep going.
      loop ??= frameLoop(
        gpu,
        (frame) => {
          for (const cb of callbacks) {
            try {
              cb(frame);
            } catch (error) {
              reportError(error);
            }
          }
        },
        { fps },
      );
      return () => {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          loop?.stop();
          loop = undefined;
        }
      };
    },
  };
}
