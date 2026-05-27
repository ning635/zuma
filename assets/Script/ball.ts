import { _decorator, Component, Node, Color } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Ball')
export class Ball extends Component {

    @property(Color)
    public BallColor: Color=null!;

    public isbullet: boolean = false;
    public setBullet(value: boolean) {
        this.isbullet = value;
    }

}

