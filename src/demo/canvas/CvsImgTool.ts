import { EventEmitter } from "@/utils/eventEmitter";
import CvsImg, { CvsImgOptions } from "./CvsImg";
import spinImg from "@/assets/spin.png";
import { calculateRotation, logCtxTransform } from "@/utils";

export enum StatusEnum {
    DRAGGING = "dragging",
    ZOOMING = "zooming",
    ROTATING = "rotating",
    CLIPING = "cliping",
    NONE = "none",
}

export enum EventType {
    // DRAG = "drag",
    // ZOOM = "zoom",
    // ROTATE = "rotate",
    // CLIP = "clip",
    UPDATE = "update",
}

enum ClipBtnName {
    TOP = "top",
    RIGHT = "right",
    BOTTOM = "bottom",
    LEFT = "left",
}

interface EventHandlerMap {
    [key: string]: (...args: any[]) => void;
    [EventType.UPDATE]: () => void;
}

interface CvsImgToolOptions {
    ctx: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;
}

class CvsImgTool extends EventEmitter<EventHandlerMap> {
    /** 当前正在操作的图片， 如果是null则不展示 */
    currentImg?: CvsImg | null;
    ctx: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;
    cornerSize: number;
    edgeWidth: number;
    status: StatusEnum = StatusEnum.NONE;
    isShow: boolean = false;

    clipBtnPath2Ds: Record<ClipBtnName, Path2D> | null = null;
    rotationBtnPath2D: Path2D | null = null;
    selectedCorner: string | null;
    selectedClipBtnName?: ClipBtnName;
    constant = {
        /** 旋转按钮半径 */
        rotationButtonRadius: 15,
        /** 旋转按钮和图片的间距 */
        rotationButtonMargin: 40,
    };

    startX: number = 0;
    startY: number = 0;
    startOptions: CvsImgOptions | null = null;

    constructor(options: CvsImgToolOptions) {
        super();
        this.ctx = options.ctx;
        this.canvas = options.canvas;
        this.cornerSize = 6;
        this.edgeWidth = 2;
        this.selectedCorner = null;

        // 添加编辑框事件
        this.addEventListeners();
    }

    setCurrentImg(img: CvsImg | null): void {
        this.currentImg = img;
    }

    // 绘制编辑框
    show(
        showConfig: {
            showEdges?: boolean;
            showRotationButton?: boolean;
            showCorners?: boolean;
            showClipButton?: boolean;
        } = {}
    ): void {
        if (!this.currentImg) return;

        const { showEdges = true, showRotationButton = true, showCorners = true, showClipButton = true } = showConfig;

        const { dWidth, dHeight } = this.currentImg.options;

        // 保存当前状态
        this.ctx.save();

        // 绘制边框
        if (showEdges) {
            this.drawEdges(-dWidth / 2, -dHeight / 2, dWidth, dHeight);
        }

        // 绘制裁剪框，分别在边框的上下左右绘制一个矩形
        if (showClipButton) {
            this.drawClipButton(-dWidth / 2, -dHeight / 2, dWidth, dHeight);
        }

        // 绘制四角圆圈（用于缩放）
        if (showCorners) {
            this.drawCornerCircles(-dWidth / 2, -dHeight / 2, dWidth, dHeight);
        }

        // 绘制旋转按钮
        if (showRotationButton) {
            this.drawRotationButton(-dWidth / 2, -dHeight / 2, dWidth, dHeight);
        }

        this.ctx.restore();
        this.isShow = true;
    }

    // 隐藏编辑框
    hide(): void {
        this.ctx.reset();
        this.currentImg?.draw();
        this.isShow = false;
    }

    // 绘制边框
    drawEdges(x: number, y: number, width: number, height: number): void {
        // 设置阴影样式
        this.ctx.shadowColor = "rgba(0, 0, 0, 0.4)"; // 灰色阴影
        this.ctx.shadowBlur = 8; // 阴影的模糊程度
        this.ctx.shadowOffsetX = 3; // 阴影的水平偏移
        this.ctx.shadowOffsetY = 3; // 阴影的垂直偏移

        this.ctx.strokeStyle = "white";
        this.ctx.lineWidth = this.edgeWidth;
        this.ctx.strokeRect(x, y, width, height);
    }

    // 绘制四个角的圆圈
    drawCornerCircles(x: number, y: number, width: number, height: number): void {
        const corners = [
            { cx: x, cy: y }, // top-left
            { cx: x + width, cy: y }, // top-right
            { cx: x, cy: y + height }, // bottom-left
            { cx: x + width, cy: y + height }, // bottom-right
        ];
        this.ctx.fillStyle = "white"; // 设置填充颜色为蓝色
        corners.forEach((corner) => {
            this.ctx.beginPath();
            this.ctx.arc(corner.cx, corner.cy, this.cornerSize, 0, 2 * Math.PI);
            this.ctx.fill();
        });
    }

    /** 绘制裁剪按钮 */
    drawClipButton(x: number, y: number, width: number, height: number) {
        // 在四条边框的正中间绘制各一个矩形，用于裁剪
        const centerX = x + width / 2;
        const centerY = y + height / 2;

        this.ctx.fillStyle = "white";
        const topClipBtnPath2D = new Path2D();
        const rightClipBtnPath2D = new Path2D();
        const bottomClipBtnPath2D = new Path2D();
        const leftClipBtnPath2D = new Path2D();

        topClipBtnPath2D.rect(centerX - 12, y - 3, 24, 6);
        rightClipBtnPath2D.rect(x + width - 3, centerY - 12, 6, 24);
        bottomClipBtnPath2D.rect(centerX - 12, y + height - 3, 24, 6);
        leftClipBtnPath2D.rect(x - 3, centerY - 12, 6, 24);

        this.ctx.fill(topClipBtnPath2D);
        this.ctx.fill(rightClipBtnPath2D);
        this.ctx.fill(bottomClipBtnPath2D);
        this.ctx.fill(leftClipBtnPath2D);

        this.clipBtnPath2Ds = {
            [ClipBtnName.TOP]: topClipBtnPath2D,
            [ClipBtnName.RIGHT]: rightClipBtnPath2D,
            [ClipBtnName.BOTTOM]: bottomClipBtnPath2D,
            [ClipBtnName.LEFT]: leftClipBtnPath2D,
        };
    }

    /** 绘制旋转按钮 */
    drawRotationButton(x: number, y: number, width: number, height: number): void {
        const centerX = x + width / 2;
        const centerY = y + height + this.constant.rotationButtonMargin;

        // 先画一个圆圈
        const rotationBtnPath2D = new Path2D();
        rotationBtnPath2D.arc(centerX, centerY, this.constant.rotationButtonRadius, 0, 2 * Math.PI);
        this.ctx.fill(rotationBtnPath2D);
        this.rotationBtnPath2D = rotationBtnPath2D;

        // 然后圆里面绘制图片
        const img = new Image();
        img.src = spinImg;
        img.onload = () => {
            this.ctx.drawImage(img, centerX - this.constant.rotationButtonRadius / 2, centerY - this.constant.rotationButtonRadius / 2, this.constant.rotationButtonRadius, this.constant.rotationButtonRadius);
            this.ctx.restore(); // 恢复之前的绘图状态
        };
    }

    /** 检查是否在裁剪按钮上 */
    isPointInClipButton(x: number, y: number) {
        if (!this.clipBtnPath2Ds) return "";
        for (const cornerName in this.clipBtnPath2Ds) {
            let isIn = this.ctx.isPointInPath(this.clipBtnPath2Ds[cornerName as ClipBtnName], x, y);
            if (isIn) return cornerName as ClipBtnName;
        }
        return "";
    }

    /** 检查是否在图片图片上 */
    isPointInImage(x: number, y: number): boolean {
        if (!this.currentImg || !this.currentImg.path2D) return false;
        return this.ctx.isPointInPath(this.currentImg.path2D!, x, y);
    }

    /** 检查是否点击在旋转按钮上 */
    isPointInRotationButton(x: number, y: number): boolean {
        if (!this.currentImg || !this.rotationBtnPath2D) return false;
        return this.ctx.isPointInPath(this.rotationBtnPath2D, x, y);
    }

    // 检查是否点击在四角
    isPointInCorner(x: number, y: number) {
        if (!this.currentImg) return "";

        const { x: imgX, y: imgY, width, height } = this.currentImg.options;
        const corners = {
            topLeft: { cx: imgX, cy: imgY },
            topRight: { cx: imgX + width, cy: imgY },
            bottomLeft: { cx: imgX, cy: imgY + height },
            bottomRight: { cx: imgX + width, cy: imgY + height },
        };

        for (const [cornerName, { cx, cy }] of Object.entries(corners)) {
            const distance = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            if (distance <= this.cornerSize) {
                return cornerName as keyof typeof corners;
            }
        }

        return "";
    }

    // 添加事件监听
    addEventListeners(): void {
        this.canvas.addEventListener("mousedown", (e: MouseEvent) => this.onMouseDown(e));
        window.addEventListener("mousemove", (e: MouseEvent) => this.onMouseMove(e));
        window.addEventListener("mouseup", () => this.onMouseUp());
    }

    /** 处理鼠标按下事件 */
    onMouseDown(e: MouseEvent): void {
        if (!this.canvas || !this.currentImg) return;
        logCtxTransform(this.ctx);
        const rect = this.canvas!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const isInsideImage = this.isPointInImage(x, y);

        if (!this.isShow && isInsideImage) {
            this.canvas.style.cursor = "grab";
            this.ctx.reset();
            this.currentImg!.draw();
            this.show();
            return;
        }
        if (this.isShow) {
            // 记录鼠标按下时的初始位置
            this.startX = e.offsetX;
            this.startY = e.offsetY;
            // 记录鼠标按下时的图片位置
            this.startOptions = JSON.parse(JSON.stringify(this.currentImg!.options));

            const whichClip = this.isPointInClipButton(x, y);

            if (whichClip) {
                this.status = StatusEnum.CLIPING;
                this.selectedClipBtnName = whichClip;
                return;
            }

            if (this.isPointInRotationButton(x, y)) {
                this.status = StatusEnum.ROTATING;
                return;
            }

            const whichCorner = this.isPointInCorner(x, y);
            if (whichCorner === "bottomLeft" || whichCorner === "topRight") {
                this.status = StatusEnum.ZOOMING;
                this.canvas.style.cursor = "nwse-resize";
                return;
            }
            if (whichCorner === "topLeft" || whichCorner === "bottomRight") {
                this.status = StatusEnum.ZOOMING;
                this.canvas.style.cursor = "nesw-resize";
                return;
            }

            // 拖拽整张图片要放在最后，因为按钮的优先级更高
            if (isInsideImage) {
                this.status = StatusEnum.DRAGGING;
                this.canvas.style.cursor = "grab";
                return;
            }

            this.hide();
        }
    }

    /** 处理鼠标移动事件 */
    onMouseMove(e: MouseEvent): void {
        if (!this.currentImg || !this.isShow) return;
        switch (this.status) {
            case "dragging":
                this.handleMouseMoveWhenDragging(e);
                break;
            case "cliping":
                this.handleMouseMoveWhenCliping(e);
                break;
            case "rotating":
                this.handleMouseMoveWhenRotate(e);
                break;
            case "zooming":
                this.resizeImage(e);
                break;
            default:
                // "none"
                this.checkPointWhenNoStatusMouseMove(e);
                break;
        }
    }

    /** 处理鼠标松开事件 */
    onMouseUp(): void {
        if (this.status !== StatusEnum.NONE) {
            this.show();
            this.status = StatusEnum.NONE;
            this.canvas.style.cursor = "default";
        }
    }

    /** 处理图片拖拽 */
    handleMouseMoveWhenDragging(e: MouseEvent): void {
        if (!this.currentImg || !this.startOptions) return;

        this.ctx.reset();

        this.canvas.style.cursor = "grabbing";
        this.currentImg.options.dx = this.startOptions.dx + e.offsetX - this.startX;
        this.currentImg.options.dy = this.startOptions.dy + e.offsetY - this.startY;
        this.currentImg.draw();
        this.show({
            showEdges: true,
            showRotationButton: false,
            showClipButton: false,
            showCorners: false,
        });
    }

    /** 处理裁剪 */
    handleMouseMoveWhenCliping(e: MouseEvent) {
        if (!this.currentImg || !this.startOptions) return;

        logCtxTransform(this.ctx);
        this.ctx.reset();
        // this.ctx.translate(0, 0);

        // 鼠标位置差
        const diffOffsetX = (e.offsetX - this.startX) * Math.cos(this.startOptions.radian);
        const diffOffsetY = (e.offsetY - this.startY) * Math.cos(this.startOptions.radian);

        const sDiffOffsetX = (this.startOptions.sWidth / this.startOptions.dWidth) * diffOffsetX;
        const sDiffOffsetY = (this.startOptions.sHeight / this.startOptions.dHeight) * diffOffsetY;

        switch (this.selectedClipBtnName) {
            case ClipBtnName.RIGHT: {
                const targetDWidth = this.startOptions.dWidth + diffOffsetX;
                const targetSWidth = this.startOptions.sWidth + sDiffOffsetX;
                if (this.startOptions.sx + this.startOptions.sWidth + sDiffOffsetX < this.startOptions.realWidth && targetDWidth > 10) {
                    this.currentImg.options.sWidth = targetSWidth;
                    this.currentImg.options.dWidth = targetDWidth;
                }
                break;
            }
            case ClipBtnName.BOTTOM: {
                const targetDHeight = this.startOptions.dHeight + diffOffsetY;
                const targetSHeight = this.startOptions.sHeight + sDiffOffsetY;
                if (this.startOptions.sy + this.startOptions.sHeight + sDiffOffsetY < this.startOptions.realHeight && targetDHeight > 10) {
                    this.currentImg.options.sHeight = targetSHeight;
                    this.currentImg.options.dHeight = targetDHeight;
                }
                break;
            }
            case ClipBtnName.TOP: {
                const total = this.startOptions.dy + this.startOptions.dHeight;
                const targetDy = this.startOptions.dy + diffOffsetY;
                const targetDHeight = total - targetDy;
                const targetSy = this.startOptions.sy + sDiffOffsetY;
                const targetSHeight = this.startOptions.sHeight - sDiffOffsetY;

                if (this.startOptions.sy + sDiffOffsetY < this.startOptions.sHeight && this.startOptions.sy + sDiffOffsetY > 0) {
                    this.currentImg.options.dy = targetDy;
                    this.currentImg.options.dHeight = targetDHeight;
                    this.currentImg.options.sy = targetSy;
                    this.currentImg.options.sHeight = targetSHeight;
                }
                break;
            }
            case ClipBtnName.LEFT: {
                const total = this.startOptions.dx + this.startOptions.dWidth;
                const targetDx = this.startOptions.dx + diffOffsetX;
                const targetDWidth = total - targetDx;
                const targetSx = this.startOptions.sx + sDiffOffsetX;
                const targetSWidth = this.startOptions.sWidth - sDiffOffsetX;
                if (this.startOptions.sx + sDiffOffsetX < this.startOptions.sWidth && this.startOptions.sx + sDiffOffsetX > 0) {
                    this.currentImg.options.dx = targetDx;
                    this.currentImg.options.dWidth = targetDWidth;
                    this.currentImg.options.sx = targetSx;
                    this.currentImg.options.sWidth = targetSWidth;
                }
                break;
            }
        }

        this.currentImg!.draw();
        this.show({
            showEdges: true,
            showRotationButton: false,
            showClipButton: false,
            showCorners: false,
        });
    }

    /** 处理旋转 */
    handleMouseMoveWhenRotate(e: MouseEvent) {
        if (!this.currentImg || !this.startOptions) return;

        this.ctx.reset();

        const { dx, dy, dWidth, dHeight } = this.currentImg.options;
        const centerPoint: [number, number] = [dx + dWidth / 2, dy + dHeight / 2];
        // 获取当前canvas的
        console.log([this.startX, this.startY], centerPoint, [e.offsetX, e.offsetY]);
        const radian = calculateRotation([this.startX, this.startY], centerPoint, [e.offsetX, e.offsetY]);
        this.currentImg.options.radian = this.startOptions!.radian + radian;
        this.currentImg.draw();
        this.show({
            showEdges: true,
            showRotationButton: false,
            showClipButton: false,
            showCorners: false,
        });
    }

    /** 鼠标移动时对鼠标位置判断，改变对应状态 */
    checkPointWhenNoStatusMouseMove(e: MouseEvent) {
        if (!this.currentImg || !this.isShow) return;

        const rect = this.canvas!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const whichClip = this.isPointInClipButton(x, y);

        // 是否在裁剪按钮内
        if (whichClip === ClipBtnName.LEFT || whichClip === ClipBtnName.RIGHT) {
            this.canvas.style.cursor = "e-resize";
            return;
        }

        if (whichClip === ClipBtnName.TOP || whichClip === ClipBtnName.BOTTOM) {
            this.canvas.style.cursor = "n-resize";
            return;
        }

        // 是否在缩放按钮内
        const whichCorner = this.isPointInCorner(x, y);
        if (whichCorner === "bottomLeft" || whichCorner === "topRight") {
            this.canvas.style.cursor = "nesw-resize";
            return;
        }
        if (whichCorner === "topLeft" || whichCorner === "bottomRight") {
            this.canvas.style.cursor = "nwse-resize";
            return;
        }

        if (this.isPointInImage(x, y)) {
            this.canvas.style.cursor = "grab";
            return;
        }

        if (this.isPointInRotationButton(x, y)) {
            this.canvas.style.cursor = "pointer";
            return;
        }

        this.canvas.style.cursor = "default";
    }

    // 实现等比缩放功能
    resizeImage(e: MouseEvent): void {
        // 等比缩放逻辑
        // 更新图片大小
        // this.options.width = newWidth;
        // this.options.height = newHeight;
    }
}

export default CvsImgTool;
