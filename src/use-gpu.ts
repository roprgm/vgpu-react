"use client";

import { use, useContext } from "react";
import type { Gpu } from "vgpu";
import { GpuContext, type GpuContextValue } from "./provider";

export function useGpuContext(): GpuContextValue {
  const value = useContext(GpuContext);
  if (!value) {
    throw new Error("useGpu must be used within GpuProvider or Canvas");
  }
  return value;
}

/**
 * Suspends until the gpu is ready; throws if `init()` failed.
 *
 * Throws on the server too, so server rendering emits the nearest `Suspense` fallback and React
 * renders that boundary on the client instead of waiting for a gpu that never comes.
 */
export function useGpu(): Gpu {
  const { gpu } = useGpuContext();
  if (typeof window === "undefined") {
    throw new Error("useGpu: WebGPU is only available in the browser");
  }
  return use(gpu);
}
