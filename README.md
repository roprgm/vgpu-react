# vgpu-react

React bindings for [vgpu](https://vgpu.sh): `GpuProvider` and `useGpu`.

```sh
bun add vgpu-react vgpu react
```

```tsx
import { createRoot } from "react-dom/client";
import { GpuProvider, useGpu } from "vgpu-react";

function App() {
	const gpu = useGpu();
	return null;
}

createRoot(document.getElementById("root")).render(
	<GpuProvider>
		<App />
	</GpuProvider>,
);
```

`GpuProvider` calls `init()`. Components read that `Gpu` with `useGpu` and pass it to vgpu.
