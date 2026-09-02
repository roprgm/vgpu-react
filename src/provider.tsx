import { createContext, type ReactNode, useEffect, useState } from "react";
import { type Gpu, init } from "vgpu";

export const GpuContext = createContext<Gpu | null>(null);

type GpuProviderProps = {
  children: ReactNode;
};

export function GpuProvider({ children }: GpuProviderProps): ReactNode {
  const [gpu, setGpu] = useState<Gpu | null>(null);

  useEffect(() => {
    let cancelled = false;
    let instance: Gpu | undefined;

    void init().then((created) => {
      if (cancelled) {
        created.dispose();
        return;
      }
      instance = created;
      setGpu(created);
    });

    return () => {
      cancelled = true;
      instance?.dispose();
    };
  }, []);

  if (!gpu) {
    return null;
  }

  return <GpuContext value={gpu}>{children}</GpuContext>;
}
