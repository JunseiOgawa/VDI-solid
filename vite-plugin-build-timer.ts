import type { Plugin } from "vite";
import { writeFileSync } from "fs";
import { resolve } from "path";

interface BuildTimerOptions {
  outputPath?: string;
}

interface BuildMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  phases: {
    name: string;
    startTime: number;
    endTime: number;
    duration: number;
  }[];
}

/**
 * Viteビルドの各フェーズの時間を計測するカスタムプラグイン
 */
export function buildTimer(options: BuildTimerOptions = {}): Plugin {
  const outputPath =
    options.outputPath || "docs/20251029_build_optimization/build-metrics.json";

  let buildStartTime = 0;
  let metrics: BuildMetrics = {
    startTime: 0,
    endTime: 0,
    duration: 0,
    phases: [],
  };

  const recordPhase = (name: string, startTime: number) => {
    const endTime = Date.now();
    metrics.phases.push({
      name,
      startTime,
      endTime,
      duration: endTime - startTime,
    });
  };

  return {
    name: "vite-plugin-build-timer",

    // ビルド開始
    buildStart() {
      buildStartTime = Date.now();
      metrics.startTime = buildStartTime;
      metrics.phases = [];
      console.log("\n🔨 ビルド開始:", new Date(buildStartTime).toISOString());
    },

    // 依存関係の解決完了
    resolveId(id) {
      if (metrics.phases.length === 0) {
        recordPhase("依存関係の解決", buildStartTime);
      }
      return null;
    },

    // バンドリング完了
    buildEnd() {
      recordPhase("バンドリング", buildStartTime);
    },

    // 全ビルド完了
    closeBundle() {
      metrics.endTime = Date.now();
      metrics.duration = metrics.endTime - metrics.startTime;

      console.log("\n✅ ビルド完了");
      console.log(
        `⏱️  総ビルド時間: ${metrics.duration}ms (${(metrics.duration / 1000).toFixed(2)}s)`,
      );

      console.log("\n📊 フェーズ別時間:");
      metrics.phases.forEach((phase) => {
        console.log(
          `  - ${phase.name}: ${phase.duration}ms (${(phase.duration / 1000).toFixed(2)}s)`,
        );
      });

      // JSONファイルに結果を出力
      try {
        const outputFilePath = resolve(process.cwd(), outputPath);
        writeFileSync(outputFilePath, JSON.stringify(metrics, null, 2));
        console.log(`\n💾 ビルド時間をファイルに保存しました: ${outputPath}`);
      } catch (error) {
        console.error("❌ ビルド時間の保存に失敗しました:", error);
      }
    },
  };
}
