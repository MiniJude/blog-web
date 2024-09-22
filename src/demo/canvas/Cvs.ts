import CvsImg from "./CvsImg";
import CvsImgTool, { EventType, StatusEnum } from "./CvsImgTool";

// interface CvsImg

interface CvsOptions {
    width?: number;
    height?: number;
    maxImgWidth?: number;
    maxImgHeight?: number;
}

class Cvs {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D | null = null;
    options: Required<CvsOptions>;
    cvsImg: CvsImg | null = null;
    cvsImgTool: CvsImgTool; // 用于处理图片的实例

    constructor(canvasEle: HTMLCanvasElement, options?: CvsOptions) {
        const defaultOptions = this.getDefaultOptions();
        this.options = { ...defaultOptions, ...options };

        this.canvas = canvasEle;
        this.initCanvas(); // 初始化canvas

        this.cvsImgTool = new CvsImgTool({
            canvas: this.canvas,
            ctx: this.ctx!,
        }); // 初始化图片处理工具

        // 监听图片处理工具的事件，再进行相应绘制
        this.cvsImgTool.on(EventType.UPDATE, () => {
            this.drawImage();
        });
    }

    private readonly getDefaultOptions = (): Required<CvsOptions> => ({
        width: 1200,
        height: 800,
        maxImgWidth: 400,
        maxImgHeight: 300,
    });

    initCanvas(): void {
        this.canvas.width = this.options.width;
        this.canvas.height = this.options.height;
        this.canvas.style.borderRadius = "8px";
        this.ctx = this.canvas.getContext("2d");
    }

    /** 新增一个图片 */
    addImage(imgSrc: string): void {
        const img = new Image();
        img.src = imgSrc;
        img.onload = () => {
            // 调整图片大小以适应最大宽高
            const { width, height } = this.calculateImageSize(
                img.width,
                img.height
            );

            // 创建CvsImg实例
            const newCvsImg = new CvsImg(img, {
                canvas: this.canvas,
                ctx: this.ctx!,
                radian: 0,
                realWidth: img.width,
                realHeight: img.height,
                sx: 0,
                sy: 0,
                sWidth: img.width,
                sHeight: img.height,
                dx: (this.options.width - width) / 2,
                dy: (this.options.height - height) / 2,
                dWidth: width,
                dHeight: height,
            });

            this.cvsImg = newCvsImg;

            // 清除画布
            this.clearCanvas();

            // 重新绘制所有图片
            this.drawImage();

            this.cvsImgTool.setCurrentImg(this.cvsImg);
        };
    }

    /** 计算合适的图片宽高 */
    calculateImageSize(
        width: number,
        height: number
    ): { width: number; height: number } {
        const { maxImgWidth, maxImgHeight } = this.options;

        let newWidth = width;
        let newHeight = height;

        if (width > maxImgWidth || height > maxImgHeight) {
            const widthRatio = maxImgWidth / width;
            const heightRatio = maxImgHeight / height;
            const scale = Math.min(widthRatio, heightRatio); // 按比例缩放
            newWidth = width * scale;
            newHeight = height * scale;
        }

        return { width: newWidth, height: newHeight };
    }

    /** 清空画布 */
    clearCanvas(): void {
        this.ctx?.reset();
    }

    /** 绘制图片 */
    drawImage(): void {
        if (!this.ctx || !this.cvsImg) return;

        this.cvsImg.draw();
    }
}

export default Cvs;
