import { expect, test } from "bun:test";
import { act, render, screen } from "@testing-library/react";
import {
  Activity,
  Component,
  type ReactNode,
  StrictMode,
  useEffect,
  useLayoutEffect,
} from "react";
import { createMockAdapter, type Device, type Gpu, init } from "vgpu/mock";
import { GpuProvider, useFrame, useGpu } from "../src";

function GpuStatus({ observe }: { observe: (gpu: Gpu) => void }) {
  const gpu = useGpu();
  const draw = useFrame(() => {});
  useLayoutEffect(draw, [draw]);
  useEffect(() => observe(gpu), [gpu, observe]);
  return <output>{gpu.disposed ? "GPU disposed" : "GPU ready"}</output>;
}

class ErrorBoundary extends Component<{ children: ReactNode }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return <p role="alert">{this.state.error.message}</p>;
    }
    return this.props.children;
  }
}

test("initializes without Suspense, restores Activity, and respects GPU ownership", async () => {
  const devices = new Set<Gpu>();
  const observe = (gpu: Gpu) => {
    devices.add(gpu);
  };
  const options = { adapter: createMockAdapter() };
  const tree = (mode: "visible" | "hidden") => (
    <StrictMode>
      <Activity mode={mode}>
        <GpuProvider options={options} fallback="Loading">
          <GpuStatus observe={observe} />
        </GpuProvider>
      </Activity>
    </StrictMode>
  );
  const view = render(tree("visible"));
  expect(screen.getByText("Loading")).toBeDefined();
  await act(async () => {});
  expect(screen.getByText("GPU ready")).toBeDefined();
  const [first] = devices;

  await act(async () => view.rerender(tree("hidden")));
  expect(first.disposed).toBe(true);
  await act(async () => view.rerender(tree("visible")));
  expect(screen.getByText("GPU ready")).toBeDefined();
  const [, second] = devices;
  expect(second).toBeDefined();
  expect(second.disposed).toBe(false);
  view.unmount();
  expect(second.disposed).toBe(true);

  const external = await init();
  try {
    const shared = render(
      <GpuProvider gpu={external}>
        <GpuStatus observe={observe} />
      </GpuProvider>,
    );
    await act(async () => {});
    expect(devices.has(external)).toBe(true);
    shared.unmount();
    expect(external.disposed).toBe(false);
  } finally {
    external.dispose();
  }
});

test("cancels pending initialization and reports initialization failures", async () => {
  const pending = Promise.withResolvers<Device>();
  const view = render(
    <GpuProvider
      options={{ adapter: { requestDevice: () => pending.promise } }}
      fallback="Loading"
    >
      <p>Ready</p>
    </GpuProvider>,
  );
  expect(screen.getByText("Loading")).toBeDefined();
  view.unmount();
  const late = await createMockAdapter().requestDevice();
  await act(async () => pending.resolve(late));
  expect(() => late.createBuffer({ size: 4, usage: ["copy_dst"] })).toThrow();

  const failed = Promise.withResolvers<Device>();
  const error = new Error("GPU unavailable");
  render(
    <ErrorBoundary>
      <GpuProvider
        options={{ adapter: { requestDevice: () => failed.promise } }}
        fallback="Loading"
      >
        <p>Ready</p>
      </GpuProvider>
    </ErrorBoundary>,
    { onCaughtError: () => {} },
  );
  await act(async () => failed.reject(error));
  expect(screen.getByRole("alert").textContent).toBe(error.message);
  expect(screen.queryByText("Ready")).toBeNull();
});
