"use client";

import { type RefObject, useEffect, useLayoutEffect, useState } from "react";
import { type Surface, type SurfaceOptions, surface } from "vgpu";
import { useGpu } from "./use-gpu";

export function useSurface(
  canvas: RefObject<HTMLCanvasElement | null>,
  { clearColor, ...options }: SurfaceOptions = {},
): Surface | null {
  const gpu = useGpu();
  const [target, setTarget] = useState<Surface | null>(null);
  const key = JSON.stringify(options);

  // Layout effect: dispose, recreate and the re-render share one task, so no frame tick sees a disposed surface.
  // biome-ignore lint/correctness/useExhaustiveDependencies: options are compared by value through `key`
  useLayoutEffect(() => {
    if (!canvas.current) {
      throw new Error("useSurface: the canvas must be mounted with the ref");
    }
    const current = surface(gpu, canvas.current, { ...options, clearColor });
    setTarget(current);
    return () => {
      setTarget((target) => (target === current ? null : target));
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
