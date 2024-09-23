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

    draw(position: { dx?: number; dy?: number } = {}) {
        const targetPostion = Object.assign({}, this.options, position);
        const { sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight } = targetPostion;

        this.ctx.drawImage(this.image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
        // 绘制用于点击识别的区域
        this.path2D = new Path2D();
        this.path2D.rect(dx, dy, dWidth, dHeight);

        this.ctx.fillStyle = "transparent";
        this.ctx.fill(this.path2D);

        // 判断是否是开发环境
        if (process.env.NODE_ENV === "development") {
            // 画整个画布的区域（用于调试）
            this.ctx.strokeStyle = "red";
            this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

export default CvsImg;
