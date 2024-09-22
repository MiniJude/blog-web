// https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/drawImage
export interface CvsImgOptions {
    ctx: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;
    /** 旋转角度 Radians */
    radian: number;
    /** 未裁剪的宽 */
    realWidth: number;
    /** 未裁剪的高 */
    realHeight: number;
    sx: number;
    sy: number;
    sWidth: number;
    sHeight: number;
    dx: number;
    dy: number;
    dWidth: number;
    dHeight: number;
}

class CvsImg {
    ctx: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;
    image: HTMLImageElement;
    options: CvsImgOptions;
    /** path */
    path2D: Path2D | null = null;

    constructor(img: HTMLImageElement, options: CvsImgOptions) {
        this.ctx = options.ctx;
        this.canvas = options.canvas;
        this.image = img;
        this.options = options;
    }

    draw() {
        const { radian, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight } =
            this.options;
        this.ctx.translate(dx + dWidth / 2, dy + dHeight / 2);
        console.log("设置坐标原点", dx + dWidth / 2, dy + dHeight / 2);
        this.ctx.rotate(radian);
        this.ctx.drawImage(
            this.image,
            sx,
            sy,
            sWidth,
            sHeight,
            -dWidth / 2,
            -dHeight / 2,
            dWidth,
            dHeight
        );
        // 绘制用于点击识别的区域
        this.path2D = new Path2D();
        this.path2D.rect(-dWidth / 2, -dHeight / 2, dWidth, dHeight);

        this.ctx.fillStyle = "transparent";
        this.ctx.fill(this.path2D);
        // this.ctx.resetTransform(); // 这里不能恢复，否则点击区域会错误
    }
}

export default CvsImg;
