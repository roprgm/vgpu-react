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
  gpu: Gpu;
  /** Adds `callback` to this gpu's single frame loop. Returns the unsubscribe. */
  subscribe: (callback: FrameLoopCallback) => () => void;
};

export const GpuContext = createContext<GpuContextValue | null>(null);

type GpuProviderProps = {
  children: ReactNode;
  /** Rendered until the GPU is ready. */
  fallback?: ReactNode;
  /** Options for vgpu's `init()`, read once on mount. Remount with `key` to change them. */
  options?: InitOptions;
  /** Existing gpu, read once on mount. Whoever created it disposes it. */
  gpu?: Gpu;
  /** Frame rate cap of the shared frame loop. */
  fps?: number;
};

type GpuState =
  | { status: "loading" }
  | { status: "ready"; gpu: Gpu }
  | { status: "error"; error: unknown };

function createValue(gpu: Gpu, fps?: number): GpuContextValue {
  const callbacks = new Set<FrameLoopCallback>();
  let loop: FrameLoopHandle | undefined;

  return {
    gpu,
    subscribe(callback) {
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

export function GpuProvider({
  children,
  fallback,
  options,
  gpu,
  fps,
}: GpuProviderProps): ReactNode {
  const [initial] = useState({ options, gpu });
  const [state, setState] = useState<GpuState>({ status: "loading" });

  useEffect(() => {
    if (initial.gpu) {
      setState({ status: "ready", gpu: initial.gpu });
      return;
    }
    let cancelled = false;
    let instance: Gpu | undefined;

    init(initial.options).then(
      (gpu) => {
        if (cancelled) {
          gpu.dispose();
          return;
        }
        instance = gpu;
        setState({ status: "ready", gpu });
      },
      (error) => {
        if (!cancelled) {
          setState({ status: "error", error });
        }
      },
    );

    return () => {
      cancelled = true;
      // Activity preserves state but reconnects effects. Never restore a disposed GPU.
      setState({ status: "loading" });
      instance?.dispose();
    };
  }, [initial]);

  const value = useMemo(() => {
    if (state.status === "ready") {
      return createValue(state.gpu, fps);
    }
    return null;
  }, [state, fps]);

  if (state.status === "error") {
    throw state.error;
  }
  if (!value) {
    return fallback;
  }
  return <GpuContext value={value}>{children}</GpuContext>;
}
