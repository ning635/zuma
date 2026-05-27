import { _decorator, Component, Node, director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SceneLoader')
export class SceneLoader extends Component {

    private SceneList: string[] = ["Map0", "Map1","Map2","Map3","Map4","Map5","Map6", "Menu","MapSelection"];
    public LoadSceneMap0(){
        director.loadScene(this.SceneList[0]);
    }
    public LoadSceneMap1(){
        director.loadScene(this.SceneList[1]);
    }
    public LoadSceneMap2(){
        director.loadScene(this.SceneList[2]);
    }
    public LoadSceneMap3(){
        director.loadScene(this.SceneList[3]);
    }
    public LoadSceneMap4(){
        director.loadScene(this.SceneList[4]);
    }
    public LoadSceneMap5(){
        director.loadScene(this.SceneList[5]);
    }
    public LoadSceneMap6(){
        director.loadScene(this.SceneList[6]);
    }
    public LoadSceneMenu(){
        director.loadScene(this.SceneList[7]);
    }
    public LoadSceneMapSelection(){
        director.loadScene(this.SceneList[8]);
    }

}

