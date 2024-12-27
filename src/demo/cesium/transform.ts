import proj4 from "proj4";

// const position = {
//     longitude: -402.6968833739484,
//     latitude: 158.8633531918337,
//     elevation: 52.2392465899578,
// };

// <offset x="543550.592985632" y="3806443.9422425088" z="0" hdg="0"/>
// <geoReference><![CDATA[+proj=utm +zone=50 +ellps=WGS84 +datum=WGS84 +units=m +no_defs]]></geoReference>

// 从32650转到4326即可

export function utm2wgs84(x: number, y: number) {
  // 定义UTM坐标系（EPSG:32650）
  const utmProjection = "+proj=utm +zone=50 +ellps=WGS84 +datum=WGS84 +units=m +no_defs";

  // 定义目标坐标系（WGS84，EPSG:4326）
  const wgs84Projection = "+proj=longlat +datum=WGS84 +no_defs";

  // 定义UTM基准坐标
  const baseX = 543550.592985632;
  const baseY = 3806443.9422425088;
  const utmCoordinates: [number, number] = [x + baseX, y + baseY];

  // 使用proj4进行坐标转换
  const lonLat = proj4(utmProjection, wgs84Projection, utmCoordinates);

  return lonLat;
}
