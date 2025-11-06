/* @refresh reload */
import { render } from "solid-js/web";
import App from "./App";
import { profiler } from "./lib/performanceProfiler";

// index.tsx読み込み開始
profiler.mark("index-tsx-start");

// DOMContentLoadedイベントの計測
if (profiler.isEnabled()) {
  document.addEventListener("DOMContentLoaded", () => {
    profiler.mark("dom-content-loaded");
    profiler.measureFromMark(
      "html-to-dom-content-loaded",
      "html-start",
    );
  });

  window.addEventListener("load", () => {
    profiler.mark("window-load");
    profiler.measureFromMark("html-to-window-load", "html-start");
  });
}

// render呼び出し前
profiler.mark("render-start");

render(() => <App />, document.getElementById("root") as HTMLElement);

// render呼び出し後
profiler.mark("render-end");
profiler.measureFromMark("render-duration", "render-start");
