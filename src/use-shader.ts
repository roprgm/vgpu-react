"use client";

import { useMemo } from "react";
import {
  type Effect,
  type EffectOptions,
  effect,
  type ShaderSource,
} from "vgpu";
import { useGpu } from "./use-gpu";

/**
 * Fullscreen effect compiled from `source`, created once per gpu and source.
 *
 * `options` are read when the effect is created. Update uniforms with `effect.set()`; remount
 * with `key` to change anything else.
 */
export function useShader(
  source: string | ShaderSource,
  options?: EffectOptions,
): Effect {
  const gpu = useGpu();

  // biome-ignore lint/correctness/useExhaustiveDependencies: options are read once on creation
  return useMemo(() => effect(gpu, source, options), [gpu, source]);
}
