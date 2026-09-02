# vgpu-react

React bindings for [vgpu](https://vgpu.sh).

```sh
bun add vgpu-react vgpu react
```

```tsx
import { createRoot } from "react-dom/client";
import { useRef } from "react";
import { GpuProvider, useFrameLoop, useSurface } from "vgpu-react";

function App() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const target = useSurface(canvas);

  useFrameLoop((frame) => {
    if (target.current) {
      // Encode rendering work against target.current.
    }
  });

  return <canvas ref={canvas} />;
}

createRoot(document.getElementById("root")).render(
  <GpuProvider>
    <App />
  </GpuProvider>,
);
```

`GpuProvider` calls `init()`. `useSurface` maps your canvas ref to a vgpu surface and disposes the surface on cleanup.

`useFrame` returns an action for on-demand rendering. Extra arguments pass through to its callback.

```tsx
const render = useFrame((frame, value: number) => {
  // Encode one frame using value.
});

render(1);
```

Use `useFrameLoop` for continuous rendering.
