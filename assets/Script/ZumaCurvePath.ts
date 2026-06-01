import { _decorator, Component, Node, Vec3, instantiate, Prefab, Color, Collider2D } from 'cc';
import { GameManager } from './GameManager';
import { Ball } from './Ball';
const { ccclass, property } = _decorator;

@ccclass('ZumaCurvePath')
export class ZumaCurvePath extends Component {

    @property(Node)
    pathPoints: Node[] = [];

    @property(Prefab)
    ballPrefab: Prefab[] = [];

    @property
    spawnCount: number = 5;            

    @property
    moveSpeed: number = 0.005;//以编辑器里的数值为准

    @property
    ballSpacing: number = 0.022;
    private halfspeed= null!;
    private balls: Node[] = [];
    private ballPositions: number[] = [];
    private reconnecting: boolean = false;
    private reconnectFrontEndIndex: number = this.spawnCount-1;
    private reconnectBackStartIndex: number = -1;

    private pathDistances: number[] = [];
    private totalPathLength: number = 0;

    start() {
        this.calculatePathDistances();
        this.spawnBalls();
        this.halfspeed=this.moveSpeed/2;
    }

    calculatePathDistances() {
        this.pathDistances = [0];
        let total = 0;
        for (let i = 0; i < this.pathPoints.length - 1; i++) {
            const p0 = this.pathPoints[i].position;
            const p1 = this.pathPoints[i + 1].position;
            const dist = Vec3.distance(p0, p1);
            total += dist;
            this.pathDistances.push(total);
        }
        this.totalPathLength = total;
    }

    spawnBalls() {
        ////生成spawncount组单个球
        // for (let i = 0; i < this.spawnCount; i++) {
        //     const ball = instantiate(this.ballPrefab[i % this.ballPrefab.length]) as Node;
        //     ball.setParent(this.node);
        //     ball.active=false;
        //     const col = ball.getComponent(Collider2D);
        //     col.group = 1 << 1;

        //     const startT = -i * this.ballSpacing;
        //     this.balls.push(ball);
        //     this.ballPositions.push(startT);

        // }

        //生成spawncount组双球
        // for (let i = 0; i < 2*this.spawnCount; i++) {
        //     let ball=null!;
        //     if(i%2==0){
        //     ball = instantiate(this.ballPrefab[i % this.ballPrefab.length]) as Node;
        //     }
        //     else{
        //     ball = instantiate(this.ballPrefab[(i-1) % this.ballPrefab.length]) as Node;
        //     }
        //     ball.setParent(this.node);
        //     ball.active=false;
        //     const col = ball.getComponent(Collider2D);
        //     col.group = 1 << 1;

        //     const startT = -i * this.ballSpacing;
        //     this.balls.push(ball);
        //     this.ballPositions.push(startT);
        // }
        
        //随机出球，每次一组,总共2*spawncount组,每组一个球，颜色随机
        for(let i=0;i<2*this.spawnCount;i++){
            // if(i>0){
            //     let ballCount = 1;
            //     if (Math.random() > 0.5) ballCount = 2;
            //     for(let j=0;j<ballCount;j++){
            //         let ball= null!;
            //         if(j==0){
            //             ball = instantiate(this.ballPrefab[Math.floor(Math.random() * this.ballPrefab.length)]) as Node;
            //             while(this.balls.length>0&&this.isSameColor(this.balls[this.balls.length-1], ball.getComponent(Ball).BallColor)){
            //                 ball=instantiate(this.ballPrefab[Math.floor(Math.random() * this.ballPrefab.length)]) as Node;
            //             }
            //         }
            //         else{
            //             ball=this.balls[this.balls.length-1];
            //         }
            //         ball.setParent(this.node);
            //         ball.active=false;
            //         const col = ball.getComponent(Collider2D);
            //         col.group = 1 << 1;
            //         const startT = -this.balls.length * this.ballSpacing;
            //         this.balls.push(ball);
            //         this.ballPositions.push(startT);
            //     }
            // }
            // else{
                const ball1 = instantiate(this.ballPrefab[Math.floor(Math.random() * this.ballPrefab.length)]) as Node;
                let ball2=instantiate(this.ballPrefab[Math.floor(Math.random() * this.ballPrefab.length)]) as Node;
                while(this.isSameColor(ball1, ball2.getComponent(Ball).BallColor)){
                ball2 = instantiate(this.ballPrefab[Math.floor(Math.random() * this.ballPrefab.length)]) as Node;
                }
                ball1.setParent(this.node);
                ball2.setParent(this.node);
                ball1.active=false;
                ball2.active=false;
                const col1 = ball1.getComponent(Collider2D);
                const col2 = ball2.getComponent(Collider2D);
                col1.group = 1 << 1;
                col2.group = 1 << 1;
                const startT1 = -this.balls.length * this.ballSpacing;
                this.balls.push(ball1);
                this.ballPositions.push(startT1);
                
                const startT2 = -this.balls.length * this.ballSpacing;
                this.balls.push(ball2);
                this.ballPositions.push(startT2);

            //}
        }
    }

    update(dt: number) {
        //关于dt，假设当前设备帧数为n，dt=60/n（秒） dt*n=60
        //那么t在一秒内的增量为this.moveSpeed*dt*60*n为常量

        //这里当没球的时候说明 球链已经被消灭了，玩家胜利
        if(this.balls.length==0){
            GameManager.instance.Victory();
            return;
        }
        
        for (let i = 0; i < this.balls.length; i++) {
            const ball = this.balls[i];
            if (!ball.isValid) continue;

            //获取相对位置，过半的情况给球链减速
            let t = this.ballPositions[i];
            if(t>0.6){
                this.moveSpeed=this.halfspeed;
            }
            t += this.moveSpeed * dt * 60;
            //碰到尽头直接gameover
            while (t > 1) {
                GameManager.instance.GameOver();
                return;
            }

            this.ballPositions[i] = t;
            //更新t值后，显示t大于0的球
            if(t>=0){
                const pos = this.getPointByT(t);
                ball.active=true;
                ball.setPosition(pos);
            }
        }
        this.updateReconnectGap(dt);
    }
    //处理碰撞插入新球
    public handleBulletCollision(bulletNode: Node, hitNode: Node) {
        const col=bulletNode.getComponent(Collider2D);
        col.group=1<<1;
        const hitIndex = this.balls.indexOf(hitNode);
        if (hitIndex < 0) return;

        const bulletBall = bulletNode.getComponent(Ball);
        const hitBall = hitNode.getComponent(Ball);
        if (!bulletBall || !hitBall) return;

        const insertT = this.ballPositions[hitIndex] ?? 0;
        //0类型为插入
        this.balls.splice(hitIndex, 0, bulletNode);
        this.ballPositions.splice(hitIndex, 0, insertT);

        // console.log("reconnecting =", this.reconnecting);
        // console.log("hitIndex =", hitIndex);
        // console.log("reconnectFrontEndIndex =", this.reconnectFrontEndIndex);
        
        if(!this.reconnecting){
        // 0 到 hitIndex 之前的球也要往前推一个身位
        console.log("ok");
            for (let i = 0; i <= hitIndex; i++) {
                this.ballPositions[i] += this.ballSpacing;
            }
        }
        else{
            // 如果正在重新连接，且 hitIndex 在前半段，则前半段球都要往前推一个身位
            if(hitIndex<=this.reconnectFrontEndIndex){
                for (let i = 0; i <= hitIndex; i++) {
                    this.ballPositions[i] += this.ballSpacing;
                }
            }
            else if(hitIndex>=this.reconnectBackStartIndex){
                for(let i=this.reconnectBackStartIndex;i<=hitIndex;i++){
                    this.ballPositions[i] += this.ballSpacing;
                }
            }
        }
        

        this.syncBallNodesFromIndex(0);

        this.resolveMatchFromIndex(hitIndex);
    }
    //调整球的位置
    private syncBallNodesFromIndex(startIndex: number) {
        for (let i = startIndex; i < this.balls.length; i++) {
            const node = this.balls[i];
            if (!node || !node.isValid) continue;
            node.setPosition(this.getPointByT(this.ballPositions[i]));
        }
    }
    //消除功能
    private resolveMatchFromIndex(index: number) {
        let checkIndex = index;

        while (this.balls.length > 0 && checkIndex >= 0 && checkIndex < this.balls.length) {
            const runStart = this.findSameColorRunStart(checkIndex);
            if (runStart < 0) break;

            const runEnd = this.findSameColorRunEnd(checkIndex);
            const runCount = runEnd - runStart + 1;
            if (runCount < 3) break;

            for (let i = runStart; i <= runEnd; i++) {
                const node = this.balls[i];
                if (node && node.isValid) node.destroy();
            }

            this.balls.splice(runStart, runCount);
            this.ballPositions.splice(runStart, runCount);

            if (runStart > 0 && runStart < this.balls.length) {
                this.beginReconnectGap(runStart - 1, runStart);
            } else {
                this.reconnecting = false;
                this.reconnectFrontEndIndex = this.balls.length - 1;
                this.reconnectBackStartIndex = -1;
            }

            checkIndex = Math.max(0, runStart - 1);
        }
    }

    private beginReconnectGap(frontEndIndex: number, backStartIndex: number) {
        this.reconnecting = true;
        this.reconnectFrontEndIndex = frontEndIndex;
        this.reconnectBackStartIndex = backStartIndex;
    }
    
    private updateReconnectGap(dt: number) {
        if (!this.reconnecting) {
            return;
        }

        if (this.reconnectFrontEndIndex < 0 || this.reconnectBackStartIndex < 0) {
            this.reconnecting = false;
            return;
        }

        if (this.reconnectFrontEndIndex >= this.balls.length || this.reconnectBackStartIndex >= this.balls.length) {
            this.reconnecting = false;
            return;
        }

        const step = this.moveSpeed * dt * 60;

        for (let i = 0; i <= this.reconnectFrontEndIndex; i++) {
            this.ballPositions[i] -= step;
        }

        // 只通过 ballPositions 判断后半段是否追上前半段
        const frontPos = this.ballPositions[this.reconnectFrontEndIndex];
        const backPos = this.ballPositions[this.reconnectBackStartIndex];
        let distanceAhead = frontPos - backPos;
        if (distanceAhead < 0) {
            distanceAhead += 1;
        }

        if (distanceAhead <this.ballSpacing) {
            this.reconnecting = false;
            this.reconnectFrontEndIndex = this.balls.length - 1;
            this.reconnectBackStartIndex = -1;
        }

        this.syncBallNodesFromIndex(0);
    }

    private wrapT(value: number) {
        while (value < 0) value += 1;
        while (value > 1) value -= 1;
        return value;
    }

    private findSameColorRunStart(index: number) {
        if (index < 0 || index >= this.balls.length) return -1;
        const c = this.getBallColor(this.balls[index]);
        if (!c) return -1;

        let start = index;
        while (start > 0 && this.isSameColor(this.balls[start - 1], c)) start--;
        return start;
    }

    private findSameColorRunEnd(index: number) {
        if (index < 0 || index >= this.balls.length) return -1;
        const c = this.getBallColor(this.balls[index]);
        if (!c) return -1;

        let end = index;
        while (end + 1 < this.balls.length && this.isSameColor(this.balls[end + 1], c)) end++;
        return end;
    }

    private getBallColor(node: Node) {
        return node.getComponent(Ball)?.BallColor ?? null;
    }

    private isSameColor(node: Node, target: Color | null) {
        const c = this.getBallColor(node);
        if (!c || !target) return false;
        return c.r === target.r && c.g === target.g && c.b === target.b && c.a === target.a;
    }

    getPointByT(t: number): Vec3 {
        const segments = this.pathPoints.length - 1;
        if (segments < 1) return Vec3.ZERO;
        if (this.totalPathLength === 0) return this.pathPoints[0].position.clone();

        const targetDist = t * this.totalPathLength;

        if (targetDist < 0) {
            const p0 = this.pathPoints[0].position;
            const p1 = this.pathPoints[1].position;
            const dir = Vec3.subtract(new Vec3(), p0, p1);
            dir.normalize().multiplyScalar(-targetDist);
            return Vec3.add(new Vec3(), p0, dir);
        }

        if (targetDist > this.totalPathLength) {
            const p0 = this.pathPoints[segments - 1].position;
            const p1 = this.pathPoints[segments].position;
            const dir = Vec3.subtract(new Vec3(), p1, p0);
            dir.normalize().multiplyScalar(targetDist - this.totalPathLength);
            return Vec3.add(new Vec3(), p1, dir);
        }

        for (let i = 0; i < segments; i++) {
            if (targetDist <= this.pathDistances[i + 1]) {
                const p0 = this.pathPoints[i].position;
                const p1 = this.pathPoints[i + 1].position;
                const dSeg = this.pathDistances[i + 1] - this.pathDistances[i];
                const localT = dSeg > 0 ? (targetDist - this.pathDistances[i]) / dSeg : 0;
                return Vec3.lerp(new Vec3(), p0, p1, localT);
            }
        }

        return this.pathPoints[segments].position.clone();
    }
}