import { useContext } from "react";
import type { Gpu } from "vgpu";
import { GpuContext } from "./provider";

export function useContextGpu(): Gpu | null {
  return useContext(GpuContext);
}

export function useGpu(): Gpu {
  const gpu = useContextGpu();
  if (!gpu) {
    throw new Error("useGpu must be used within GpuProvider or Canvas");
  }
  return gpu;
}
