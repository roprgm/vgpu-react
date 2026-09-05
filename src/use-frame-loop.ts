"use client";

import { useLayoutEffect, useRef } from "react";
import type { FrameLoopCallback } from "vgpu";
import { useGpuContext } from "./use-gpu";

export function useFrameLoop(callback: FrameLoopCallback): void {
  const { subscribe } = useGpuContext();
  const callbackRef = useRef(callback);

  useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  // Layout effect to match useSurface: unsubscribe and dispose must share one task.
  useLayoutEffect(
    () => subscribe((frame) => callbackRef.current(frame)),
    [subscribe],
  );
}
