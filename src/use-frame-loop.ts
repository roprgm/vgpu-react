import { useEffect, useEffectEvent } from "react";
import { type FrameLoopCallback, type FrameLoopOptions, frameLoop } from "vgpu";
import { useGpu } from "./use-gpu";

export function useFrameLoop(
  callback: FrameLoopCallback,
  options?: FrameLoopOptions,
): void {
  const gpu = useGpu();
  const onFrame = useEffectEvent(callback);
  const fps = options?.fps;

  useEffect(() => {
    const loop = frameLoop(gpu, onFrame, { fps });
    return () => loop.stop();
  }, [gpu, fps]);
}
