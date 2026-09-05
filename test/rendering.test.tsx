import { expect, test } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useLayoutEffect, useRef } from "react";
import type { Effect, Frame, Surface, SurfaceOptions } from "vgpu";
import { init } from "vgpu/mock";
import {
  Canvas,
  GpuProvider,
  useCanvas,
  useFrame,
  useFrameLoop,
  useShader,
  useSurface,
} from "../src";
import { mockBrowser } from "./browser";

const source =
  "@fragment fn fs_main() -> @location(0) vec4f { return vec4f(1.0); }";

test("shares frames, updates callbacks and FPS, and stops after the last subscriber", async () => {
  const browser = mockBrowser();
  const gpu = await init();
  const calls: { name: string; frame: Frame }[] = [];
  const failure = new Error("Broken pass");
  function Pass({ name }: { name: string }) {
    const target = useCanvas();
    const shader = useShader(source);
    useFrameLoop((frame) => {
      calls.push({ name, frame });
      if (name === "broken") {
        throw failure;
      }
      frame.pass(target, shader);
    });
    return null;
  }
  const tree = (fps: number, name = "first", active = 2) => (
    <GpuProvider gpu={gpu} fps={fps}>
      <Canvas size={[8, 8]}>{active >= 1 && <Pass name={name} />}</Canvas>
      <Canvas size={[8, 8]}>{active >= 2 && <Pass name="last" />}</Canvas>
    </GpuProvider>
  );
  try {
    const view = render(tree(30));
    await act(async () => {});
    expect(browser.pendingFrames()).toBe(1);
    browser.advanceFrame(0);
    expect(calls.map(({ name }) => name)).toEqual(["first", "last"]);
    expect(calls[0].frame).toBe(calls[1].frame);
    browser.advanceFrame(20);
    expect(calls).toHaveLength(2);
    browser.advanceFrame(40);
    expect(calls).toHaveLength(4);
    expect(browser.errors).not.toHaveBeenCalled();

    await act(async () => view.rerender(tree(60, "updated")));
    calls.length = 0;
    browser.advanceFrame(60);
    browser.advanceFrame(80);
    expect(calls.map(({ name }) => name)).toEqual([
      "updated",
      "last",
      "updated",
      "last",
    ]);
    expect(browser.pendingFrames()).toBe(1);
    await act(async () => view.rerender(tree(60, "broken")));
    browser.advanceFrame(100);
    expect(browser.errors).toHaveBeenCalledWith(failure);
    expect(calls.at(-1)?.name).toBe("last");
    expect(browser.errors).toHaveBeenCalledTimes(1);

    await act(async () => view.rerender(tree(60, "remaining", 1)));
    expect(browser.pendingFrames()).toBe(1);
    calls.length = 0;
    browser.advanceFrame(120);
    expect(calls.map(({ name }) => name)).toEqual(["remaining"]);
    await act(async () => view.rerender(tree(60, "unused", 0)));
    expect(browser.pendingFrames()).toBe(0);
    const count = calls.length;
    browser.advanceFrame(140);
    expect(calls).toHaveLength(count);
    view.unmount();
    expect(gpu.disposed).toBe(false);
  } finally {
    gpu.dispose();
  }
});

test("updates surfaces and shaders while event callbacks keep current values", async () => {
  mockBrowser();
  const gpu = await init();
  const observed: { surface: Surface; shader: Effect }[] = [];
  const draws: string[] = [];
  function Draw({
    target,
    value,
    shaderSource,
  }: {
    target: Surface | null;
    value: string;
    shaderSource: string;
  }) {
    const shader = useShader(shaderSource);
    useLayoutEffect(() => {
      if (target) {
        observed.push({ surface: target, shader });
      }
    }, [target, shader]);
    const draw = useFrame((frame, label: string) => {
      if (target) {
        frame.pass(target, shader);
        draws.push(`${value}:${label}`);
      }
    });
    return (
      <button type="button" onClick={() => draw("click")}>
        Draw
      </button>
    );
  }
  function CustomCanvas({
    options,
    value,
    shaderSource = source,
  }: {
    options: SurfaceOptions;
    value: string;
    shaderSource?: string;
  }) {
    const canvas = useRef<HTMLCanvasElement>(null);
    const target = useSurface(canvas, options);
    return (
      <>
        <canvas ref={canvas} />
        <Draw target={target} value={value} shaderSource={shaderSource} />
      </>
    );
  }
  const tree = (
    options: SurfaceOptions,
    value: string,
    shaderSource = source,
  ) => (
    <GpuProvider gpu={gpu}>
      <CustomCanvas
        options={options}
        value={value}
        shaderSource={shaderSource}
      />
    </GpuProvider>
  );
  try {
    const view = render(tree({ size: [8, 8] }, "initial"));
    await act(async () => {});
    const first = observed[0];
    expect(first.surface.size).toEqual([8, 8]);
    fireEvent.click(screen.getByRole("button"));
    await act(async () =>
      view.rerender(
        tree({ size: [8, 8], clearColor: [1, 0, 0, 1] }, "updated"),
      ),
    );
    expect(observed).toHaveLength(1);
    expect(first.surface.clearColor).toEqual([1, 0, 0, 1]);
    fireEvent.click(screen.getByRole("button"));
    expect(draws).toEqual(["initial:click", "updated:click"]);

    await act(async () => view.rerender(tree({ size: [16, 16] }, "resized")));
    const resized = observed.at(-1);
    expect(first.surface.disposed).toBe(true);
    expect(resized?.surface.size).toEqual([16, 16]);
    expect(resized?.surface.clearColor).toEqual([0, 0, 0, 1]);
    expect(resized?.shader).toBe(first.shader);
    await act(async () =>
      view.rerender(
        tree({ size: [16, 16] }, "new shader", source.replace("1.0", "0.5")),
      ),
    );
    expect(observed.at(-1)?.shader).not.toBe(first.shader);
    expect(observed.at(-1)?.surface).toBe(resized?.surface);
    fireEvent.click(screen.getByRole("button"));
    expect(draws.at(-1)).toBe("new shader:click");
    view.unmount();
    expect(resized?.surface.disposed).toBe(true);
  } finally {
    gpu.dispose();
  }
});
