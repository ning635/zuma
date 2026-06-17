import { _decorator, Component, Collider2D, Contact2DType, director, Node } from 'cc';
import { Ball } from './Ball';
import { ZumaCurvePath } from './ZumaCurvePath';
import { control } from './Control';
const { ccclass } = _decorator;

@ccclass('BallCollision')
export class BallCollision extends Component {
    onLoad() {
        const collider = this.getComponent(Collider2D);
        collider?.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }

    private onBeginContact(_, other: Collider2D) {
        //console.log("碰撞发生了");
        const selfBall = this.node.getComponent(Ball);
        const otherBall = other.node.getComponent(Ball);

        const selfIsBullet = !!selfBall?.isbullet;
        const otherIsBullet = !!otherBall?.isbullet;

        if (selfIsBullet === otherIsBullet) {
            return;
        }
        else if(otherIsBullet){
            return;
        }
        //好垃圾的代码可读性，说白了就是确定哪个是轨道球，哪个是子弹
        const bulletNode: Node = selfIsBullet ? this.node : other.node;
        const hitNode: Node = selfIsBullet ? other.node : this.node;
        const path = director.getScene()?.getComponentInChildren(ZumaCurvePath);
        const shooter = director.getScene()?.getComponentInChildren(control);
        const bulletCollider = bulletNode.getComponent(Collider2D);

        bulletNode.getComponent(Ball)?.setBullet(false);
        if (bulletCollider) {
            bulletCollider.enabled = false;
        }
        shooter?.removeActiveBall(bulletNode);
        path?.handleBulletCollision(bulletNode, hitNode);

    }

    onDestroy() {
        const collider = this.getComponent(Collider2D);
        collider?.off(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }
}
