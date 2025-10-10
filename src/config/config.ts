// VDI Application Configuration

export interface AppConfig {
  zoom: {
    minScale: number;
    maxScale: number;
    step: number;
    wheelSensitivity: number;
    minWheelSensitivity: number;
    maxWheelSensitivity: number;
  };
  ui: {
    headerFooterHeight: number;
  };
  rotation: {
    step: number;
  };
  grid: {
    defaultOpacity: number;
    minOpacity: number;
    maxOpacity: number;
  };
  histogram: {
    enabled: boolean;
    displayType: 'rgb' | 'luminance';
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    size: number;
    opacity: number;
    minSize: number;
    maxSize: number;
    minOpacity: number;
    maxOpacity: number;
    cacheSize: number;
  };
}

export const CONFIG: AppConfig = {
  zoom: {
    minScale: 0.1,
    maxScale: 10,
    step: 0.1,
    wheelSensitivity: 1.0,
    minWheelSensitivity: 0.05,
    maxWheelSensitivity: 2.0,
  },
  ui: {
    headerFooterHeight: 120,
  },
  rotation: {
    step: 90,
  },
  grid: {
    defaultOpacity: 0.5,
    minOpacity: 0.1,
    maxOpacity: 1.0,
  },
  histogram: {
    enabled: false,
    displayType: 'rgb',
    position: 'top-right',
    size: 1.0,
    opacity: 0.8,
    minSize: 0.5,
    maxSize: 2.0,
    minOpacity: 0.0,
    maxOpacity: 1.0,
    cacheSize: 5,
  },
};
