import { _decorator, Component, Node, game, director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    public static instance: GameManager;
    @property(Node)
    gameOverUI: Node = null!;

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
        console.log("游戏结束");
        
        if (this.gameOverUI) {
            this.gameOverUI.active = true;
        }
    }
    public TryAgain() {
        console.log("重新开始游戏");
        director.loadScene(director.getScene().name);
    }
}