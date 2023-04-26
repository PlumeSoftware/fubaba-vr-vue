import type { VrHouseDetail, VrMapDetail } from "./Manifestdto";
import type { Viewer } from "@photo-sphere-viewer/core";
enum Mode {
  Edit,
  View,
}
interface VrRenderControler {
  initVrViewer(): Promise<void>;
  initMarker(): void;
  vrList?: VrHouseDetail[];
  viewer?: Viewer;
}
export type { VrRenderControler };
export { Mode };
