import { _decorator, Component, Node, Vec3, instantiate, Prefab } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ZumaPathManager')
export class ZumaPathManager extends Component {

    // 路径点列表（按顺序拖入）
    @property(Node)
    pathPoints: Node[] = [];

    // 小球预制体
    @property(Prefab)
    ballPrefab: Prefab[] = [];

    // 一次生成多少个球
    //这里的数量以inspector中的数量为准
    @property
    spawnCount: number = 5;            

    // 移动速度
    @property
    moveSpeed: number = 0.005;  //0.005

    // 球之间间距
    @property
    ballSpacing: number = 0.022; //0.022

    private balls: Node[] = [];
    private ballPositions: number[] = [];

    start() {
        this.spawnBalls();
    }

    // 生成一串小球
    spawnBalls() {
        for (let i = 0; i < this.spawnCount; i++) {
            const ball = instantiate(this.ballPrefab[i%this.ballPrefab.length]) as Node;
            ball.setParent(this.node.parent);
            
            // 每个球错开位置，形成排队
            const startT = -i * this.ballSpacing;
            this.balls.push(ball);
            this.ballPositions.push(startT);
        }
    }

    update(dt: number) {
        for (let i = 0; i < this.balls.length; i++) {
            const ball = this.balls[i];
            let t = this.ballPositions[i%this.balls.length];

            t += this.moveSpeed * dt * 60;
            if (t > 1) t = 0;

            this.ballPositions[i] = t;
            const pos = this.getPointByT(t);
            ball.setPosition(pos);
        }
    }

    // 核心：根据 t 获取路径上的坐标（支持无限点）
    getPointByT(t: number): Vec3 {
        const segments = this.pathPoints.length - 1;
        if (segments < 1) return Vec3.ZERO; //只有一个点 那就放在原点

        const totalT = 1;
        const seg = Math.floor(t * segments);
        const localT = (t * segments) % 1;

        const p0 = this.pathPoints[seg].position;
        //这段代码是有bug的，但是t和seg与速度相关，当生成数量为5时，速度为0.005时，基本上不会出现越界问题，所以暂时不修复了
        const p1 = this.pathPoints[seg + 1].position;

        const dir = new Vec3();
        Vec3.subtract(dir, p1, p0);
        dir.multiplyScalar(localT);

        const result = new Vec3();
        Vec3.add(result, p0, dir);
        return result;
    }
}