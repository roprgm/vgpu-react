"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import { type Frame, frame } from "vgpu";
import { useGpu } from "./use-gpu";

export function useFrame<Args extends unknown[]>(
  callback: (frame: Frame, ...args: Args) => void,
): (...args: Args) => void {
  const gpu = useGpu();
  const callbackRef = useRef(callback);

  useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback(
    (...args) => {
      frame(gpu, (current) => callbackRef.current(current, ...args));
    },
    [gpu],
  );
}
