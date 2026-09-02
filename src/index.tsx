import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import { type Gpu, init } from "vgpu";

const GpuContext = createContext<Gpu | null>(null);

export function GpuProvider({ children }: { children: ReactNode }): ReactNode {
	const [gpu, setGpu] = useState<Gpu | null>(null);

	useEffect(() => {
		let cancelled = false;
		let instance: Gpu | undefined;

		void init().then((created) => {
			if (cancelled) {
				created.dispose();
				return;
			}
			instance = created;
			setGpu(created);
		});

		return () => {
			cancelled = true;
			instance?.dispose();
		};
	}, []);

	if (!gpu) {
		return null;
	}

	return <GpuContext value={gpu}>{children}</GpuContext>;
}

export function useGpu(): Gpu {
	const gpu = useContext(GpuContext);
	if (!gpu) {
		throw new Error("useGpu must be used within GpuProvider");
	}
	return gpu;
}
