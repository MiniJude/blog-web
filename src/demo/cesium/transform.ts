import proj4 from "proj4";

// const position = {
//     longitude: -402.6968833739484,
//     latitude: 158.8633531918337,
//     elevation: 52.2392465899578,
// };

// <offset x="543550.592985632" y="3806443.9422425088" z="0" hdg="0"/>
// <geoReference><![CDATA[+proj=utm +zone=50 +ellps=WGS84 +datum=WGS84 +units=m +no_defs]]></geoReference>

// 从32650转到4326即可

// 定义投影坐标系（EPSG:32650）
const utmProjection = '+proj=utm +zone=50 +ellps=WGS84 +datum=WGS84 +units=m +no_defs';

// 定义目标坐标系（WGS84，EPSG:4326）
const wgs84Projection = '+proj=longlat +datum=WGS84 +no_defs';

// 定义UTM坐标（EPSG:32650）
const utmCoordinates = [543550.592985632, 3806443.9422425088];

// 使用proj4进行坐标转换
export const lonLat = proj4(utmProjection, wgs84Projection, utmCoordinates);

console.log('经纬度:', lonLat);  // 输出 [经度, 纬度]