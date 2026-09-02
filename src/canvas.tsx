import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
  useRef,
} from "react";
import type { Surface, SurfaceOptions } from "vgpu";
import { GpuContext, GpuProvider } from "./provider";
import { useSurface } from "./use-surface";

const CanvasContext = createContext<Surface | null>(null);

type CanvasProps = SurfaceOptions &
  Omit<ComponentProps<"canvas">, keyof SurfaceOptions | "children" | "ref"> & {
    children?: ReactNode;
  };

function SurfaceCanvas({
  children,
  autoResize,
  clearColor,
  dpr,
  size,
  format,
  alphaMode,
  colorSpace,
  label,
  ...props
}: CanvasProps): ReactNode {
  const canvas = useRef<HTMLCanvasElement>(null);
  const target = useSurface(canvas, {
    autoResize,
    clearColor,
    dpr,
    size,
    format,
    alphaMode,
    colorSpace,
    label,
  });

  return (
    <>
      <canvas {...props} ref={canvas} />
      {target && <CanvasContext value={target}>{children}</CanvasContext>}
    </>
  );
}

export function Canvas(props: CanvasProps): ReactNode {
  const gpu = useContext(GpuContext);
  if (!gpu) {
    return (
      <GpuProvider>
        <SurfaceCanvas {...props} />
      </GpuProvider>
    );
  }
  return <SurfaceCanvas {...props} />;
}

export function useCanvas(): Surface {
  const target = useContext(CanvasContext);
  if (!target) {
    throw new Error("useCanvas must be used within Canvas");
  }
  return target;
}
