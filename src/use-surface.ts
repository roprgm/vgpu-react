import { type RefObject, useEffect, useRef, useState } from "react";
import { type Surface, type SurfaceOptions, surface } from "vgpu";
import { useGpu } from "./use-gpu";

export function useSurface(
  canvas: RefObject<HTMLCanvasElement | null>,
  options?: SurfaceOptions,
): Surface | null {
  const gpu = useGpu();
  const [target, setTarget] = useState<Surface | null>(null);
  const optionsRef = useRef(options);

  useEffect(() => {
    if (!canvas.current) {
      return;
    }
    const current = surface(gpu, canvas.current, optionsRef.current);
    setTarget(current);
    return () => {
      setTarget((target) => (target === current ? null : target));
      current.dispose();
    };
  }, [gpu, canvas]);

  return target;
}
