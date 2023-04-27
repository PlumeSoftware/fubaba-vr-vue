export {};
import {
  useDraggable,
  useThrottleFn,
  type Position as MovePosition,
} from "@vueuse/core";
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
type MarkerInfo = {
  position: ConnectPosition;
  metaData: unknown;
};
type MarkerState = {
  width: number;
  height: number;
  v3d: { x: number; y: number };
  isDragging: Ref<boolean>;
  stop: WatchStopHandle;
};
type RemoveMarkerConfig = {
  animate: boolean;
  animateName: string;
  onAnimateEnd: () => void;
};
export class SelfMarkersPluginClick extends TypedEvent<SelfMarkersPlugin> {
  static override readonly type = "markerClick";
  type: "markerClick" = "markerClick";
  originEvent: MouseEvent;
  metaData: unknown;
  constructor(e: MouseEvent, metaData?: unknown) {
    super(SelfMarkersPluginClick.type);
    this.originEvent = e;
    this.metaData = metaData;
  }
}
export class SelfMarkersPluginTouchStart extends TypedEvent<SelfMarkersPlugin> {
  static override readonly type = "markerTouchStart";
  type: "markerTouchStart" = "markerTouchStart";
  marker: HTMLElement;
  metaData: unknown;
  constructor(mk: HTMLElement, metaData: unknown) {
    super(SelfMarkersPluginTouchStart.type);
    this.marker = mk;
    this.metaData = metaData;
  }
}
export class SelfMarkersPluginTouchEnd extends TypedEvent<SelfMarkersPlugin> {
  static override readonly type = "markerTouchEnd";
  type: "markerTouchEnd" = "markerTouchEnd";
  marker: HTMLElement;
  position: Position;
  metaData: unknown;
  constructor(mk: HTMLElement, metaData: unknown, position: Position) {
    super(SelfMarkersPluginTouchEnd.type);
    this.marker = mk;
    this.metaData = metaData;
    this.position = position;
  }
}
export class SelfMarkersPluginTouchMove extends TypedEvent<SelfMarkersPlugin> {
  static override readonly type = "markerTouchMove";
  type: "markerTouchMove" = "markerTouchMove";
  position: MovePosition;
  marker: HTMLElement;
  metaData: unknown;
  constructor(p: MovePosition, marker: HTMLElement, metaData: unknown) {
    super(SelfMarkersPluginTouchMove.type);
    this.marker = marker;
    this.position = p;
    this.metaData = metaData;
  }
}
export class SelfMarkersPlugin extends AbstractPlugin<
  | SelfMarkersPluginClick
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
    this.markersHost.className =
      "self-mp-host absolute w-full h-full touch-none";
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
  public setCanDrag(canDrag: boolean) {
    this.option.canDrag = canDrag;
  }
  public addMarker(html: string | HTMLElement, info: MarkerInfo) {
    const markerHost = document.createElement("div");
    markerHost.className = "absolute invisible z-10";
    typeof html === "string"
      ? (markerHost.innerHTML = html)
      : markerHost.appendChild(html);
    markerHost.addEventListener("click", (e) =>
      this.dispatchEvent(new SelfMarkersPluginClick(e, info.metaData))
    );
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
        this.dispatchEvent(
          new SelfMarkersPluginTouchStart(markerHost, info.metaData)
        );
      },
      onMove: (p) => {
        this.dispatchEvent(
          new SelfMarkersPluginTouchMove(p, markerHost, info.metaData)
        );
        //拖动到边缘时，自动旋转
        const position = this.__computeMarkerPosition(x.value, y.value);
        this.markersCollection.get(markerHost)!.v3d =
          this.viewer.dataHelper.sphericalCoordsToVector3(position);
        if (this.__isEngageEdge(x.value, y.value, size)) {
          debouncedAutoRotate(position);
        }
      },
      onEnd: () => {
        const position = this.__computeMarkerPosition(x.value, y.value);
        this.dispatchEvent(
          new SelfMarkersPluginTouchEnd(markerHost, info.metaData, position)
        );
      },
    });
    this.markersCollection.set(markerHost, {
      width: size.width,
      height: size.height,
      v3d: this.viewer.dataHelper.sphericalCoordsToVector3(info.position),
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
  public removeAllMarker() {
    this.markersCollection.forEach((state, markerHost) => {
      state.stop();
      this.markersHost!.removeChild(markerHost);
    });
    this.markersCollection.clear();
  }
  public removeMarker(who: HTMLElement, config: RemoveMarkerConfig) {
    if (config.animate) {
      who.classList.add(config.animateName);
      who.addEventListener("transitionend", () => {
        config.onAnimateEnd();
        this.markersHost?.removeChild(who);
        this.markersCollection.get(who)?.stop();
        this.markersCollection.delete(who);
      });
    } else {
      this.markersHost?.removeChild(who);
      this.markersCollection.get(who)?.stop();
      this.markersCollection.delete(who);
    }
  }
  private __isMarkerVisible(markerHost: HTMLElement) {
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
  private __setMarkerVisible(markerHost: HTMLElement) {
    if (this.__isMarkerVisible(markerHost)) {
      markerHost.classList.remove("invisible");
      markerHost.classList.add("visible");
    } else {
      markerHost.classList.remove("visible");
      markerHost.classList.add("invisible");
    }
  }
  private __isEngageEdge(
    x: number,
    y: number,
    markerSize: { width: number; height: number }
  ) {
    return (
      x < 0 ||
      y < 0 ||
      x + markerSize.width / 2 > this.viewer.state.size.width ||
      y + markerSize.height / 2 > this.viewer.state.size.height
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
