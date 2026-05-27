import { _decorator, Component, Node, game, director, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    public static instance: GameManager;
    @property(Node)
    gameOverUI: Node = null!;
    @property(Node)
    VictoryUI: Node = null!;

    onLoad() {
        // 单例绑定
        GameManager.instance = this;
    }
    start() {
        if (this.gameOverUI) {
            this.gameOverUI.active = false;
        }
    }
    public GameOver() {
        if (this.gameOverUI) {
            this.gameOverUI.active = true;
        }
    }

    public Victory(){
        if(this.VictoryUI){
            this.VictoryUI.active=true
        }
    }
    public TryAgain() {
        director.loadScene(director.getScene().name);
    }
}