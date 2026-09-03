# vgpu-react

React bindings for [vgpu](https://vgpu.sh).

## Install

```sh
pnpm add vgpu-react vgpu react
```

Requires React 19, vgpu 0.3, and a browser with WebGPU support.

## Example

`Canvas` owns the HTML canvas and its vgpu target. Components inside it can access that target with `useCanvas()`. It accepts vgpu's `SurfaceOptions` alongside canvas attributes; changing `clearColor` updates the surface in place, changing any other option recreates it.

```tsx
import { Canvas, useCanvas, useFrameLoop, useShader } from "vgpu-react";

import gradient from "./gradient.wgsl";

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

`Canvas` mounts its own `GpuProvider` when needed and reuses one if it already exists. The `<canvas>` element renders immediately; `Gradient` mounts once the GPU and its surface are ready, so there are no providers, refs, or nullable values in the common case.

## Composition

Every `useFrameLoop` under one `GpuProvider` runs inside a single frame loop, in mount order, so components add passes to the same frame rather than racing separate loops. A component that draws over what an earlier one drew keeps it with `clear: false`.

```tsx
function Overlay() {
  const target = useCanvas();
  const shader = useShader(overlay);

  useFrameLoop((frame) => {
    frame.pass({ target, clear: false }, shader);
  });

  return null;
}

export function App() {
  return (
    <Canvas>
      <Gradient />
      <Overlay />
    </Canvas>
  );
}
```

The loop starts with the first subscriber and stops with the last. `<GpuProvider fps={30}>` caps its frame rate. An error thrown by one callback is reported with `reportError()` and doesn't stop the loop for the others.

## On-demand rendering

Components inside `Canvas` can render a frame from any React event.

```tsx
import { useCanvas, useFrame, useShader } from "vgpu-react";

import gradient from "./gradient.wgsl";

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

`options` goes to vgpu's `init()`. To use a GPU created elsewhere, for example with `initFromDevice()`, pass it as `gpu`; the provider then leaves disposal to whoever created it. Both are read once on mount, so inline objects are safe; a new device means everything under the provider is recreated, so to change them remount with `key`.

```tsx
<GpuProvider options={{ requiredFeatures: ["timestamp-query"] }}>
```

## Loading and errors

`GpuProvider` renders its children right away. Hooks suspend until the GPU is ready and throw if `init()` fails, so React's `Suspense` and error boundaries apply. `Canvas` brings its own `Suspense` boundary, so the `<canvas>` stays in the DOM while loading; its `fallback` renders next to it in the meantime. Components that use the hooks outside `Canvas` need a `Suspense` boundary above them, or React holds the app's initial render until the GPU resolves.

```tsx
<ErrorBoundary fallback={<p>WebGPU is not available.</p>}>
  <Canvas fallback={<Spinner />}>
    <Gradient />
  </Canvas>
</ErrorBoundary>
```

## Server rendering

The components are marked `"use client"`, so they can be imported from Server Components directly. On the server, the hooks throw instead of suspending; React puts the `<canvas>` and the `fallback` in the HTML and renders the GPU content on the client after hydration.

## Bring your own canvas

Inside `GpuProvider`, `useSurface()` maps a canvas ref to vgpu's `surface()`. It returns `Surface | null`, follows option changes the same way `Canvas` does, and disposes the surface on cleanup. `CustomRenderer` below suspends as a whole, so its `<canvas>` appears when the GPU is ready; to show it sooner, render it in a parent and pass the ref down.

```tsx
import { useRef } from "react";
import {
  GpuProvider,
  useFrameLoop,
  useShader,
  useSurface,
} from "vgpu-react";

import gradient from "./gradient.wgsl";

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

Each binding keeps the underlying vgpu call visible. React supplies context and cleanup where needed.

| vgpu | vgpu-react |
| --- | --- |
| `init()` | `<GpuProvider>` or `<Canvas>` |
| `initFromDevice()` | `<GpuProvider gpu={...}>` |
| `surface()` | `useSurface()` |
| `surface()` with an owned canvas | `<Canvas>` and `useCanvas()` |
| `effect()` | `useShader()`, options read once; update uniforms with `set()` |
| `frame()` | `useFrame()` |
| `frameLoop()` | `useFrameLoop()`, one loop per GPU |

## Support

Report bugs and request features through [GitHub Issues](https://github.com/roprgm/vgpu-react/issues).

## License

[MIT](LICENSE)
