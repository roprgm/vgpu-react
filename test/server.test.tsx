import { expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { Canvas, GpuProvider } from "../src";

function ClientOnly(): never {
  throw new Error("GPU children must not render on the server");
}

test("server rendering emits loading content without mounting GPU consumers", () => {
  const standalone = renderToString(
    <Canvas aria-label="Preview" fallback={<p>Loading</p>}>
      <ClientOnly />
    </Canvas>,
  );
  expect(standalone).toContain('<canvas aria-label="Preview"');
  expect(standalone).toContain("<p>Loading</p>");
  const shared = renderToString(
    <GpuProvider fallback={<p>Loading</p>}>
      <Canvas>
        <ClientOnly />
      </Canvas>
    </GpuProvider>,
  );
  expect(shared).toBe("<p>Loading</p>");
});
