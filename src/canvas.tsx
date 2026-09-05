"use client";

import {
  type ComponentProps,
  createContext,
  type ReactNode,
  type RefObject,
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
    /** Rendered next to the canvas until the GPU and surface are ready. */
    fallback?: ReactNode;
  };

type CanvasSurfaceProps = {
  canvas: RefObject<HTMLCanvasElement | null>;
  options: SurfaceOptions;
  children?: ReactNode;
};

function CanvasSurface({
  canvas,
  options,
  children,
}: CanvasSurfaceProps): ReactNode {
  const target = useSurface(canvas, options);
  return target && <CanvasContext value={target}>{children}</CanvasContext>;
}

export function Canvas({
  children,
  fallback,
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
  const hasProvider = useContext(GpuContext) !== null;
  const surface = (
    <CanvasSurface
      canvas={canvas}
      options={{
        autoResize,
        clearColor,
        dpr,
        size,
        format,
        alphaMode,
        colorSpace,
        label,
      }}
    >
      {children}
    </CanvasSurface>
  );

  const content = hasProvider ? (
    surface
  ) : (
    <GpuProvider fallback={fallback}>{surface}</GpuProvider>
  );

  return (
    <>
      <canvas {...props} ref={canvas} />
      {content}
    </>
  );
}

export function useCanvas(): Surface {
  const target = useContext(CanvasContext);
  if (!target) {
    throw new Error("useCanvas must be used within Canvas");
  }
  return target;
}
