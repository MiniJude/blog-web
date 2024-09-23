export function calculateRotation(startPoint: [number, number], midPoint: [number, number], endPoint: [number, number]) {
    const [x1, y1] = midPoint; // 图片中心点
    const [x2, y2] = startPoint; // 鼠标按下点
    const [x3, y3] = endPoint; // 当前鼠标点

    // 计算中心点到按下点和当前点的相对向量
    const V2 = { x: x2 - x1, y: y2 - y1 }; // 从中心点到鼠标按下点的向量
    const V3 = { x: x3 - x1, y: y3 - y1 }; // 从中心点到当前鼠标点的向量

    // 计算向量的夹角
    const angleV2 = Math.atan2(V2.y, V2.x);
    const angleV3 = Math.atan2(V3.y, V3.x);

    // 计算旋转角度并返回弧度
    let rotationAngle = angleV3 - angleV2;

    // 确保角度在[-π, π]范围内
    rotationAngle = ((rotationAngle + Math.PI) % (2 * Math.PI)) - Math.PI;

    return rotationAngle;
}

// 打印ctx的旋转角度
export function getCtxTransform(ctx: CanvasRenderingContext2D) {
    // 获取当前变换矩阵
    const transform = ctx.getTransform();
    // 计算旋转角度
    const radian = Math.atan2(transform.b, transform.a); // 使用矩阵的元素计算角度
    const origin = { x: transform.e, y: transform.f };
    console.log("当前旋转角度（度）:", radian * (180 / Math.PI), "当前坐标原点:", origin);
    return { radian, origin };
}
