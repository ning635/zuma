import { _decorator, Component, Node, Color } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Ball')
export class Ball extends Component {

    @property(Color)
    public BallColor: Color=null!;

    public isbullet: boolean = false;

    public isfullcolor: boolean = false;

    public setBullet(value: boolean) {
        this.isbullet = value;
    }

    public setfullcolor(){
        this.isfullcolor=true;
    }
    
    public isSameColor(ball1: Ball, ball2: Ball): boolean {
        return ball1.BallColor.equals(ball2.BallColor);
    }


}

