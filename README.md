# vgpu-react

React bindings for [vgpu](https://vgpu.sh).

## Install

```sh
pnpm add vgpu-react vgpu react
```

Requires React 19, vgpu 0.3, and a browser with WebGPU support.

## Example

`Canvas` owns the HTML canvas and its vgpu target. Components inside it can access that target with `useCanvas()`.

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

`Canvas` mounts its own `GpuProvider` when needed and waits for the target before rendering `Gradient`, so there are no providers, refs, or nullable values in the common case. If a provider already exists, `Canvas` reuses it.

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

The loop starts with the first subscriber and stops with the last. `<GpuProvider fps={30}>` caps its frame rate.

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

## Bring your own canvas

Inside `GpuProvider`, `useSurface()` maps a canvas ref to vgpu's `surface()`. It returns `Surface | null` and disposes it on cleanup.

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
| `surface()` | `useSurface()` |
| `surface()` with an owned canvas | `<Canvas>` and `useCanvas()` |
| `effect()` | `useShader()` |
| `frame()` | `useFrame()` |
| `frameLoop()` | `useFrameLoop()`, one loop per GPU |

## Support

Report bugs and request features through [GitHub Issues](https://github.com/roprgm/vgpu-react/issues).

## License

[MIT](LICENSE)
