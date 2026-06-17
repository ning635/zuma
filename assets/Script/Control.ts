import { _decorator, Component, input, Input, EventMouse, EventTouch, Collider2D, Vec3, Camera, Graphics, Color, UITransform, Node, Prefab, instantiate, director } from 'cc';
import { Ball } from './Ball';
import { GameManager } from './GameManager';
import { GameAudio } from './GameAudio';
const { ccclass, property } = _decorator;

@ccclass('control')
export class control extends Component {
    @property({ type: [Prefab], tooltip: "球预制体列表" })
    balls: Prefab[] = [];

    @property(Camera)
    mainCam: Camera = null!;
    
    @property({ tooltip: "发射速度" })
    shootSpeed: number = 1100;

    @property({ tooltip: "准星 + 虚线 同比例缩放" })
    lineScale: number = 1;

    @property(Node)
    PathRoot: Node=null!;

    @property({ tooltip: "发射器预览球相对炮台中心的竖向偏移" })
    previewOffsetY: number = 22;

    private mouseWorld: Vec3 = new Vec3();
    private hasMouseEntered = false;

    private drawNode: Node = null!;
    private graphics: Graphics = null!;
    private activeBalls: { node: Node, dir: Vec3 }[] = [];
    private previewNode: Node | null = null;
    private previewIndex: number = -1;
    private lastFireTime: number = 0;
    private readonly fireCooldownMs: number = 90;

    onLoad() {
        input.on(Input.EventType.MOUSE_MOVE, this.setMousePos, this);
        input.on(Input.EventType.MOUSE_DOWN, this.shootBall, this);
        input.on(Input.EventType.TOUCH_MOVE, this.setTouchPos, this);
        input.on(Input.EventType.TOUCH_START, this.setTouchPos, this);
        input.on(Input.EventType.TOUCH_END, this.shootTouchBall, this);
        GameAudio.preload();
        
        this.drawNode = new Node("AimLine");
        this.node.parent!.addChild(this.drawNode);
        this.drawNode.addComponent(UITransform);
        this.graphics = this.drawNode.addComponent(Graphics);

        // 在鼠标点击之前先随机生成一个预览的球体，放在发射器位置
        this.spawnPreview();
    }

    // 生成下一个预览球体并放置在发射器位置
    private spawnPreview() {
        if (this.balls.length === 0) return;

        this.previewIndex = Math.floor(Math.random() * this.balls.length);
        const prefab = this.balls[this.previewIndex];
        if (!prefab) return;

        if (this.previewNode && this.previewNode.isValid) {
            this.previewNode.destroy();
        }

        this.previewNode = instantiate(prefab);
        const col = this.previewNode.getComponent(Collider2D);
        if (col) {
            col.group = 1 << 2;
        }
        this.previewNode.getComponent(Ball)!.setBullet(true);
        this.PathRoot!.addChild(this.previewNode);
        this.previewNode.setWorldPosition(this.node.worldPosition.x, this.node.worldPosition.y + this.previewOffsetY, 0);
    }

    update() {
        //更新所有发射出的小球位置
        const dt = director.getDeltaTime();
        for (let i = this.activeBalls.length - 1; i >= 0; i--) {
            const ball = this.activeBalls[i];
            if (ball.node.isValid) {
                const pos = ball.node.position;
                ball.node.setPosition(
                    pos.x + ball.dir.x * this.shootSpeed * dt,
                    pos.y + ball.dir.y * this.shootSpeed * dt,
                    pos.z
                );
                
                // 超出一定范围后自动销毁，防止内存泄漏
                if (pos.length() > 3000) {
                    ball.node.destroy();
                    this.activeBalls.splice(i, 1);
                }
            } else {
                this.activeBalls.splice(i, 1);
            }
        }

        if (GameManager.instance && !GameManager.instance.CanPlay()) {
            this.graphics?.clear();
            return;
        }

        if (!this.mainCam || !this.hasMouseEntered) return;

        const selfPos = this.node.worldPosition;
        const dx = this.mouseWorld.x - selfPos.x;
        const dy = this.mouseWorld.y - selfPos.y;
        let angle = Math.atan2(dy, dx) * 180 / Math.PI;
        this.node.angle = angle - 90; 

        if (this.graphics && this.drawNode.parent) {
            this.graphics.clear();
            
            this.graphics.strokeColor = new Color(128, 0, 128, 255);
            //线条粗细跟随比例
            this.graphics.lineWidth = 2 * this.lineScale;
            
            const uiTransform = this.drawNode.parent.getComponent(UITransform);
            if (uiTransform) {
                const localSelf = uiTransform.convertToNodeSpaceAR(selfPos);
                const localMouse = uiTransform.convertToNodeSpaceAR(this.mouseWorld);
                
                //虚线样式全部按比例缩放
                const dashLen = 15 * this.lineScale;
                const spaceLen = 10 * this.lineScale;
                let currentLen = 0;
                
                const dir = new Vec3();
                Vec3.subtract(dir, localMouse, localSelf);
                dir.normalize();
                
                const distance = Vec3.distance(localSelf, localMouse);
                while (currentLen < distance) {
                    const fromPos = new Vec3();
                    const toPos = new Vec3();
                    
                    Vec3.scaleAndAdd(fromPos, localSelf, dir, currentLen);
                    const nextLen = Math.min(currentLen + dashLen, distance);
                    Vec3.scaleAndAdd(toPos, localSelf, dir, nextLen);
                    
                    this.graphics.moveTo(fromPos.x, fromPos.y);
                    this.graphics.lineTo(toPos.x, toPos.y);
                    
                    currentLen += dashLen + spaceLen;
                }
                const crossSize = 10 * this.lineScale;
                this.graphics.moveTo(localMouse.x - crossSize, localMouse.y);
                this.graphics.lineTo(localMouse.x + crossSize, localMouse.y);
                this.graphics.moveTo(localMouse.x, localMouse.y - crossSize);
                this.graphics.lineTo(localMouse.x, localMouse.y + crossSize);
                
                this.graphics.stroke();
            }
        }
    }

    public removeActiveBall(targetNode: Node) {
        for (let i = this.activeBalls.length - 1; i >= 0; i--) {
            if (this.activeBalls[i].node === targetNode) {
                this.activeBalls.splice(i, 1);
                break;
            }
        }
    }

    setMousePos(e: EventMouse) {
        this.hasMouseEntered = true;
        this.mainCam.screenToWorld(
            this.mouseWorld.set(e.getLocationX(), e.getLocationY(), 0),
            this.mouseWorld
        );
    }

    shootBall(e: EventMouse) {
        if (e.getButton() !== EventMouse.BUTTON_LEFT || this.balls.length === 0) return;
        this.fireAtScreenPosition(e.getLocationX(), e.getLocationY());
    }

    setTouchPos(e: EventTouch) {
        const location = e.getLocation();
        this.hasMouseEntered = true;
        this.mainCam.screenToWorld(
            this.mouseWorld.set(location.x, location.y, 0),
            this.mouseWorld
        );
    }

    shootTouchBall(e: EventTouch) {
        const location = e.getLocation();
        this.setTouchPos(e);
        this.fireAtScreenPosition(location.x, location.y);
    }

    private fireAtScreenPosition(screenX: number, screenY: number) {
        if ((GameManager.instance && !GameManager.instance.CanPlay()) || this.balls.length === 0) return;
        const now = Date.now();
        if (now - this.lastFireTime < this.fireCooldownMs) {
            return;
        }

        // 获取发射方向 (鼠标方向)
        const selfPos = this.node.worldPosition;
        const targetWorld = new Vec3();
        this.mainCam.screenToWorld(
            targetWorld.set(screenX, screenY, 0),
            targetWorld
        );

        const pathTransform = this.PathRoot?.getComponent(UITransform);
        const localSelf = pathTransform ? pathTransform.convertToNodeSpaceAR(selfPos) : selfPos.clone();
        const localTarget = pathTransform ? pathTransform.convertToNodeSpaceAR(targetWorld) : targetWorld.clone();
        const dir = new Vec3(localTarget.x - localSelf.x, localTarget.y - localSelf.y, 0);
        if (dir.length() < 8) {
            return;
        }
        this.lastFireTime = now;
        dir.normalize();

        // 如果存在预览节点，则将其作为发射球使用，否则随机实例化一个
        let ballNode: Node;
        if (this.previewNode) {
            ballNode = this.previewNode;
            this.previewNode = null;
            this.PathRoot.addChild(ballNode);
            if (pathTransform) {
                ballNode.setPosition(localSelf);
            } else {
                ballNode.setWorldPosition(selfPos);
            }
        } else {
            const index = Math.floor(Math.random() * this.balls.length);
            const prefab = this.balls[index];
            if (!prefab) return;
            ballNode = instantiate(prefab);
            this.PathRoot!.addChild(ballNode);
            if (pathTransform) {
                ballNode.setPosition(localSelf);
            } else {
                ballNode.setWorldPosition(selfPos);
            }
        }

        ballNode.getComponent(Ball)!.setBullet(true);
        //console.log(ballNode.getComponent(Ball)!.BallColor);
        // 记录到数组中进行移动控制
        this.activeBalls.push({ node: ballNode, dir: dir });
        GameAudio.playShoot();

        // 发射后立即随机并生成下一个预览球体
        this.spawnPreview();
    }

    onDestroy() {
        input.off(Input.EventType.MOUSE_MOVE, this.setMousePos, this);
        input.off(Input.EventType.MOUSE_DOWN, this.shootBall, this);
        input.off(Input.EventType.TOUCH_MOVE, this.setTouchPos, this);
        input.off(Input.EventType.TOUCH_START, this.setTouchPos, this);
        input.off(Input.EventType.TOUCH_END, this.shootTouchBall, this);
    }
}
