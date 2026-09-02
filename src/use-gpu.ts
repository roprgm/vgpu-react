import { useContext } from "react";
import type { Gpu } from "vgpu";
import { GpuContext } from "./provider";

export function useGpu(): Gpu {
  const gpu = useContext(GpuContext);
  if (!gpu) {
    throw new Error("useGpu must be used within GpuProvider");
  }
  return gpu;
}
