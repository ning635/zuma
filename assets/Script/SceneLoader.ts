import { _decorator, Button, Color, Component, director, Graphics, Label, Node, UITransform, Vec3 } from 'cc';
import { SettingsStore } from './SettingsStore';
const { ccclass, property } = _decorator;

@ccclass('SceneLoader')
export class SceneLoader extends Component {

    private SceneList: string[] = ["Map1","Map2","Map3","Map4","Map5","Map6", "Menu","MapSelection", "Options"];
    private languageValueLabel: Label | null = null;
    private difficultyValueLabel: Label | null = null;
    private musicValueLabel: Label | null = null;
    private soundValueLabel: Label | null = null;
    private vibrationValueLabel: Label | null = null;
    private helperLabel: Label | null = null;

    start() {
        if (director.getScene()?.name === 'Options') {
            this.buildOptionsScene();
        }
    }

    public LoadSceneMap1(){
        director.loadScene(this.SceneList[0]);
    }
    public LoadSceneMap2(){
        director.loadScene(this.SceneList[1]);
    }
    public LoadSceneMap3(){
        director.loadScene(this.SceneList[2]);
    }
    public LoadSceneMap4(){
        director.loadScene(this.SceneList[3]);
    }
    public LoadSceneMap5(){
        director.loadScene(this.SceneList[4]);
    }
    public LoadSceneMap6(){
        director.loadScene(this.SceneList[5]);
    }
    public LoadSceneMenu(){
        director.loadScene(this.SceneList[6]);
    }
    public LoadSceneMapSelection(){
        director.loadScene(this.SceneList[7]);
    }
    public LoadSceneOptions(){
        director.loadScene(this.SceneList[8]);
    }
    public LoadSceneMap(){
        this.LoadSceneOptions();
    }

    private buildOptionsScene() {
        const canvas = director.getScene()?.getChildByName('Canvas');
        if (!canvas) {
            return;
        }

        this.createBackground(canvas);
        this.createTitle(canvas);

        this.languageValueLabel = this.createOptionButton(canvas, 180, () => this.cycleLanguage());
        this.difficultyValueLabel = this.createOptionButton(canvas, 80, () => this.cycleDifficulty());
        this.musicValueLabel = this.createOptionButton(canvas, -20, () => this.toggleMusic());
        this.soundValueLabel = this.createOptionButton(canvas, -120, () => this.toggleSound());
        this.vibrationValueLabel = this.createOptionButton(canvas, -220, () => this.toggleVibration());

        this.createTextButton(canvas, 'Privacy Policy', -320, () => this.showHelper('Privacy policy link will be connected after the ad SDK setup.'));
        this.createTextButton(canvas, 'Back', -430, () => this.LoadSceneMenu());

        this.helperLabel = this.createLabel(canvas, '', 0, -510, 520, 42, 22, new Color(235, 245, 255, 255));
        this.refreshOptions();
    }

    private createBackground(parent: Node) {
        const node = new Node('OptionsBackground');
        parent.addChild(node);
        node.addComponent(UITransform).setContentSize(720, 1280);
        const graphics = node.addComponent(Graphics);
        graphics.fillColor = new Color(24, 34, 54, 255);
        graphics.rect(-360, -640, 720, 1280);
        graphics.fill();
        graphics.fillColor = new Color(39, 60, 88, 255);
        graphics.rect(-310, -530, 620, 1020);
        graphics.fill();
    }

    private createTitle(parent: Node) {
        this.createLabel(parent, 'Options', 0, 430, 520, 70, 48, new Color(255, 246, 206, 255));
        this.createLabel(parent, 'Settings are saved automatically', 0, 372, 520, 40, 22, new Color(214, 229, 245, 255));
    }

    private createOptionButton(parent: Node, y: number, onClick: () => void): Label {
        const button = this.createTextButton(parent, '', y, onClick);
        const label = button.getComponentInChildren(Label);
        return label!;
    }

    private createTextButton(parent: Node, text: string, y: number, onClick: () => void): Node {
        const buttonNode = new Node(`Button-${text || 'Option'}`);
        parent.addChild(buttonNode);
        buttonNode.setPosition(new Vec3(0, y, 0));
        buttonNode.addComponent(UITransform).setContentSize(520, 74);

        const graphics = buttonNode.addComponent(Graphics);
        graphics.fillColor = new Color(250, 214, 107, 255);
        graphics.roundRect(-260, -37, 520, 74, 12);
        graphics.fill();

        const button = buttonNode.addComponent(Button);
        buttonNode.on(Button.EventType.CLICK, onClick, this);

        const labelNode = new Node('Label');
        buttonNode.addChild(labelNode);
        labelNode.addComponent(UITransform).setContentSize(500, 60);
        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = 28;
        label.color = new Color(48, 37, 26, 255);

        button.target = buttonNode;
        return buttonNode;
    }

    private createLabel(parent: Node, text: string, x: number, y: number, width: number, height: number, fontSize: number, color: Color): Label {
        const node = new Node(`Label-${text || 'Helper'}`);
        parent.addChild(node);
        node.setPosition(new Vec3(x, y, 0));
        node.addComponent(UITransform).setContentSize(width, height);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.color = color;
        return label;
    }

    private cycleLanguage() {
        const settings = SettingsStore.load();
        SettingsStore.update({ language: SettingsStore.nextLanguage(settings.language) });
        this.refreshOptions('Language saved.');
    }

    private cycleDifficulty() {
        const settings = SettingsStore.load();
        SettingsStore.update({ difficulty: SettingsStore.nextDifficulty(settings.difficulty) });
        this.refreshOptions('Difficulty will apply when a map starts.');
    }

    private toggleMusic() {
        const settings = SettingsStore.load();
        SettingsStore.update({ musicEnabled: !settings.musicEnabled });
        this.refreshOptions();
    }

    private toggleSound() {
        const settings = SettingsStore.load();
        SettingsStore.update({ soundEnabled: !settings.soundEnabled });
        this.refreshOptions();
    }

    private toggleVibration() {
        const settings = SettingsStore.load();
        SettingsStore.update({ vibrationEnabled: !settings.vibrationEnabled });
        this.refreshOptions();
    }

    private refreshOptions(helperText = '') {
        const settings = SettingsStore.load();
        if (this.languageValueLabel) {
            this.languageValueLabel.string = `Language: ${SettingsStore.labelForLanguage(settings.language)}`;
        }
        if (this.difficultyValueLabel) {
            this.difficultyValueLabel.string = `Difficulty: ${SettingsStore.labelForDifficulty(settings.difficulty)}`;
        }
        if (this.musicValueLabel) {
            this.musicValueLabel.string = `Music: ${settings.musicEnabled ? 'On' : 'Off'}`;
        }
        if (this.soundValueLabel) {
            this.soundValueLabel.string = `Sound FX: ${settings.soundEnabled ? 'On' : 'Off'}`;
        }
        if (this.vibrationValueLabel) {
            this.vibrationValueLabel.string = `Vibration: ${settings.vibrationEnabled ? 'On' : 'Off'}`;
        }
        this.showHelper(helperText);
    }

    private showHelper(text: string) {
        if (this.helperLabel) {
            this.helperLabel.string = text;
        }
    }

}

