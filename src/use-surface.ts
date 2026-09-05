"use client";

import { type RefObject, useEffect, useLayoutEffect, useState } from "react";
import { type Gpu, type Surface, type SurfaceOptions, surface } from "vgpu";
import { useGpu } from "./use-gpu";

type SurfaceState = {
  gpu: Gpu;
  canvas: RefObject<HTMLCanvasElement | null>;
  key: string;
  target: Surface;
};

export function useSurface(
  canvas: RefObject<HTMLCanvasElement | null>,
  { clearColor, ...options }: SurfaceOptions = {},
): Surface | null {
  const gpu = useGpu();
  const [state, setState] = useState<SurfaceState | null>(null);
  const key = JSON.stringify(options);
  // Hide the old surface before layout cleanup disposes it and consumers run effects.
  const target =
    state?.gpu === gpu && state.canvas === canvas && state.key === key
      ? state.target
      : null;

  // Layout effect: dispose, recreate and the re-render share one task, so no frame tick sees a disposed surface.
  // biome-ignore lint/correctness/useExhaustiveDependencies: options are compared by value through `key`
  useLayoutEffect(() => {
    if (!canvas.current) {
      throw new Error("useSurface: the canvas must be mounted with the ref");
    }
    const current = surface(gpu, canvas.current, { ...options, clearColor });
    setState({ gpu, canvas, key, target: current });
    return () => {
      setState((state) => (state?.target === current ? null : state));
      current.dispose();
    };
  }, [gpu, canvas, key]);

  useEffect(() => {
    if (target) {
      target.clearColor = clearColor ?? [0, 0, 0, 1];
    }
  }, [target, clearColor]);

  return target;
}
