type VrManifestJSON = {
  status: boolean;
  data: VrDetail[];
};

type VrHouseDetail = {
  vr_id: number;
  hus_id: number;
  picture: `${number}.${"jpg" | "png" | "webp" | "jpeg"}`;
  name: string;
  connect_position: ConnectPosition[];
  chaoxiang: `${"东" | "南" | "西" | "北"}`;
  xpoint: number;
  ypoint: number;
};
type VrDetail = {
  vr_id: number;
  hus_id: number;
  picture: `${number}.${"jpg" | "png" | "webp" | "jpeg"}`;
  name: string;
  connect_position: string | null;
  chaoxiang: `${"东" | "南" | "西" | "北"}`;
  xpoint: number | null;
  ypoint: number | null;
};
type VrMapDetail = {
  vr_id: number;
  hus_id: number;
  picture: `${number}.${"jpg" | "png" | "webp" | "jpeg"}`;
  name: "map";
  connect_position: null;
  chaoxiang: `${"东" | "南" | "西" | "北"}`;
  xpoint: null;
  ypoint: null;
};
type ConnectPosition = {
  pitch: number;
  target: number;
  yaw: number;
};
export type {
  VrManifestJSON,
  VrDetail,
  ConnectPosition,
  VrMapDetail,
  VrHouseDetail,
};
