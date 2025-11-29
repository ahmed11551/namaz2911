import React from "react";
import { createRoot, Root } from "react-dom/client";
import App from "@/App";

export type MountOptions = {
  containerId?: string;
};

let root: Root | null = null;

export function mount(element?: HTMLElement, _options?: MountOptions) {
  const target =
    element ?? document.getElementById("tasbih-mount") ?? createFallbackContainer();

  if (!target) {
    throw new Error("[tasbih-remote] Unable to find mount element");
  }

  root = createRoot(target);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );

    return () => {
    if (root) {
      root.unmount();
      root = null;
    }
  };
}

export { App };

function createFallbackContainer() {
  if (typeof document === "undefined") return undefined;
  const el = document.createElement("div");
  el.id = "tasbih-mount";
  document.body.appendChild(el);
  return el;
}

