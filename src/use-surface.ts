import { type RefObject, useEffect, useRef } from "react";
import { type Surface, type SurfaceOptions, surface } from "vgpu";
import { useGpu } from "./use-gpu";

export function useSurface(
  canvas: RefObject<HTMLCanvasElement | null>,
  options?: SurfaceOptions,
): RefObject<Surface | null> {
  const gpu = useGpu();
  const target = useRef<Surface | null>(null);

  useEffect(() => {
    if (!canvas.current) {
      return;
    }
    const current = surface(gpu, canvas.current, options);
    target.current = current;
    return () => {
      target.current = null;
      current.dispose();
    };
  }, [gpu, canvas, options]);

  return target;
}
