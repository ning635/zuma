import { _decorator, Button, Color, Component, director, game, Graphics, Label, Node, Sprite, SpriteFrame, sys, tween, UIOpacity, UITransform, Vec3 } from 'cc';
import { SettingsStore } from './SettingsStore';
import { GameAudio } from './GameAudio';
const { ccclass, property } = _decorator;

const MENU_HOTSPOT_LAYOUT = {
    door: { x: 36, y: 96 },
    settings: { x: 146, y: -96, angle: -1 },
    exit: { x: -136, y: -108, angle: -6 },
};

@ccclass('SceneLoader')
export class SceneLoader extends Component {
    @property(SpriteFrame)
    optionButtonSpriteFrame: SpriteFrame | null = null;

    private SceneList: string[] = ["Map1","Map2","Map3","Map4","Map5","Map6", "Menu","MapSelection", "Options"];
    private languageValueLabel: Label | null = null;
    private difficultyValueLabel: Label | null = null;
    private modeValueLabel: Label | null = null;
    private musicValueLabel: Label | null = null;
    private soundValueLabel: Label | null = null;
    private vibrationValueLabel: Label | null = null;
    private helperLabel: Label | null = null;
    private leaderboardPanel: Node | null = null;
    private isLoadingMap = false;
    private menuIsEntering = false;

    start() {
        GameAudio.preload();
        const sceneName = director.getScene()?.name;
        if (sceneName === 'Options') {
            this.buildOptionsScene();
        }
        if (sceneName === 'Menu') {
            this.buildMenuSceneHotspots();
        }
        if (sceneName === 'MapSelection') {
            this.bindMapSelectionFeedback();
            this.buildMapSelectionExtras();
        }
    }

    public LoadSceneMap1(){
        this.loadMapScene(0, 1);
    }
    public LoadSceneMap2(){
        this.loadMapScene(1, 2);
    }
    public LoadSceneMap3(){
        this.loadMapScene(2, 3);
    }
    public LoadSceneMap4(){
        this.loadMapScene(3, 4);
    }
    public LoadSceneMap5(){
        this.loadMapScene(4, 5);
    }
    public LoadSceneMap6(){
        this.loadMapScene(5, 6);
    }
    public LoadSceneMenu(){
        GameAudio.playClick();
        director.loadScene(this.SceneList[6]);
    }
    public LoadSceneMapSelection(){
        GameAudio.playClick();
        if (director.getScene()?.name === 'Menu') {
            this.playDoorEnterEffect();
            return;
        }
        director.loadScene(this.SceneList[7]);
    }
    public LoadSceneOptions(){
        GameAudio.playClick();
        director.loadScene(this.SceneList[8]);
    }
    public LoadSceneMap(){
        this.LoadSceneOptions();
    }
    public ExitGame(){
        GameAudio.playClick();
        game.end();
    }

    private buildMenuSceneHotspots() {
        const canvas = director.getScene()?.getChildByName('Canvas');
        if (!canvas || canvas.getChildByName('MenuSceneHotspots')) {
            return;
        }

        this.hideLegacyStartButton(canvas);

        const root = new Node('MenuSceneHotspots');
        canvas.addChild(root);
        root.setSiblingIndex(canvas.children.length - 1);

        this.createDoorHotspot(root);
    }

    private hideLegacyStartButton(canvas: Node) {
        const menuUI = canvas.getChildByName('MenuUI');
        if (!menuUI) {
            return;
        }

        const startButton = menuUI.getChildByName('Button-StartGame');
        if (startButton) {
            startButton.active = false;
        }
    }

    private createDoorHotspot(parent: Node) {
        const door = new Node('DoorStartHotspot');
        parent.addChild(door);
        door.setPosition(new Vec3(MENU_HOTSPOT_LAYOUT.door.x, MENU_HOTSPOT_LAYOUT.door.y, 0));
        door.addComponent(UITransform).setContentSize(84, 146);

        const halo = new Node('DoorHalo');
        door.addChild(halo);
        halo.setPosition(new Vec3(0, 0, 0));
        halo.addComponent(UITransform).setContentSize(86, 138);
        const haloOpacity = halo.addComponent(UIOpacity);
        haloOpacity.opacity = 132;
        const hg = halo.addComponent(Graphics);
        hg.fillColor = new Color(51, 255, 224, 30);
        hg.moveTo(-24, -52);
        hg.lineTo(-24, 18);
        hg.bezierCurveTo(-22, 56, 22, 56, 24, 18);
        hg.lineTo(24, -52);
        hg.close();
        hg.fill();
        hg.lineWidth = 2;
        hg.strokeColor = new Color(104, 255, 236, 92);
        hg.moveTo(-25, -53);
        hg.lineTo(-25, 18);
        hg.bezierCurveTo(-23, 58, 23, 58, 25, 18);
        hg.lineTo(25, -53);
        hg.stroke();
        hg.lineWidth = 1;
        hg.strokeColor = new Color(255, 236, 145, 76);
        hg.moveTo(-17, -46);
        hg.lineTo(-17, 15);
        hg.bezierCurveTo(-15, 42, 15, 42, 17, 15);
        hg.lineTo(17, -46);
        hg.stroke();

        for (let i = 0; i < 7; i++) {
            const mote = new Node(`DoorMote-${i}`);
            door.addChild(mote);
            const px = -14 + i * 5 + (i % 2) * 4;
            const py = -42 + (i % 4) * 17;
            mote.setPosition(new Vec3(px, py, 0));
            mote.addComponent(UITransform).setContentSize(10, 10);
            const opacity = mote.addComponent(UIOpacity);
            opacity.opacity = 120 + i * 12;
            const mg = mote.addComponent(Graphics);
            mg.fillColor = i % 2 === 0 ? new Color(255, 242, 168, 180) : new Color(92, 255, 230, 180);
            mg.circle(0, 0, 2 + (i % 3));
            mg.fill();
            tween(mote)
                .repeatForever(
                    tween()
                        .to(1.2 + i * 0.08, { position: new Vec3(px, py + 18, 0) })
                        .to(0, { position: new Vec3(px, py, 0) }),
                )
                .start();
            tween(opacity)
                .repeatForever(
                    tween()
                        .to(0.6 + i * 0.05, { opacity: 230 })
                        .to(0.6 + i * 0.05, { opacity: 80 }),
                )
                .start();
        }

        tween(halo)
            .repeatForever(
                tween()
                    .to(0.92, { scale: new Vec3(1.05, 1.05, 1) })
                    .to(0.92, { scale: new Vec3(1, 1, 1) }),
            )
            .start();
        tween(haloOpacity)
            .repeatForever(
                tween()
                    .to(0.92, { opacity: 235 })
                    .to(0.92, { opacity: 150 }),
            )
            .start();

        const button = door.addComponent(Button);
        button.target = door;
        door.on(Button.EventType.CLICK, () => this.playDoorEnterEffect(), this);
    }

    private createPillarHotspot(parent: Node, type: 'settings' | 'exit', text: string, x: number, y: number, angle: number, color: Color, onClick: () => void) {
        const node = new Node(`PillarHotspot-${type}`);
        parent.addChild(node);
        node.setPosition(new Vec3(x, y, 0));
        node.angle = angle;
        node.addComponent(UITransform).setContentSize(92, 182);

        const glow = node.addComponent(Graphics);
        glow.fillColor = new Color(color.r, color.g, color.b, 28);
        glow.fillRect(-17, -42, 34, 82);
        this.drawPillarInset(glow, 0, 2, color);

        const labelNode = new Node(`PillarText-${type}`);
        node.addChild(labelNode);
        labelNode.setPosition(new Vec3(0, 2, 0));
        labelNode.addComponent(UITransform).setContentSize(30, 64);
        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = 17;
        label.lineHeight = 27;
        label.color = color;
        (label as any).horizontalAlign = 1;
        (label as any).verticalAlign = 1;
        this.applyStrongOutline(label, new Color(4, 27, 27, 245), 3);

        tween(labelNode)
            .repeatForever(
                tween()
                    .to(1.1, { scale: new Vec3(1.08, 1.08, 1) })
                    .to(1.1, { scale: new Vec3(1, 1, 1) }),
            )
            .start();

        const button = node.addComponent(Button);
        button.target = node;
        let lastTriggerTime = 0;
        const trigger = () => {
            const now = Date.now();
            if (now - lastTriggerTime < 250) {
                return;
            }
            lastTriggerTime = now;
            GameAudio.playClick();
            tween(node)
                .to(0.08, { scale: new Vec3(0.94, 0.94, 1) })
                .to(0.12, { scale: new Vec3(1, 1, 1) })
                .call(onClick)
                .start();
        };
        node.on(Button.EventType.CLICK, trigger, this);
        node.on(Node.EventType.TOUCH_END, trigger, this);
    }

    private drawPillarInset(g: Graphics, x: number, y: number, color: Color) {
        g.fillColor = new Color(3, 27, 30, 128);
        g.moveTo(x, y + 37);
        g.lineTo(x + 17, y + 18);
        g.lineTo(x + 13, y - 35);
        g.lineTo(x - 13, y - 35);
        g.lineTo(x - 17, y + 18);
        g.close();
        g.fill();
        g.lineWidth = 1;
        g.strokeColor = new Color(color.r, color.g, color.b, 210);
        g.moveTo(x, y + 37);
        g.lineTo(x + 17, y + 18);
        g.lineTo(x + 13, y - 35);
        g.lineTo(x - 13, y - 35);
        g.lineTo(x - 17, y + 18);
        g.lineTo(x, y + 37);
        g.stroke();
    }

    private drawPillarIcon(g: Graphics, type: 'settings' | 'exit', color: Color) {
        g.lineWidth = 2;
        g.strokeColor = new Color(color.r, color.g, color.b, 210);
        g.fillColor = new Color(color.r, color.g, color.b, 85);

        if (type === 'settings') {
            g.circle(0, 0, 6);
            g.stroke();
            for (let i = 0; i < 8; i++) {
                const angle = i * Math.PI / 4;
                const inner = 9;
                const outer = i % 2 === 0 ? 14 : 12;
                g.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
                g.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
            }
            g.stroke();
            g.circle(0, 0, 2);
            g.fill();
            return;
        }

        g.moveTo(-7, 12);
        g.lineTo(-7, -12);
        g.lineTo(5, -12);
        g.stroke();
        g.moveTo(-1, 0);
        g.lineTo(13, 0);
        g.stroke();
        g.moveTo(7, 7);
        g.lineTo(14, 0);
        g.lineTo(7, -7);
        g.stroke();
    }

    private playDoorEnterEffect() {
        if (this.menuIsEntering) {
            return;
        }

        this.menuIsEntering = true;
        GameAudio.playRune();
        const canvas = director.getScene()?.getChildByName('Canvas');
        if (!canvas) {
            director.loadScene(this.SceneList[7]);
            return;
        }

        const fx = new Node('DoorEnterEffect');
        canvas.addChild(fx);
        fx.setSiblingIndex(canvas.children.length - 1);
        fx.setPosition(new Vec3(0, 76, 0));
        fx.addComponent(UITransform).setContentSize(420, 700);
        const opacity = fx.addComponent(UIOpacity);
        opacity.opacity = 235;
        const g = fx.addComponent(Graphics);
        g.fillColor = new Color(81, 255, 226, 75);
        g.circle(0, 0, 44);
        g.fill();
        g.fillColor = new Color(255, 239, 150, 64);
        g.circle(0, 0, 22);
        g.fill();
        g.lineWidth = 5;
        g.strokeColor = new Color(117, 255, 235, 190);
        g.circle(0, 0, 54);
        g.stroke();
        g.lineWidth = 2;
        g.strokeColor = new Color(255, 230, 126, 180);
        for (let i = 0; i < 8; i++) {
            const angle = i * Math.PI / 4;
            g.moveTo(Math.cos(angle) * 18, Math.sin(angle) * 18);
            g.lineTo(Math.cos(angle) * 180, Math.sin(angle) * 180);
        }
        g.stroke();

        const fade = new Node('MenuFadeOut');
        canvas.addChild(fade);
        fade.setSiblingIndex(canvas.children.length - 1);
        fade.addComponent(UITransform).setContentSize(420, 700);
        const fadeOpacity = fade.addComponent(UIOpacity);
        fadeOpacity.opacity = 0;
        const fg = fade.addComponent(Graphics);
        fg.fillColor = new Color(3, 10, 12, 255);
        fg.fillRect(-210, -350, 420, 700);

        tween(fx)
            .to(0.42, { scale: new Vec3(3.4, 3.4, 1) })
            .start();
        tween(opacity)
            .to(0.42, { opacity: 0 })
            .start();
        tween(fadeOpacity)
            .delay(0.18)
            .to(0.32, { opacity: 235 })
            .call(() => director.loadScene(this.SceneList[7]))
            .start();
    }

    private loadMapScene(sceneIndex: number, buttonNumber: number) {
        if (this.isLoadingMap) {
            return;
        }

        GameAudio.playClick();
        SettingsStore.update({ mode: 'level' });
        const buttonNode = this.getMapSelectionButton(buttonNumber);
        if (!buttonNode) {
            director.loadScene(this.SceneList[sceneIndex]);
            return;
        }

        this.isLoadingMap = true;
        this.clearMapSelectionFeedback();
        this.showMapSelectionFeedback(buttonNode, 255, 1.2);
        this.scheduleOnce(() => director.loadScene(this.SceneList[sceneIndex]), 0.12);
    }

    private loadEndlessMode() {
        if (this.isLoadingMap) {
            return;
        }

        GameAudio.playClick();
        SettingsStore.update({ mode: 'endless' });
        this.isLoadingMap = true;
        this.scheduleOnce(() => director.loadScene(this.SceneList[0]), 0.12);
    }

    private buildOptionsScene() {
        const canvas = director.getScene()?.getChildByName('Canvas');
        if (!canvas) {
            return;
        }

        this.createTitle(canvas);

        this.languageValueLabel = this.createOptionButton(canvas, 156, () => this.cycleLanguage());
        this.difficultyValueLabel = this.createOptionButton(canvas, 96, () => this.cycleDifficulty());
        this.modeValueLabel = this.createOptionButton(canvas, 36, () => this.cycleMode());
        this.musicValueLabel = this.createOptionButton(canvas, -24, () => this.toggleMusic());
        this.soundValueLabel = this.createOptionButton(canvas, -84, () => this.toggleSound());
        this.vibrationValueLabel = this.createOptionButton(canvas, -144, () => this.toggleVibration());

        this.createTextButton(canvas, '隐私政策', -204, () => this.showHelper('隐私政策链接会在广告 SDK 接入后连接。'));
        this.createTextButton(canvas, '返回', -268, () => this.LoadSceneMenu());

        this.helperLabel = this.createLabel(canvas, '', 0, -320, 320, 30, 15, new Color(255, 250, 222, 255));
        this.refreshOptions();
    }

    private createTitle(parent: Node) {
        const title = this.createLabel(parent, '设置', 0, 250, 320, 48, 36, new Color(78, 45, 18, 255));
        this.applyStrongOutline(title, new Color(255, 232, 143, 255), 3);
        const subTitle = this.createLabel(parent, 'Settings', 0, 214, 320, 26, 17, new Color(38, 83, 78, 255));
        this.applyStrongOutline(subTitle, new Color(218, 255, 243, 220), 2);
    }

    private applyStrongOutline(label: Label, color: Color, width: number) {
        (label as any).enableOutline = true;
        (label as any).outlineColor = color;
        (label as any).outlineWidth = width;
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
        buttonNode.addComponent(UITransform).setContentSize(310, 54);

        if (this.optionButtonSpriteFrame) {
            const visualNode = new Node('ButtonVisual');
            buttonNode.addChild(visualNode);
            visualNode.setScale(new Vec3(0.5, 0.174, 1));
            visualNode.addComponent(UITransform).setContentSize(620, 310);
            const sprite = visualNode.addComponent(Sprite);
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
            sprite.spriteFrame = this.optionButtonSpriteFrame;
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        }

        const button = buttonNode.addComponent(Button);
        buttonNode.on(Button.EventType.CLICK, () => {
            GameAudio.playClick();
            onClick();
        }, this);

        const labelNode = new Node('Label');
        buttonNode.addChild(labelNode);
        labelNode.addComponent(UITransform).setContentSize(260, 34);
        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = 17;
        label.lineHeight = 34;
        label.color = new Color(255, 244, 190, 255);
        (label as any).horizontalAlign = 1;
        (label as any).verticalAlign = 1;

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
        label.lineHeight = height;
        label.color = color;
        (label as any).horizontalAlign = 1;
        (label as any).verticalAlign = 1;
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

    private cycleMode() {
        const settings = SettingsStore.load();
        SettingsStore.update({ mode: settings.mode === 'level' ? 'endless' : 'level' });
        this.refreshOptions('Mode saved.');
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
            this.languageValueLabel.string = `语言：${SettingsStore.labelForLanguage(settings.language)}`;
        }
        if (this.difficultyValueLabel) {
            this.difficultyValueLabel.string = `难度：${SettingsStore.labelForDifficulty(settings.difficulty)}`;
        }
        if (this.modeValueLabel) {
            this.modeValueLabel.string = `模式：${settings.mode === 'endless' ? '无尽' : '关卡'}`;
        }
        if (this.musicValueLabel) {
            this.musicValueLabel.string = `音乐：${settings.musicEnabled ? '开' : '关'}`;
        }
        if (this.soundValueLabel) {
            this.soundValueLabel.string = `音效：${settings.soundEnabled ? '开' : '关'}`;
        }
        if (this.vibrationValueLabel) {
            this.vibrationValueLabel.string = `震动：${settings.vibrationEnabled ? '开' : '关'}`;
        }
        this.showHelper(helperText);
    }

    private showHelper(text: string) {
        if (this.helperLabel) {
            this.helperLabel.string = text;
        }
    }

    private bindMapSelectionFeedback() {
        const canvas = director.getScene()?.getChildByName('Canvas');
        const mapSelectionUI = canvas?.getChildByName('MapSelectionUI');
        if (!mapSelectionUI) {
            return;
        }

        for (const node of mapSelectionUI.children) {
            if (!node.name.startsWith('Button')) {
                continue;
            }

            const sprite = node.getComponent(Sprite);
            if (!sprite) {
                continue;
            }

            const reset = () => {
                if (this.isLoadingMap) {
                    return;
                }
                sprite.color = new Color(255, 255, 255, 0);
                sprite.enabled = false;
                node.setScale(new Vec3(1, 1, 1));
            };
            const hover = () => {
                if (!this.isLoadingMap) {
                    this.showMapSelectionFeedback(node, 125, 1.06);
                }
            };
            const press = () => {
                if (!this.isLoadingMap) {
                    this.showMapSelectionFeedback(node, 230, 1.14);
                }
            };

            reset();
            node.on(Node.EventType.MOUSE_ENTER, hover, this);
            node.on(Node.EventType.MOUSE_LEAVE, reset, this);
            node.on(Node.EventType.TOUCH_START, press, this);
            node.on(Node.EventType.TOUCH_END, reset, this);
            node.on(Node.EventType.TOUCH_CANCEL, reset, this);
        }
    }

    private buildMapSelectionExtras() {
        const canvas = director.getScene()?.getChildByName('Canvas');
        if (!canvas || canvas.getChildByName('MapSelectionExtras')) {
            return;
        }

        const root = new Node('MapSelectionExtras');
        canvas.addChild(root);
        root.setSiblingIndex(canvas.children.length - 1);

        this.createMapBadgeButton(root, '∞', '无尽', 178, 272, () => this.loadEndlessMode());
        this.createMapBadgeButton(root, '榜', '排行', 178, 212, () => this.showLeaderboard());
    }

    private createMapBadgeButton(parent: Node, icon: string, caption: string, x: number, y: number, onClick: () => void): Node {
        const node = new Node(`Badge-${caption}`);
        parent.addChild(node);
        node.setPosition(new Vec3(x, y, 0));
        node.addComponent(UITransform).setContentSize(58, 58);

        const g = node.addComponent(Graphics);
        g.fillColor = new Color(11, 32, 36, 215);
        g.circle(0, 0, 28);
        g.fill();
        g.fillColor = new Color(28, 77, 76, 232);
        g.circle(0, 0, 22);
        g.fill();
        g.lineWidth = 2;
        g.strokeColor = new Color(245, 214, 126, 235);
        g.circle(0, 0, 28);
        g.stroke();
        g.strokeColor = new Color(96, 236, 222, 170);
        g.circle(0, 0, 18);
        g.stroke();

        const iconNode = new Node('Icon');
        node.addChild(iconNode);
        iconNode.setPosition(new Vec3(0, 7, 0));
        iconNode.addComponent(UITransform).setContentSize(42, 30);
        const iconLabel = iconNode.addComponent(Label);
        iconLabel.string = icon;
        iconLabel.fontSize = 25;
        iconLabel.lineHeight = 30;
        iconLabel.color = new Color(255, 241, 177, 255);
        (iconLabel as any).horizontalAlign = 1;
        (iconLabel as any).verticalAlign = 1;

        const captionNode = new Node('Caption');
        node.addChild(captionNode);
        captionNode.setPosition(new Vec3(0, -17, 0));
        captionNode.addComponent(UITransform).setContentSize(48, 16);
        const captionLabel = captionNode.addComponent(Label);
        captionLabel.string = caption;
        captionLabel.fontSize = 12;
        captionLabel.lineHeight = 16;
        captionLabel.color = new Color(178, 255, 240, 245);
        (captionLabel as any).horizontalAlign = 1;
        (captionLabel as any).verticalAlign = 1;

        const button = node.addComponent(Button);
        button.target = node;
        node.on(Button.EventType.CLICK, () => {
            GameAudio.playClick();
            onClick();
        }, this);
        return node;
    }

    private createSmallButton(parent: Node, text: string, x: number, y: number, onClick: () => void): Node {
        const node = new Node(`Button-${text}`);
        parent.addChild(node);
        node.setPosition(new Vec3(x, y, 0));
        node.addComponent(UITransform).setContentSize(150, 46);

        const g = node.addComponent(Graphics);
        g.fillColor = new Color(22, 49, 48, 235);
        g.fillRect(-75, -23, 150, 46);
        g.lineWidth = 2;
        g.strokeColor = new Color(237, 198, 96, 220);
        g.moveTo(-68, -20);
        g.lineTo(68, -20);
        g.lineTo(74, 0);
        g.lineTo(68, 20);
        g.lineTo(-68, 20);
        g.lineTo(-74, 0);
        g.lineTo(-68, -20);
        g.stroke();

        const labelNode = new Node('Label');
        node.addChild(labelNode);
        labelNode.addComponent(UITransform).setContentSize(130, 32);
        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = 18;
        label.lineHeight = 32;
        label.color = new Color(255, 244, 190, 255);
        (label as any).horizontalAlign = 1;
        (label as any).verticalAlign = 1;

        const button = node.addComponent(Button);
        button.target = node;
        node.on(Button.EventType.CLICK, () => {
            GameAudio.playClick();
            onClick();
        }, this);
        return node;
    }

    private showLeaderboard() {
        const canvas = director.getScene()?.getChildByName('Canvas');
        if (!canvas) {
            return;
        }

        if (this.leaderboardPanel) {
            this.leaderboardPanel.destroy();
            this.leaderboardPanel = null;
            return;
        }

        this.leaderboardPanel = new Node('LeaderboardPanel');
        canvas.addChild(this.leaderboardPanel);
        this.leaderboardPanel.setSiblingIndex(canvas.children.length - 1);

        const g = this.leaderboardPanel.addComponent(Graphics);
        g.fillColor = new Color(8, 18, 19, 210);
        g.fillRect(-210, -350, 420, 700);
        g.fillColor = new Color(24, 52, 50, 248);
        g.fillRect(-170, -214, 340, 428);
        g.lineWidth = 2;
        g.strokeColor = new Color(242, 203, 105, 230);
        g.moveTo(-170, -214);
        g.lineTo(170, -214);
        g.lineTo(170, 214);
        g.lineTo(-170, 214);
        g.lineTo(-170, -214);
        g.stroke();

        this.createPanelLabel('排行榜', 0, 170, 280, 40, 28, new Color(255, 237, 164, 255));
        this.createPanelLabel('无尽模式分数', 0, 132, 260, 26, 16, new Color(139, 245, 235, 255));
        const scores = this.loadLeaderboard();
        const lines = scores.length > 0
            ? scores.map((item, index) => `${index + 1}. ${item.score}分  ${item.time}s  第${item.wave}波`).join('\n')
            : '暂无记录';
        this.createPanelLabel(lines, 0, 22, 280, 190, 18, new Color(255, 248, 216, 255));
        this.createSmallButton(this.leaderboardPanel, '关闭', 0, -166, () => this.showLeaderboard());
    }

    private createPanelLabel(text: string, x: number, y: number, width: number, height: number, fontSize: number, color: Color): Label | null {
        if (!this.leaderboardPanel) {
            return null;
        }

        const node = new Node(`Label-${text.slice(0, 6)}`);
        this.leaderboardPanel.addChild(node);
        node.setPosition(new Vec3(x, y, 0));
        node.addComponent(UITransform).setContentSize(width, height);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = Math.max(fontSize + 6, 26);
        label.color = color;
        (label as any).horizontalAlign = 1;
        (label as any).verticalAlign = 1;
        return label;
    }

    private loadLeaderboard(): { score: number; time: number; wave: number }[] {
        const raw = sys.localStorage.getItem('zuma_endless_leaderboard_v1');
        if (!raw) {
            return [];
        }

        try {
            const saved = JSON.parse(raw) as { score: number; time: number; wave: number }[];
            return Array.isArray(saved)
                ? saved
                    .filter(item => Number.isFinite(item.score))
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 5)
                : [];
        } catch {
            return [];
        }
    }

    private getMapSelectionButton(buttonNumber: number): Node | null {
        const canvas = director.getScene()?.getChildByName('Canvas');
        const mapSelectionUI = canvas?.getChildByName('MapSelectionUI');
        return mapSelectionUI?.getChildByName(`Button${buttonNumber}`) ?? null;
    }

    private clearMapSelectionFeedback() {
        const canvas = director.getScene()?.getChildByName('Canvas');
        const mapSelectionUI = canvas?.getChildByName('MapSelectionUI');
        if (!mapSelectionUI) {
            return;
        }

        for (const node of mapSelectionUI.children) {
            const sprite = node.getComponent(Sprite);
            if (!sprite) {
                continue;
            }

            sprite.color = new Color(255, 255, 255, 0);
            sprite.enabled = false;
            node.setScale(new Vec3(1, 1, 1));
        }
    }

    private showMapSelectionFeedback(node: Node, alpha: number, scale: number) {
        const sprite = node.getComponent(Sprite);
        if (!sprite) {
            return;
        }

        sprite.color = new Color(255, 255, 255, alpha);
        sprite.enabled = true;
        node.setScale(new Vec3(scale, scale, 1));
    }

}
