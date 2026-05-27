import { _decorator, Component, Node, director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SceneLoader')
export class SceneLoader extends Component {

    private SceneList: string[] = ["Map0", "Map1", "Menu","MapSelection"];
    public LoadScene1(){
        director.loadScene(this.SceneList[1]);
    }
    public LoadSceneMap(){
        director.loadScene(this.SceneList[3]);
    }
}

