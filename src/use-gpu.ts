"use client";

import { useContext } from "react";
import type { Gpu } from "vgpu";
import { GpuContext, type GpuContextValue } from "./provider";

export function useGpuContext(): GpuContextValue {
  const value = useContext(GpuContext);
  if (!value) {
    throw new Error("useGpu must be used within GpuProvider or Canvas");
  }
  return value;
}

/** Returns the ready GPU owned or shared by the nearest provider. */
export function useGpu(): Gpu {
  return useGpuContext().gpu;
}
