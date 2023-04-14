import type { VrHouseDetail, VrMapDetail } from "./Manifestdto";
import type { Viewer } from "@photo-sphere-viewer/core";
enum Mode {
  Edit,
  View,
}
interface VrRenderControler {
  initVrList(): Promise<void>;
  initVrViewer(): Promise<void>;
  initMarker(): void;
  renderMap(): void;
  vrList?: VrHouseDetail[];
  vrMap?: VrMapDetail;
  nowAt: number;
  viewer?: Viewer;
}
export type { VrRenderControler };
export { Mode };
