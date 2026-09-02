import { type DependencyList, useMemo } from "react";
import {
  type Effect,
  type EffectOptions,
  effect,
  type ShaderSource,
} from "vgpu";
import { useGpu } from "./use-gpu";

/**
 * Fullscreen effect compiled from `source`, created once per gpu.
 *
 * `options` are captured when the effect is created and applied again only when a value in
 * `deps` changes. With no `deps` they are captured once.
 */
export function useShader(
  source: string | ShaderSource,
  options?: EffectOptions,
  deps: DependencyList = [],
): Effect {
  const gpu = useGpu();

  // biome-ignore lint/correctness/useExhaustiveDependencies: the caller's deps decide when options apply
  return useMemo(() => effect(gpu, source, options), [gpu, source, ...deps]);
}
