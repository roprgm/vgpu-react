# vgpu-react

React bindings for [vgpu](https://vgpu.sh).

```sh
pnpm add vgpu-react vgpu react
```

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
| `frameLoop()` | `useFrameLoop()` |

## License

[MIT](LICENSE)
