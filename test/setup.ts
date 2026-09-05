import { afterEach, mock } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();
const { cleanup } = await import("@testing-library/react");
afterEach(() => {
  cleanup();
  mock.restore();
});
