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
  /** Frame rate cap of the shared frame loop. */
  fps?: number;
};

export function GpuProvider({ children, fps }: GpuProviderProps): ReactNode {
  const [gpu, setGpu] = useState<Gpu | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    let instance: Gpu | undefined;

    init().then(
      (created) => {
        if (cancelled) {
          created.dispose();
          return;
        }

        instance = created;
        setGpu(created);
      },
      (reason) => {
        if (!cancelled) {
          setError(reason);
        }
      },
    );

    return () => {
      cancelled = true;
      instance?.dispose();
    };
  }, []);

  const value = useMemo(() => gpu && createValue(gpu, fps), [gpu, fps]);

  if (error) {
    throw error;
  }
  if (!value) {
    return null;
  }

  return <GpuContext value={value}>{children}</GpuContext>;
}

function createValue(gpu: Gpu, fps?: number): GpuContextValue {
  const callbacks = new Set<FrameLoopCallback>();
  let loop: FrameLoopHandle | undefined;

  return {
    gpu,
    subscribe(callback) {
      callbacks.add(callback);
      loop ??= frameLoop(
        gpu,
        (frame) => {
          for (const cb of callbacks) {
            cb(frame);
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
