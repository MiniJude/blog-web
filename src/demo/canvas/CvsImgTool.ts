import { EventEmitter } from "@/utils/eventEmitter";
import CvsImg, { CvsImgOptions } from "./CvsImg";
import spinImg from "@/assets/spin.png";
import { calculateRotation, getCtxTransform } from "@/utils";

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

enum CornerBtnName {
    TOP_LEFT = "top_left",
    TOP_RIGHT = "top_right",
    BOTTOM_LEFT = "bottom_left",
    BOTTOM_RIGHT = "bottom_right",
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
    currentImg?: CvsImg | null;
    ctx: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;
    cornerSize: number;
    edgeWidth: number;
    status: StatusEnum = StatusEnum.NONE;
    isShow: boolean = false;

    // 四条边上的裁剪按钮
    clipBtnPath2Ds: Record<ClipBtnName, Path2D> | null = null;
    selectedClipBtnName?: ClipBtnName;
    // 四个角上的缩放按钮
    cornerBtnPath2Ds: Record<CornerBtnName, Path2D> | null = null;
    selectedCornerBtnName?: CornerBtnName;
    // 旋转按钮
    rotationBtnPath2D: Path2D | null = null;

    constant = {
        /** 旋转按钮半径 */
        rotationButtonRadius: 15,
        /** 旋转按钮和图片的间距 */
        rotationButtonMargin: 40,
    };

    startXOnCanvas: number = 0;
    startYOnCanvas: number = 0;
    startOptions: CvsImgOptions | null = null;

    constructor(options: CvsImgToolOptions) {
        super();
        this.ctx = options.ctx;
        this.canvas = options.canvas;
        this.cornerSize = 6;
        this.edgeWidth = 2;

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
        } = {},
        position: { dx?: number; dy?: number } = {}
    ): void {
        if (!this.currentImg) return;

        const { showEdges = true, showRotationButton = true, showCorners = true, showClipButton = true } = showConfig;

        const targetPostion = Object.assign({}, this.currentImg.options, position);
        const { dx, dy, dWidth, dHeight } = targetPostion;

        // 保存当前状态
        this.ctx.save();

        // 绘制边框
        if (showEdges) {
            this.drawEdges(dx, dy, dWidth, dHeight);
        }

        // 绘制裁剪框，分别在边框的上下左右绘制一个矩形
        if (showClipButton) {
            this.drawClipButton(dx, dy, dWidth, dHeight);
        }

        // 绘制四角圆圈（用于缩放）
        if (showCorners) {
            this.drawCornerCircles(dx, dy, dWidth, dHeight);
        }

        // 绘制旋转按钮
        if (showRotationButton) {
            this.drawRotationButton(dx, dy, dWidth, dHeight);
        }

        this.ctx.restore();
        this.isShow = true;
    }

    /** 隐藏编辑框 */
    hide(): void {
        this.ctx.clearRect(-this.canvas.width / 2, -this.canvas.height / 2, this.canvas.width, this.canvas.height);
        this.currentImg?.draw();
        this.isShow = false;
    }

    /** 绘制边框 */
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

    /** 绘制四个角的圆圈 */
    drawCornerCircles(x: number, y: number, width: number, height: number): void {
        this.ctx.fillStyle = "white";
        const topLeftBtnPath2D = new Path2D();
        const topRightBtnPath2D = new Path2D();
        const bottomLeftBtnPath2D = new Path2D();
        const bottomRightBtnPath2D = new Path2D();

        topLeftBtnPath2D.arc(x, y, this.cornerSize, 0, 2 * Math.PI);
        topRightBtnPath2D.arc(x + width, y, this.cornerSize, 0, 2 * Math.PI);
        bottomLeftBtnPath2D.arc(x, y + height, this.cornerSize, 0, 2 * Math.PI);
        bottomRightBtnPath2D.arc(x + width, y + height, this.cornerSize, 0, 2 * Math.PI);

        this.ctx.fill(topLeftBtnPath2D);
        this.ctx.fill(topRightBtnPath2D);
        this.ctx.fill(bottomLeftBtnPath2D);
        this.ctx.fill(bottomRightBtnPath2D);

        this.cornerBtnPath2Ds = {
            [CornerBtnName.TOP_LEFT]: topLeftBtnPath2D,
            [CornerBtnName.TOP_RIGHT]: topRightBtnPath2D,
            [CornerBtnName.BOTTOM_LEFT]: bottomLeftBtnPath2D,
            [CornerBtnName.BOTTOM_RIGHT]: bottomRightBtnPath2D,
        };
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
        for (const clipBtnName in this.clipBtnPath2Ds) {
            let isIn = this.ctx.isPointInPath(this.clipBtnPath2Ds[clipBtnName as ClipBtnName], x, y);
            if (isIn) return clipBtnName as ClipBtnName;
        }
        return "";
    }

    /** 检查是否点击在四角 */
    isPointInCorner(x: number, y: number) {
        if (!this.cornerBtnPath2Ds) return "";
        for (const cornerBtnName in this.cornerBtnPath2Ds) {
            let isIn = this.ctx.isPointInPath(this.cornerBtnPath2Ds[cornerBtnName as CornerBtnName], x, y);
            if (isIn) return cornerBtnName as CornerBtnName;
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

    /** 添加事件监听 */
    addEventListeners(): void {
        this.canvas.addEventListener("mousedown", (e: MouseEvent) => this.onMouseDown(e));
        window.addEventListener("mousemove", (e: MouseEvent) => this.onMouseMove(e));
        window.addEventListener("mouseup", () => this.onMouseUp());
    }

    /** 处理鼠标按下事件 */
    onMouseDown(e: MouseEvent): void {
        if (!this.canvas || !this.currentImg) return;
        getCtxTransform(this.ctx);
        const rect = this.canvas!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const isInsideImage = this.isPointInImage(x, y);

        if (!this.isShow && isInsideImage) {
            this.canvas.style.cursor = "grab";
            this.currentImg!.draw();
            this.show();
            return;
        }
        if (this.isShow) {
            // 记录鼠标按下时的初始位置
            const canvasPoint = this.convertPoint2Convas([e.offsetX, e.offsetY]);
            this.startXOnCanvas = canvasPoint[0];
            this.startYOnCanvas = canvasPoint[1];
            // 记录鼠标按下时的图片位置
            this.startOptions = JSON.parse(JSON.stringify(this.currentImg!.options));

            const whichClip = this.isPointInClipButton(x, y);
            if (whichClip) {
                this.status = StatusEnum.CLIPING;
                this.selectedClipBtnName = whichClip;
                return;
            }

            const whichCorner = this.isPointInCorner(x, y);
            if (whichCorner) {
                this.status = StatusEnum.ZOOMING;
                this.selectedCornerBtnName = whichCorner;
                return;
            }

            if (this.isPointInRotationButton(x, y)) {
                this.status = StatusEnum.ROTATING;
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
        // 如果鼠标不在画布上直接返回
        if (e.target !== this.canvas) return;

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
                this.handleMouseMoveWhenZooming(e);
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
            const { dx, dy, dWidth, dHeight } = this.currentImg!.options;
            if (this.status === StatusEnum.CLIPING) {
                // 当前图片中心点坐标
                const center = {
                    x: dx + dWidth! / 2,
                    y: dy + dHeight / 2,
                };
                const diffX = -center.x;
                const diffY = -center.y;

                switch (this.selectedClipBtnName) {
                    case ClipBtnName.RIGHT: {
                        this.ctx.translate(-diffX, 0);
                        this.currentImg!.options.dx += diffX;
                        break;
                    }
                    case ClipBtnName.BOTTOM: {
                        this.ctx.translate(0, -diffY);
                        this.currentImg!.options.dy += diffY;
                        break;
                    }
                    case ClipBtnName.TOP: {
                        this.ctx.translate(0, -diffY);
                        this.currentImg!.options.dy += diffY;
                        break;
                    }
                    case ClipBtnName.LEFT: {
                        this.ctx.translate(-diffX, 0);
                        this.currentImg!.options.dx += diffX;
                        break;
                    }
                }
            }
            this.ctx.clearRect(-this.canvas.width / 2, -this.canvas.height / 2, this.canvas.width, this.canvas.height);
            this.currentImg?.draw();
            this.show();
            this.status = StatusEnum.NONE;
            this.canvas.style.cursor = "default";
        }
    }

    /** 处理图片拖拽 */
    handleMouseMoveWhenDragging(e: MouseEvent): void {
        if (!this.currentImg || !this.startOptions) return;

        this.ctx.clearRect(-this.canvas.width / 2, -this.canvas.height / 2, this.canvas.width, this.canvas.height);

        // 计算鼠标移动的距离
        const [offsetX, offsetY] = this.convertPoint2Convas([e.offsetX, e.offsetY]);
        const diffX = offsetX - this.startXOnCanvas;
        const diffY = offsetY - this.startYOnCanvas;

        // translate是对当前的偏移量进行修改，而不是直接设置，因此只需要设置偏移量差即可
        this.ctx.translate(diffX, diffY);

        this.currentImg.draw();
        this.show({
            showEdges: true,
            showRotationButton: false,
            showClipButton: false,
            showCorners: false,
        });

        // this.startXOnCanvas = offsetX;
        // this.startYOnCanvas = offsetY;
    }

    /** 处理裁剪 */
    handleMouseMoveWhenCliping(e: MouseEvent) {
        if (!this.currentImg || !this.startOptions) return;

        this.ctx.clearRect(-this.canvas.width / 2, -this.canvas.height / 2, this.canvas.width, this.canvas.height);

        // 鼠标位置差
        const [offsetX, offsetY] = this.convertPoint2Convas([e.offsetX, e.offsetY]);
        const diffOffsetX = (offsetX - this.startXOnCanvas) * Math.cos(this.startOptions.radian);
        const diffOffsetY = (offsetY - this.startYOnCanvas) * Math.cos(this.startOptions.radian);

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

    /** 处理缩放 */
    handleMouseMoveWhenZooming(e: MouseEvent) {
        if (!this.currentImg || !this.startOptions) return;
        this.ctx.clearRect(-this.canvas.width / 2, -this.canvas.height / 2, this.canvas.width, this.canvas.height);

        const { dWidth, dHeight } = this.currentImg.options;

        // 鼠标位置差
        const [offsetX] = this.convertPoint2Convas([e.offsetX, e.offsetY]);
        const diffOffsetX = (offsetX - this.startXOnCanvas) * Math.cos(this.startOptions.radian);

        // 当前宽高比
        const currentRatio = dWidth / dHeight;

        switch (this.selectedCornerBtnName) {
            case CornerBtnName.TOP_RIGHT: {
                this.canvas.style.cursor = "nesw-resize";
                this.currentImg.options.dWidth = this.startOptions.dWidth + diffOffsetX;
                this.currentImg.options.dHeight = this.currentImg.options.dWidth / currentRatio;
                break;
            }
            case CornerBtnName.BOTTOM_RIGHT: {
                this.canvas.style.cursor = "nwse-resize";
                this.currentImg.options.dWidth = this.startOptions.dWidth + diffOffsetX;
                this.currentImg.options.dHeight = this.currentImg.options.dWidth / currentRatio;
                break;
            }
            case CornerBtnName.TOP_LEFT: {
                this.canvas.style.cursor = "nwse-resize";
                this.currentImg.options.dWidth = this.startOptions.dWidth - diffOffsetX;
                this.currentImg.options.dHeight = this.currentImg.options.dWidth / currentRatio;
                break;
            }
            case CornerBtnName.BOTTOM_LEFT: {
                this.canvas.style.cursor = "nesw-resize";
                this.currentImg.options.dWidth = this.startOptions.dWidth - diffOffsetX;
                this.currentImg.options.dHeight = this.currentImg.options.dWidth / currentRatio;
                break;
            }
        }

        this.currentImg.options.dx = -this.currentImg.options.dWidth / 2;
        this.currentImg.options.dy = -this.currentImg.options.dHeight / 2;

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
        console.log("rotate");
        if (!this.currentImg || !this.startOptions) return;

        // 开始时画布原点是左上角
        this.ctx.clearRect(-this.canvas.width / 2, -this.canvas.height / 2, this.canvas.width, this.canvas.height);

        const { dWidth, dHeight } = this.currentImg.options;

        // 获取先后两点在canvas中的位置
        const startPoint: [number, number] = [this.startXOnCanvas, this.startYOnCanvas];
        const endPoing = this.convertPoint2Convas([e.offsetX, e.offsetY]);

        const centerPoint: [number, number] = [0, 0];
        const radian = calculateRotation(startPoint, centerPoint, endPoing);
        this.currentImg.options.radian = this.startOptions!.radian + radian;

        // 设置dx，dy为负的宽高的一半
        const position = { dx: -dWidth / 2, dy: -dHeight / 2 };

        // 旋转和平移一样是叠加的，所以只能在这里执行
        this.ctx.rotate(radian);

        this.currentImg.draw(position);
        this.show(
            {
                showEdges: true,
                showRotationButton: false,
                showClipButton: false,
                showCorners: false,
            },
            position
        );
        this.startXOnCanvas = startPoint[0];
        this.startYOnCanvas = startPoint[1];
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
        if (whichCorner === CornerBtnName.BOTTOM_LEFT || whichCorner === CornerBtnName.TOP_RIGHT) {
            this.canvas.style.cursor = "nesw-resize";
            return;
        }
        if (whichCorner === CornerBtnName.TOP_LEFT || whichCorner === CornerBtnName.BOTTOM_RIGHT) {
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

    /**
     * dom坐标转换成canvas坐标
     */
    convertPoint2Convas([x, y]: [number, number]): [number, number] {
        const { radian, origin } = getCtxTransform(this.ctx);
        x = x - origin.x;
        y = y - origin.y;

        if (radian) {
            var len = Math.sqrt(x * x + y * y);
            // 屏幕坐标系中，原点、按下点连线与屏幕坐标系X轴的夹角弧度
            var oldR = Math.atan2(y, x);
            // canvas坐标系中，原点、按下点连线与canvas坐标系x轴的夹角弧度
            var newR = oldR - radian;
            x = len * Math.cos(newR);
            y = len * Math.sin(newR);
        }
        return [x, y];
    }
}

export default CvsImgTool;
