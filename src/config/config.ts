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
}

export const CONFIG: AppConfig = {
  zoom: {
    minScale: 0.1,
    maxScale: 10,
    step: 0.1,
    wheelSensitivity: 1.0,
    minWheelSensitivity: 0.1,
    maxWheelSensitivity: 5.0,
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
};
