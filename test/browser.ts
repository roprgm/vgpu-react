import { mock, spyOn } from "bun:test";

export function mockBrowser() {
  const scheduled = new Map<number, FrameRequestCallback>();
  let nextId = 0;
  spyOn(globalThis, "requestAnimationFrame").mockImplementation((callback) => {
    scheduled.set(++nextId, callback);
    return nextId;
  });
  spyOn(globalThis, "cancelAnimationFrame").mockImplementation((id) => {
    scheduled.delete(id);
  });
  const errors = mock<(error: unknown) => void>(() => {});
  spyOn(globalThis, "reportError").mockImplementation(errors);
  const canvasPrototype: { getContext: (id: string) => unknown } =
    HTMLCanvasElement.prototype;
  spyOn(canvasPrototype, "getContext").mockImplementation(function (
    this: HTMLCanvasElement,
  ) {
    const canvas = this;
    let configuration: GPUCanvasConfiguration | null = null;
    // happy-dom has no WebGPU canvas context; textures still come from vgpu's mock device.
    return {
      canvas,
      configure(value: GPUCanvasConfiguration) {
        configuration = value;
      },
      unconfigure() {
        configuration = null;
      },
      getConfiguration() {
        return configuration;
      },
      getCurrentTexture() {
        if (!configuration) {
          throw new Error("Canvas is not configured");
        }
        return configuration.device.createTexture({
          size: [canvas.width, canvas.height],
          format: configuration.format,
          usage: configuration.usage ?? 16,
        });
      },
    };
  });
  return {
    errors,
    pendingFrames: () => scheduled.size,
    advanceFrame(time: number) {
      const callbacks = [...scheduled.values()];
      scheduled.clear();
      for (const callback of callbacks) {
        callback(time);
      }
    },
  };
}
