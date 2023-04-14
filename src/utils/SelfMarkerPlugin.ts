export {};
import { useDebounceFn, useDraggable, useThrottleFn } from "@vueuse/core";
import {
  AbstractPlugin,
  Viewer,
  TypedEvent,
  type Position,
} from "@photo-sphere-viewer/core";
import type { ConnectPosition } from "../types/Manifestdto";
import type { WatchStopHandle } from "vue";
type Size = {
  width: number;
  height: number;
  v3d: { x: number; y: number };
};
type SelfConfig = {
  canDrag: boolean;
};
type MarkerState = {
  width: number;
  height: number;
  v3d: { x: number; y: number };
  isDragging: Ref<boolean>;
  stop: WatchStopHandle;
};
export class SelfMarkersPluginClick extends TypedEvent<SelfMarkersPlugin> {
  static override readonly type = "markerClick";
  constructor() {
    super(SelfMarkersPluginClick.type);
  }
}
export class SelfMarkersPluginTouchStart extends TypedEvent<SelfMarkersPlugin> {
  static override readonly type = "markerTouchStart";
  constructor() {
    super(SelfMarkersPluginClick.type);
  }
}
export class SelfMarkersPluginTouchEnd extends TypedEvent<SelfMarkersPlugin> {
  static override readonly type = "markerTouchEnd";
  constructor() {
    super(SelfMarkersPluginClick.type);
  }
}
export class SelfMarkersPluginTouchMove extends TypedEvent<SelfMarkersPlugin> {
  static override readonly type = "markerTouchMove";
  constructor() {
    super(SelfMarkersPluginClick.type);
  }
}
export class SelfMarkersPlugin extends AbstractPlugin<
  | SelfMarkersPluginTouchStart
  | SelfMarkersPluginTouchStart
  | SelfMarkersPluginTouchEnd
  | SelfMarkersPluginTouchMove
> {
  static override readonly id = "self-markers-plugin";
  markersHost: HTMLElement | null;
  markersCollection: Map<HTMLElement, MarkerState>;
  option: SelfConfig;

  constructor(viewer: Viewer, options: SelfConfig) {
    super(viewer);
    this.option = options;
    this.markersCollection = new Map();
    this.markersHost = document.createElement("div");
    this.markersHost.className = "self-mp-host absolute w-full h-full";
    this.viewer.container.appendChild(this.markersHost);
  }
  override init() {
    this.viewer.addEventListener("render", () => {
      //每次渲染时，更新每个marker的位置
      this.markersCollection.forEach((state, markerHost) => {
        //如果正在拖动，就不更新位置
        if (state.isDragging.value) return;
        if (this.__isMarkerVisible(markerHost)) {
          const vc = this.viewer.dataHelper.vector3ToViewerCoords(state.v3d);
          markerHost.classList.remove("invisible");
          markerHost.classList.add("visible");
          markerHost.style.top = vc.y + "px";
          markerHost.style.left = vc.x + "px";
        } else {
          markerHost.classList.remove("visible");
          markerHost.classList.add("invisible");
        }
      });
    });
  }
  setCanDrag(canDrag: boolean) {
    this.option.canDrag = canDrag;
  }
  addMarker(html: string | HTMLElement, position: ConnectPosition) {
    const markerHost = document.createElement("div");
    markerHost.className = "absolute";
    typeof html === "string"
      ? (markerHost.innerHTML = html)
      : markerHost.appendChild(html);

    this.markersHost!.appendChild(markerHost);
    const size = markerHost.getBoundingClientRect();
    const debouncedAutoRotate = useThrottleFn((position: Position) => {
      this.viewer.animate({
        pitch: position.pitch,
        yaw: position.yaw,
        speed: "3.3rpm",
      });
    }, 3300);
    const { x, y, style, isDragging } = useDraggable(markerHost, {
      preventDefault: true,
      onStart: () => {
        //如果外层设置了不能拖动，就禁止marker的拖动
        if (!this.option.canDrag) return false;
        this.dispatchEvent(new SelfMarkersPluginTouchStart());
      },
      onMove: () => {
        const position = this.__computeMarkerPosition(x.value, y.value);
        this.markersCollection.get(markerHost)!.v3d =
          this.viewer.dataHelper.sphericalCoordsToVector3(position);
        if (this.__isEngageEdge(x.value, y.value, size)) {
          debouncedAutoRotate(position);
        }
      },
      onEnd: () => {
        this.dispatchEvent(new SelfMarkersPluginTouchEnd());
      },
    });
    this.markersCollection.set(markerHost, {
      width: size.width,
      height: size.height,
      v3d: this.viewer.dataHelper.sphericalCoordsToVector3(position),
      isDragging,
      stop: watch(
        () => style.value,
        () => {
          //拖动时，style改变，从而触发这个回调
          markerHost.setAttribute("style", style.value);
        }
      ),
    });

    this.__setMarkerVisible(markerHost);
  }
  __isMarkerVisible(markerHost: HTMLElement) {
    const markersize = this.markersCollection.get(markerHost) as Size;
    const v3d = this.viewer.dataHelper.vector3ToViewerCoords(markersize.v3d);

    return (
      this.viewer.state.direction.dot(markersize.v3d) > 0 &&
      v3d.x + markersize.width >= 0 &&
      v3d.x - markersize.width <= this.viewer.state.size.width &&
      v3d.y + markersize.height >= 0 &&
      v3d.y - markersize.height <= this.viewer.state.size.height
    );
  }
  __setMarkerVisible(markerHost: HTMLElement) {
    if (this.__isMarkerVisible(markerHost)) {
      markerHost.classList.remove("invisible");
      markerHost.classList.add("visible");
    } else {
      markerHost.classList.remove("visible");
      markerHost.classList.add("invisible");
    }
  }
  __isEngageEdge(
    x: number,
    y: number,
    markerSize: { width: number; height: number }
  ) {
    return (
      x < 0 ||
      y < 0 ||
      x + markerSize.width + 3 > this.viewer.state.size.width ||
      y + markerSize.height > this.viewer.state.size.height
    );
  }
  __computeMarkerPosition(x: number, y: number): Position {
    const intersection = this.viewer.renderer
      .getIntersections({ x, y })
      .find((i) => i.object.userData["photoSphereViewer"]);
    return this.viewer.dataHelper.vector3ToSphericalCoords(intersection.point);
  }
  override destroy(): void {
    super.destroy();
    this.markersHost = null;
    this.markersCollection.forEach((state) => state.stop());
    this.markersCollection.clear();
  }
}
