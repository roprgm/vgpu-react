# vgpu-react

[![CI](https://github.com/roprgm/vgpu-react/actions/workflows/ci.yml/badge.svg)](https://github.com/roprgm/vgpu-react/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/vgpu-react)](https://www.npmjs.com/package/vgpu-react)

React bindings for [vgpu](https://vgpu.sh).

## Install

```sh
pnpm add vgpu-react vgpu react
```

Requires React 19, vgpu 0.3, and a browser with WebGPU support.

## Example

`Canvas` owns the HTML canvas and its vgpu surface. Use `useCanvas()` to access that surface from a child component.

```tsx
import { Canvas, useCanvas, useFrameLoop, useShader } from "vgpu-react";

const gradient = `
  @fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
    return vec4f(uv, 0.0, 1.0);
  }
`;

function Gradient() {
  const target = useCanvas();
  const shader = useShader(gradient);

  useFrameLoop((frame) => {
    frame.pass(target, shader);
  });

  return null;
}

export function App() {
  return (
    <Canvas>
      <Gradient />
    </Canvas>
  );
}
```

`Canvas` creates a GPU or reuses the nearest `GpuProvider`. It mounts `Gradient` once the GPU and surface are ready. The examples below reuse the same `gradient` shader.

## Composition

All `useFrameLoop` callbacks under one provider add passes to the same frame, in subscription order. To preserve an earlier pass, use `clear: false`:

```tsx
useFrameLoop((frame) => {
  frame.pass({ target, clear: false }, shader);
});
```

The loop starts with the first subscriber and stops with the last. Set `<GpuProvider fps={30}>` to cap its frame rate. Callback errors are reported with `reportError()`; the remaining callbacks still run.

## On-demand rendering

`useFrame()` returns a function that renders one frame. Both frame hooks use the latest callback, without a dependency array.

```tsx
import { useCanvas, useFrame, useShader } from "vgpu-react";

function DrawGradient() {
  const target = useCanvas();
  const shader = useShader(gradient);
  const draw = useFrame((frame) => {
    frame.pass(target, shader);
  });

  return <button type="button" onClick={draw}>Draw</button>;
}
```

## Sharing a GPU

To share one GPU across canvases, wrap them together:

```tsx
import { Canvas, GpuProvider } from "vgpu-react";

export function App() {
  return (
    <GpuProvider>
      <Canvas />
      <Canvas />
    </GpuProvider>
  );
}
```

Pass initialization options through `options`:

```tsx
<GpuProvider options={{ requiredFeatures: ["timestamp-query"] }}>
  <Canvas />
</GpuProvider>
```

To supply an existing GPU, use `<GpuProvider gpu={existingGpu}>`. The provider disposes GPUs it creates; an external GPU stays owned by its caller. `options` and `gpu` are read once on mount. Remount with `key` to change them.

## Loading and errors

`GpuProvider` renders its `fallback` until the GPU is ready, then mounts its children. A standalone `Canvas` renders its canvas immediately with `fallback` next to it. Under a shared provider, set `fallback` on `GpuProvider`; its canvases mount when the GPU is ready. Initialization failures reach the nearest error boundary.

```tsx
<ErrorBoundary fallback={<p>WebGPU is not available.</p>}>
  <Canvas fallback={<Spinner />}>
    <Gradient />
  </Canvas>
</ErrorBoundary>
```

`ErrorBoundary` and `Spinner` are application components. Hiding an owned GPU provider with React Activity disposes its GPU; showing it creates a new GPU and remounts its children.

## Server rendering

The components include `"use client"` and can be imported from Server Components. Server HTML contains a standalone `Canvas`'s canvas and fallback, or a shared provider's fallback. GPU initialization runs after hydration.

## Bring your own canvas

`useSurface()` creates a surface from a canvas ref and disposes it on cleanup. It returns `null` until the surface is ready.

Both `Canvas` and `useSurface()` accept vgpu's `SurfaceOptions`. Changing `clearColor` updates the surface in place; changing another option recreates it. `Canvas` also accepts HTML canvas attributes.

```tsx
import { useRef } from "react";
import {
  GpuProvider,
  useFrameLoop,
  useShader,
  useSurface,
} from "vgpu-react";

function CustomRenderer() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const target = useSurface(canvas);
  const shader = useShader(gradient);

  useFrameLoop((frame) => {
    if (target) {
      frame.pass(target, shader);
    }
  });

  return <canvas ref={canvas} />;
}

export function App() {
  return (
    <GpuProvider>
      <CustomRenderer />
    </GpuProvider>
  );
}
```

## Bindings

Resources returned by the hooks are native vgpu objects. Use `useGpu()` to access the GPU and call other vgpu functions directly.

| vgpu | vgpu-react |
| --- | --- |
| `init()` | `<GpuProvider>` or `<Canvas>` |
| `initFromDevice()` | `<GpuProvider gpu={...}>` |
| `surface()` | `useSurface()` |
| `surface()` with an owned canvas | `<Canvas>` and `useCanvas()` |
| `effect()` | `useShader()` |
| `frame()` | `useFrame()` |
| `frameLoop()` | `useFrameLoop()`, one loop per provider |

`useShader()` memoizes a fullscreen effect for the component. Changing the GPU or shader source recreates it. Options apply when it is created. Update uniforms with `shader.set()`; remount with `key` to change other options.

## Migrating from 0.2

- Move `useFrameLoop(callback, { fps })` configuration to `<GpuProvider fps={...}>`. Callbacks under that provider now share one frame in subscription order.
- `useShader(source, options, deps)` no longer accepts `deps`. Update uniforms through the returned effect's `set()` method. Change `source` or remount with `key` to recreate the effect with new options.
- Surface options now follow changes: `clearColor` updates in place; other changes recreate the surface.

## Development

Use Bun 1.3.2, matching CI:

```sh
bun install --frozen-lockfile
bun run check
bun run test:coverage
bun run build
```

GitHub Actions runs lint, type checks, tests with coverage, and the build on every pull request and push to `main`. Tests enforce at least 90% line and function coverage. Each [CI run](https://github.com/roprgm/vgpu-react/actions/workflows/ci.yml) includes test results and coverage in its summary, plus a downloadable `coverage` artifact containing the LCOV report.

The integration tests use vgpu's mock adapter and a simulated DOM. They cover GPU ownership and initialization, React Activity, shared frame loops, surface updates, and server rendering. Native WebGPU rendering and browser hydration are not covered.

## Support

Report bugs and request features through [GitHub Issues](https://github.com/roprgm/vgpu-react/issues).

## License

[MIT](LICENSE)
