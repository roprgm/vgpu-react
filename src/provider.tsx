import { createContext, type ReactNode, useEffect, useState } from "react";
import { type Gpu, init } from "vgpu";

export const GpuContext = createContext<Gpu | null>(null);

type GpuProviderProps = {
  children: ReactNode;
};

export function GpuProvider({ children }: GpuProviderProps): ReactNode {
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
      (reason: unknown) => {
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

  if (error) {
    throw error;
  }

  if (!gpu) {
    return null;
  }

  return <GpuContext value={gpu}>{children}</GpuContext>;
}
