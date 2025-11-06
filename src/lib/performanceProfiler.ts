/**
 * パフォーマンスプロファイリングユーティリティ
 *
 * Performance APIを使用して起動時のパフォーマンスを計測します。
 * 本番環境では無効化されます。
 */

export interface PerformanceMeasurement {
  name: string;
  duration: number;
  startTime: number;
  endTime?: number;
}

export interface PerformanceReport {
  measurements: PerformanceMeasurement[];
  navigationTiming: {
    domContentLoaded: number;
    domComplete: number;
    loadComplete: number;
  };
  marks: Record<string, number>;
}

class PerformanceProfiler {
  private enabled: boolean;
  private marks: Map<string, number> = new Map();
  private measurements: PerformanceMeasurement[] = [];

  constructor() {
    // 開発環境でのみ有効化(環境変数で制御可能)
    this.enabled =
      import.meta.env.DEV ||
      import.meta.env.VITE_ENABLE_PROFILING === "true";

    if (this.enabled) {
      console.log("[Profiler] Performance profiling enabled");
    }
  }

  /**
   * パフォーマンスマークを設定
   */
  mark(name: string): void {
    if (!this.enabled) return;

    try {
      const time = performance.now();
      this.marks.set(name, time);
      performance.mark(name);

      console.log(`[Profiler] Mark: ${name} at ${time.toFixed(2)}ms`);
    } catch (error) {
      console.error(`[Profiler] Failed to mark ${name}:`, error);
    }
  }

  /**
   * 2つのマーク間の時間を測定
   */
  measure(name: string, startMark: string, endMark?: string): number | null {
    if (!this.enabled) return null;

    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }

      const measures = performance.getEntriesByName(name, "measure");
      if (measures.length > 0) {
        const measure = measures[measures.length - 1];
        const measurement: PerformanceMeasurement = {
          name: measure.name,
          duration: measure.duration,
          startTime: measure.startTime,
        };
        this.measurements.push(measurement);

        console.log(
          `[Profiler] Measure: ${name} = ${measure.duration.toFixed(2)}ms`,
        );
        return measure.duration;
      }
    } catch (error) {
      console.error(`[Profiler] Failed to measure ${name}:`, error);
    }

    return null;
  }

  /**
   * 特定のマークからの経過時間を計算
   */
  measureFromMark(name: string, startMark: string): number | null {
    if (!this.enabled) return null;

    const startTime = this.marks.get(startMark);
    if (startTime === undefined) {
      console.warn(`[Profiler] Start mark not found: ${startMark}`);
      return null;
    }

    const currentTime = performance.now();
    const duration = currentTime - startTime;

    const measurement: PerformanceMeasurement = {
      name,
      duration,
      startTime,
      endTime: currentTime,
    };
    this.measurements.push(measurement);

    console.log(`[Profiler] ${name} = ${duration.toFixed(2)}ms`);
    return duration;
  }

  /**
   * すべてのマークを取得
   */
  getAllMarks(): Record<string, number> {
    if (!this.enabled) return {};

    const marks: Record<string, number> = {};
    this.marks.forEach((time, name) => {
      marks[name] = time;
    });
    return marks;
  }

  /**
   * すべての測定値を取得
   */
  getAllMeasurements(): PerformanceMeasurement[] {
    return this.measurements;
  }

  /**
   * Navigation Timing APIからページロード時間を取得
   */
  getNavigationTiming(): PerformanceReport["navigationTiming"] | null {
    if (!this.enabled) return null;

    try {
      const navigation = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;

      if (navigation) {
        return {
          domContentLoaded:
            navigation.domContentLoadedEventEnd -
            navigation.domContentLoadedEventStart,
          domComplete:
            navigation.domComplete - navigation.fetchStart,
          loadComplete: navigation.loadEventEnd - navigation.fetchStart,
        };
      }
    } catch (error) {
      console.error("[Profiler] Failed to get navigation timing:", error);
    }

    return {
      domContentLoaded: 0,
      domComplete: 0,
      loadComplete: 0,
    };
  }

  /**
   * 完全なパフォーマンスレポートを生成
   */
  getReport(): PerformanceReport {
    return {
      measurements: this.getAllMeasurements(),
      navigationTiming: this.getNavigationTiming() || {
        domContentLoaded: 0,
        domComplete: 0,
        loadComplete: 0,
      },
      marks: this.getAllMarks(),
    };
  }

  /**
   * レポートをJSON形式で出力
   */
  exportToJSON(): string {
    const report = this.getReport();
    return JSON.stringify(report, null, 2);
  }

  /**
   * コンソールに整形されたレポートを出力
   */
  printReport(): void {
    if (!this.enabled) return;

    console.group("[Profiler] Performance Report");

    // Navigation Timing
    const navTiming = this.getNavigationTiming();
    if (navTiming) {
      console.group("Navigation Timing");
      console.log(
        `DOM Content Loaded: ${navTiming.domContentLoaded.toFixed(2)}ms`,
      );
      console.log(`DOM Complete: ${navTiming.domComplete.toFixed(2)}ms`);
      console.log(`Load Complete: ${navTiming.loadComplete.toFixed(2)}ms`);
      console.groupEnd();
    }

    // Measurements
    if (this.measurements.length > 0) {
      console.group("Measurements");
      this.measurements.forEach((m) => {
        console.log(`${m.name}: ${m.duration.toFixed(2)}ms`);
      });
      console.groupEnd();
    }

    // Marks
    const marks = this.getAllMarks();
    const markEntries = Object.entries(marks);
    if (markEntries.length > 0) {
      console.group("Marks");
      markEntries
        .sort(([, a], [, b]) => a - b)
        .forEach(([name, time]) => {
          console.log(`${name}: ${time.toFixed(2)}ms`);
        });
      console.groupEnd();
    }

    console.groupEnd();
  }

  /**
   * すべてのマークと測定値をクリア
   */
  clear(): void {
    if (!this.enabled) return;

    this.marks.clear();
    this.measurements = [];
    performance.clearMarks();
    performance.clearMeasures();

    console.log("[Profiler] Cleared all marks and measurements");
  }

  /**
   * プロファイラーが有効かどうか
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// グローバルインスタンスをエクスポート
export const profiler = new PerformanceProfiler();

// 最も早い段階でのマークを設定
if (profiler.isEnabled()) {
  profiler.mark("profiler-init");
}
