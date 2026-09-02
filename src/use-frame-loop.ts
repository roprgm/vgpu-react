import { useEffect, useLayoutEffect, useRef } from "react";
import { type FrameLoopCallback, type FrameLoopOptions, frameLoop } from "vgpu";
import { useGpu } from "./use-gpu";

export function useFrameLoop(
  callback: FrameLoopCallback,
  options?: FrameLoopOptions,
): void {
  const gpu = useGpu();
  const callbackRef = useRef(callback);
  const fps = options?.fps;

  useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    const loop = frameLoop(gpu, (frame) => callbackRef.current(frame), { fps });
    return () => loop.stop();
  }, [gpu, fps]);
}
