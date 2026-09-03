"use client";

import { useLayoutEffect, useRef } from "react";
import type { FrameLoopCallback } from "vgpu";
import { useGpu, useGpuContext } from "./use-gpu";

export function useFrameLoop(callback: FrameLoopCallback): void {
  const { subscribe } = useGpuContext();
  const gpu = useGpu();
  const callbackRef = useRef(callback);

  useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  // Layout effect to match useSurface: unsubscribe and dispose must share one task.
  useLayoutEffect(
    () => subscribe(gpu, (frame) => callbackRef.current(frame)),
    [subscribe, gpu],
  );
}
