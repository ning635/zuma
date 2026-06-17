import { _decorator, Button, Color, Component, director, Graphics, Label, Node, sys, UITransform, Vec3 } from 'cc';
import { SettingsStore } from './SettingsStore';
import { GameAudio } from './GameAudio';
const { ccclass, property } = _decorator;

type RuneId = 'frost' | 'flame' | 'greed' | 'rewind';

interface RuneOption {
    id: RuneId;
    title: string;
    desc: string;
    color: Color;
}

const RUNE_DEFS: RuneOption[] = [
    {
        id: 'frost',
        title: '霜门',
        desc: '冻结更久',
        color: new Color(95, 226, 255, 255),
    },
    {
        id: 'flame',
        title: '火纹',
        desc: '4连爆邻球',
        color: new Color(255, 126, 68, 255),
    },
    {
        id: 'greed',
        title: '金契',
        desc: '金币更多',
        color: new Color(255, 213, 79, 255),
    },
    {
        id: 'rewind',
        title: '回响',
        desc: '推回球链',
        color: new Color(189, 149, 255, 255),
    },
];

@ccclass('GameManager')
export class GameManager extends Component {
    public static instance: GameManager;

    @property({ tooltip: '整关总倒计时，单位秒' })
    levelTime: number = 90;

    @property(Node)
    gameOverUI: Node = null!;

    @property(Node)
    VictoryUI: Node = null!;

    private timeLeft: number = 0;
    private score: number = 0;
    private combo: number = 0;
    private coinsEarned: number = 0;
    private totalCoins: number = 0;
    private levelEnded: boolean = false;
    private hudRoot: Node | null = null;
    private runePanel: Node | null = null;
    private runeUpgradePanel: Node | null = null;
    private coinLabel: Label | null = null;
    private timeLabel: Label | null = null;
    private scoreLabel: Label | null = null;
    private comboLabel: Label | null = null;
    private noticeLabel: Label | null = null;
    private runeSummaryLabel: Label | null = null;
    private readonly leaderboardStorageKey = 'zuma_endless_leaderboard_v1';
    private readonly runeRefreshBaseCost: number = 12;
    private readonly runeRefreshCostStep: number = 8;
    private readonly adCoinReward: number = 40;
    private currentWave: number = 1;
    private totalWaves: number = 3;
    private choosingRune: boolean = false;
    private isEndlessMode: boolean = false;
    private endlessElapsed: number = 0;
    private runeCharge: number = 0;
    private readonly runeChargeNeed: number = 3;
    private freezeTime: number = 0;
    private choosingOpeningRune: boolean = false;
    private pendingWaveStart: ((waveIndex: number) => void) | null = null;
    private currentRuneChoices: RuneOption[] = [];
    private currentRuneRefreshCost: number = 12;
    private runeLevels: Record<RuneId, number> = {
        frost: 0,
        flame: 0,
        greed: 0,
        rewind: 0,
    };

    onLoad() {
        // 单例绑定
        GameManager.instance = this;
    }

    start() {
        this.isEndlessMode = SettingsStore.load().mode === 'endless';
        GameAudio.preload();
        this.timeLeft = this.levelTime;
        this.endlessElapsed = 0;
        this.score = 0;
        this.combo = 0;
        this.coinsEarned = 0;
        this.totalCoins = 0;
        this.levelEnded = false;
        this.currentWave = 1;
        this.choosingRune = false;
        this.choosingOpeningRune = false;
        this.runeCharge = 0;
        this.freezeTime = 0;
        this.pendingWaveStart = null;
        this.runeUpgradePanel = null;
        this.runeLevels = {
            frost: 0,
            flame: 0,
            greed: 0,
            rewind: 0,
        };
        if (this.gameOverUI) {
            this.gameOverUI.active = false;
        }
        if (this.VictoryUI) {
            this.VictoryUI.active = false;
        }
        this.buildOpenGateEffect();
        this.buildMobileHud();
        this.refreshHud(this.isEndlessMode ? 'ENDLESS MODE' : 'CLEAR CHAIN');
    }

    update(dt: number) {
        if (this.levelEnded) {
            return;
        }

        if (this.choosingRune) {
            this.refreshHud();
            return;
        }

        if (this.freezeTime > 0) {
            this.freezeTime = Math.max(0, this.freezeTime - dt);
        }

        if (this.isEndlessMode) {
            this.endlessElapsed += dt;
        } else {
            this.timeLeft = Math.max(0, this.timeLeft - dt);
            if (this.timeLeft <= 0) {
                this.GameOver();
                return;
            }
        }

        this.refreshHud();
    }

    public CanPlay(): boolean {
        return !this.levelEnded && !this.choosingRune;
    }

    public IsChainFrozen(): boolean {
        return this.freezeTime > 0;
    }

    public RegisterMatch(count: number) {
        if (this.levelEnded) {
            return;
        }

        this.combo++;
        const scoreGain = count * 100 + Math.max(0, this.combo - 1) * 60;
        const greedBonus = this.runeLevels.greed > 0 ? this.runeLevels.greed * Math.max(1, Math.floor(count / 3)) : 0;
        const coinGain = count + Math.max(0, this.combo - 1) + greedBonus;
        this.score += scoreGain;
        this.coinsEarned += coinGain;
        this.totalCoins += coinGain;
        this.chargeRune();
        this.refreshHud(`+${coinGain} COINS`);
    }

    public HandleWaveCleared(startNextWave: (waveIndex: number) => void) {
        if (this.levelEnded || this.choosingRune) {
            return;
        }

        this.combo = 0;
        if (!this.isEndlessMode && this.currentWave >= this.totalWaves) {
            this.Victory();
            return;
        }

        this.pendingWaveStart = startNextWave;
        this.choosingRune = true;
        this.choosingOpeningRune = false;
        this.runeCharge = 0;
        this.showRuneChoices();
        this.refreshHud('CHOOSE RUNE');
    }

    public BeginOpeningRuneChoice(startFirstWave: (waveIndex: number) => void) {
        if (this.levelEnded || this.choosingRune || this.pendingWaveStart) {
            return;
        }

        this.currentWave = 1;
        this.pendingWaveStart = startFirstWave;
        this.choosingRune = true;
        this.choosingOpeningRune = true;
        this.runeCharge = 0;
        this.showRuneChoices();
        this.refreshHud('CHOOSE START RUNE');
    }

    public GetFireExpansion(matchCount: number): number {
        if (this.runeLevels.flame <= 0 || matchCount < 4) {
            return 0;
        }
        return Math.min(2, this.runeLevels.flame);
    }

    public GetRewindStep(): number {
        if (this.runeLevels.rewind <= 0) {
            return 0;
        }
        return 0.012 + this.runeLevels.rewind * 0.006;
    }

    public BreakCombo() {
        if (this.combo > 0) {
            this.combo = 0;
            this.refreshHud();
        }
    }

    public GameOver() {
        if (this.levelEnded) {
            return;
        }
        this.levelEnded = true;
        this.combo = 0;
        this.recordEndlessScore();
        if (this.gameOverUI) {
            this.gameOverUI.active = true;
        }
        this.refreshHud('TRY AGAIN');
    }

    public Victory(){
        if (this.levelEnded) {
            return;
        }
        if (this.isEndlessMode) {
            this.GameOver();
            return;
        }
        this.levelEnded = true;
        const timeBonus = Math.ceil(this.timeLeft / 10);
        this.coinsEarned += timeBonus;
        this.totalCoins += timeBonus;
        if(this.VictoryUI){
            this.VictoryUI.active=true
        }
        this.refreshHud(`BONUS +${timeBonus}`);
    }

    public TryAgain() {
        director.loadScene(director.getScene().name);
    }

    private buildOpenGateEffect() {
        const canvas = director.getScene()?.getChildByName('Canvas');
        if (!canvas) {
            return;
        }

        const oldGate = canvas.getChildByName('OpenGateEffect');
        if (oldGate) {
            oldGate.destroy();
        }

        const gate = new Node('OpenGateEffect');
        canvas.addChild(gate);
        gate.setSiblingIndex(1);
        gate.setPosition(new Vec3(82, 210, 0));

        const g = gate.addComponent(Graphics);
        g.fillColor = new Color(13, 24, 25, 238);
        g.fillRect(-24, -34, 48, 58);
        g.circle(0, 24, 24);
        g.fill();

        g.lineWidth = 4;
        g.strokeColor = new Color(69, 241, 225, 210);
        g.moveTo(-27, -34);
        g.lineTo(-27, 21);
        g.lineTo(-17, 41);
        g.lineTo(0, 49);
        g.lineTo(17, 41);
        g.lineTo(27, 21);
        g.lineTo(27, -34);
        g.stroke();

        g.lineWidth = 2;
        g.strokeColor = new Color(255, 225, 129, 165);
        g.moveTo(-17, -26);
        g.lineTo(-17, 18);
        g.lineTo(-7, 32);
        g.lineTo(0, 35);
        g.lineTo(7, 32);
        g.lineTo(17, 18);
        g.lineTo(17, -26);
        g.stroke();
    }

    private chargeRune() {
        this.runeCharge++;
        if (this.runeCharge < this.runeChargeNeed) {
            return;
        }

        this.runeCharge = 0;
        const duration = 1.2 + this.runeLevels.frost * 0.45;
        this.freezeTime = Math.max(this.freezeTime, duration);
        this.flashGate();
        GameAudio.playRune();
        this.refreshHud(`RUNE FREEZE ${duration.toFixed(1)}s`);
    }

    private flashGate() {
        const gate = director.getScene()?.getChildByName('Canvas')?.getChildByName('OpenGateEffect');
        if (!gate) {
            return;
        }
        gate.setScale(new Vec3(1.12, 1.12, 1));
        this.scheduleOnce(() => {
            if (gate.isValid) {
                gate.setScale(new Vec3(1, 1, 1));
            }
        }, 0.16);
    }

    private buildMobileHud() {
        const canvas = director.getScene()?.getChildByName('Canvas');
        if (!canvas) {
            return;
        }

        const oldHud = canvas.getChildByName('MobileHud');
        if (oldHud) {
            oldHud.destroy();
        }

        this.hudRoot = new Node('MobileHud');
        canvas.addChild(this.hudRoot);
        this.hudRoot.setSiblingIndex(canvas.children.length - 1);

        this.coinLabel = this.createHudPill('CoinHud', -105, 309, 92, 38, new Color(255, 226, 105, 255), 'coin', '金币：局内获得，局内消费');
        this.timeLabel = this.createHudPill('TimeHud', 5, 312, 90, 36, new Color(141, 255, 238, 255), 'time', '时间：整关总倒计时');
        this.scoreLabel = this.createHudPill('ScoreHud', 114, 309, 92, 38, new Color(255, 248, 213, 255), 'score', '分数：连击越高奖励越多');
        this.createHudActionButton('AdCoinButton', 'AD +40', -56, 226, 92, 30, () => this.watchAdForCoins());
        this.createHudActionButton('RuneUpgradeButton', '升级符文', 58, 226, 104, 30, () => this.showRuneUpgradePanel());
        this.comboLabel = this.createPlainLabel('ComboHud', 0, 279, 260, 24, 15, new Color(255, 242, 170, 255));
        this.noticeLabel = this.createNoticeLabel();
        this.runeSummaryLabel = this.createRuneSummaryLabel();
    }

    private createHudPill(name: string, x: number, y: number, width: number, height: number, color: Color, iconType: 'coin' | 'time' | 'score', helpText: string): Label | null {
        if (!this.hudRoot) {
            return null;
        }

        const node = new Node(name);
        this.hudRoot.addChild(node);
        node.setPosition(new Vec3(x, y, 0));
        node.addComponent(UITransform).setContentSize(width, height);

        const bg = node.addComponent(Graphics);
        this.drawHudPlate(bg, width, height);
        this.drawHudIcon(bg, iconType, -width / 2 + 18, 0);
        this.createHelpButton(node, width / 2 - 8, height / 2 - 7, helpText);

        return this.createPlainLabel(`${name}Label`, x + 13, y, width - 34, height, 17, color);
    }

    private createHelpButton(parent: Node, x: number, y: number, helpText: string) {
        const node = new Node('HelpButton');
        parent.addChild(node);
        node.setPosition(new Vec3(x, y, 0));
        node.addComponent(UITransform).setContentSize(20, 20);

        const g = node.addComponent(Graphics);
        g.fillColor = new Color(29, 67, 67, 240);
        g.circle(0, 0, 8);
        g.fill();
        g.lineWidth = 1;
        g.strokeColor = new Color(235, 211, 123, 220);
        g.circle(0, 0, 8);
        g.stroke();

        const labelNode = new Node('HelpText');
        node.addChild(labelNode);
        labelNode.addComponent(UITransform).setContentSize(18, 18);
        const label = labelNode.addComponent(Label);
        label.string = '?';
        label.fontSize = 13;
        label.lineHeight = 18;
        label.color = new Color(255, 244, 176, 255);
        (label as any).horizontalAlign = 1;
        (label as any).verticalAlign = 1;
        this.applyLabelStyle(label);

        node.addComponent(Button);
        node.on(Button.EventType.CLICK, () => {
            GameAudio.playClick();
            this.showHelp(helpText);
        }, this);
    }

    private showHelp(text: string) {
        this.refreshHud(text);
    }

    private createHudActionButton(name: string, text: string, x: number, y: number, width: number, height: number, onClick: () => void) {
        if (!this.hudRoot) {
            return;
        }

        const node = new Node(name);
        this.hudRoot.addChild(node);
        node.setPosition(new Vec3(x, y, 0));
        node.addComponent(UITransform).setContentSize(width, height);

        const g = node.addComponent(Graphics);
        g.fillColor = new Color(29, 65, 59, 230);
        g.fillRect(-width / 2, -height / 2, width, height);
        g.lineWidth = 2;
        g.strokeColor = new Color(237, 198, 96, 210);
        g.moveTo(-width / 2, -height / 2);
        g.lineTo(width / 2, -height / 2);
        g.lineTo(width / 2, height / 2);
        g.lineTo(-width / 2, height / 2);
        g.lineTo(-width / 2, -height / 2);
        g.stroke();

        const labelNode = new Node('Label');
        node.addChild(labelNode);
        labelNode.addComponent(UITransform).setContentSize(width - 8, height);
        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = 13;
        label.lineHeight = height;
        label.color = new Color(255, 238, 170, 255);
        (label as any).horizontalAlign = 1;
        (label as any).verticalAlign = 1;
        this.applyLabelStyle(label);

        const button = node.addComponent(Button);
        button.target = node;
        node.on(Button.EventType.CLICK, () => {
            GameAudio.playClick();
            onClick();
        }, this);
    }

    private showRuneChoices() {
        const canvas = director.getScene()?.getChildByName('Canvas');
        if (!canvas) {
            return;
        }

        if (this.runePanel) {
            this.runePanel.destroy();
        }

        this.runePanel = new Node('RuneChoicePanel');
        canvas.addChild(this.runePanel);
        this.runePanel.setSiblingIndex(canvas.children.length - 1);

        const shade = this.runePanel.addComponent(Graphics);
        shade.fillColor = new Color(9, 16, 18, 175);
        shade.fillRect(-210, -350, 420, 700);

        this.createRunePanelLabel('RuneTitle', '选择符文', 0, 150, 260, 32, 24, new Color(255, 228, 140, 255));
        const choiceIndex = this.choosingOpeningRune ? 1 : Math.min(this.totalWaves, this.currentWave + 1);
        const subTitle = this.choosingOpeningRune
            ? `第 ${choiceIndex}/${this.totalWaves} 次符文选择：开局构筑`
            : `第 ${this.currentWave} 波完成  第 ${choiceIndex}/${this.totalWaves} 次符文选择`;
        this.createRunePanelLabel('RuneSubTitle', subTitle, 0, 116, 340, 24, 13, new Color(143, 255, 232, 255));

        if (this.currentRuneChoices.length === 0) {
            this.currentRuneChoices = this.getRuneChoices();
            this.currentRuneRefreshCost = this.runeRefreshBaseCost;
        }
        for (let i = 0; i < this.currentRuneChoices.length; i++) {
            this.createRuneCard(this.currentRuneChoices[i], -118 + i * 118, -8);
        }
        this.createRunePanelButton('金币刷新', -74, -120, 132, 34, () => this.refreshRuneChoicesWithCoins());
        this.createRunePanelButton('看广告刷新', 74, -120, 132, 34, () => this.refreshRuneChoicesByAd());
        this.createRunePanelLabel('RuneCost', `本次刷新 ${this.currentRuneRefreshCost} 金币，下次 +${this.runeRefreshCostStep}`, 0, -154, 280, 24, 13, new Color(255, 237, 159, 255));
    }

    private createRunePanelButton(text: string, x: number, y: number, width: number, height: number, onClick: () => void) {
        if (!this.runePanel) {
            return;
        }

        const node = new Node(`RunePanelButton-${text}`);
        this.runePanel.addChild(node);
        node.setPosition(new Vec3(x, y, 0));
        node.addComponent(UITransform).setContentSize(width, height);

        const g = node.addComponent(Graphics);
        g.fillColor = new Color(34, 72, 65, 242);
        g.fillRect(-width / 2, -height / 2, width, height);
        g.lineWidth = 2;
        g.strokeColor = new Color(244, 205, 103, 230);
        g.moveTo(-width / 2, -height / 2);
        g.lineTo(width / 2, -height / 2);
        g.lineTo(width / 2, height / 2);
        g.lineTo(-width / 2, height / 2);
        g.lineTo(-width / 2, -height / 2);
        g.stroke();

        this.createRunePanelLabel(`${text}-Label`, text, 0, 0, width - 8, height, 14, new Color(255, 244, 190, 255), node);

        const button = node.addComponent(Button);
        button.target = node;
        node.on(Button.EventType.CLICK, () => {
            GameAudio.playClick();
            onClick();
        }, this);
    }

    private refreshRuneChoicesWithCoins() {
        if (this.totalCoins < this.currentRuneRefreshCost) {
            this.refreshHud(`金币不足，刷新需${this.currentRuneRefreshCost}`);
            return;
        }

        this.totalCoins -= this.currentRuneRefreshCost;
        this.increaseRuneRefreshCost();
        this.rerollRuneChoices('金币已刷新');
    }

    private refreshRuneChoicesByAd() {
        this.simulateRewardedAd(() => {
            this.increaseRuneRefreshCost();
            this.rerollRuneChoices('广告刷新成功');
        });
    }

    private rerollRuneChoices(notice: string) {
        this.currentRuneChoices = this.getRuneChoices();
        this.showRuneChoices();
        this.refreshHud(notice);
    }

    private increaseRuneRefreshCost() {
        this.currentRuneRefreshCost += this.runeRefreshCostStep;
    }

    private getRuneChoices(): RuneOption[] {
        return [...RUNE_DEFS]
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
    }

    private createRuneCard(option: RuneOption, x: number, y: number) {
        if (!this.runePanel) {
            return;
        }

        const card = new Node(`RuneCard-${option.id}`);
        this.runePanel.addChild(card);
        card.setPosition(new Vec3(x, y, 0));
        card.addComponent(UITransform).setContentSize(104, 142);

        const g = card.addComponent(Graphics);
        g.fillColor = new Color(23, 41, 43, 242);
        g.fillRect(-52, -71, 104, 142);
        g.fillColor = new Color(78, 58, 35, 235);
        g.fillRect(-46, -65, 92, 130);
        g.fillColor = new Color(19, 62, 60, 238);
        g.fillRect(-40, -59, 80, 118);
        g.lineWidth = 2;
        g.strokeColor = option.color;
        g.moveTo(-47, -66);
        g.lineTo(47, -66);
        g.lineTo(47, 66);
        g.lineTo(-47, 66);
        g.lineTo(-47, -66);
        g.stroke();

        g.fillColor = option.color;
        g.circle(0, 28, 18);
        g.fill();
        g.fillColor = new Color(255, 255, 255, 120);
        g.circle(-6, 35, 5);
        g.fill();

        this.createRunePanelLabel(`${option.id}-Title`, `${option.title} Lv${this.runeLevels[option.id] + 1}`, 0, -8, 88, 24, 15, new Color(255, 244, 192, 255), card);
        this.createRunePanelLabel(`${option.id}-Desc`, option.desc, 0, -35, 90, 38, 12, new Color(213, 255, 239, 255), card);

        card.addComponent(Button);
        card.on(Button.EventType.CLICK, () => {
            GameAudio.playClick();
            this.chooseRune(option);
        }, this);
    }

    private createRunePanelLabel(name: string, text: string, x: number, y: number, width: number, height: number, fontSize: number, color: Color, parent?: Node): Label | null {
        const target = parent ?? this.runePanel;
        if (!target) {
            return null;
        }

        const node = new Node(name);
        target.addChild(node);
        node.setPosition(new Vec3(x, y, 0));
        node.addComponent(UITransform).setContentSize(width, height);

        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = Math.max(height / 2, fontSize + 3);
        label.color = color;
        (label as any).horizontalAlign = 1;
        (label as any).verticalAlign = 1;
        this.applyLabelStyle(label);
        return label;
    }

    private chooseRune(option: RuneOption) {
        this.runeLevels[option.id]++;
        this.choosingRune = false;
        if (!this.choosingOpeningRune) {
            this.currentWave++;
        }
        if (this.runePanel) {
            this.runePanel.destroy();
            this.runePanel = null;
        }
        this.currentRuneChoices = [];
        this.currentRuneRefreshCost = this.runeRefreshBaseCost;

        const startNextWave = this.pendingWaveStart;
        this.pendingWaveStart = null;
        const waveToStart = this.choosingOpeningRune ? 1 : this.currentWave;
        this.choosingOpeningRune = false;
        startNextWave?.(waveToStart);
        this.refreshRuneSummary();
        this.refreshHud(`${option.title} Lv${this.runeLevels[option.id]}`);
    }

    private watchAdForCoins() {
        this.simulateRewardedAd(() => {
            this.totalCoins += this.adCoinReward;
            this.coinsEarned += this.adCoinReward;
            this.refreshHud(`广告奖励 +${this.adCoinReward}`);
        });
    }

    private simulateRewardedAd(onReward: () => void) {
        onReward();
    }

    private showRuneUpgradePanel(forceRebuild = false) {
        const canvas = director.getScene()?.getChildByName('Canvas');
        if (!canvas) {
            return;
        }

        if (this.runeUpgradePanel) {
            this.runeUpgradePanel.destroy();
            this.runeUpgradePanel = null;
            if (!forceRebuild) {
                return;
            }
        }

        this.runeUpgradePanel = new Node('RuneUpgradePanel');
        canvas.addChild(this.runeUpgradePanel);
        this.runeUpgradePanel.setSiblingIndex(canvas.children.length - 1);

        const shade = this.runeUpgradePanel.addComponent(Graphics);
        shade.fillColor = new Color(8, 16, 18, 185);
        shade.fillRect(-210, -350, 420, 700);

        const panel = new Node('UpgradeFrame');
        this.runeUpgradePanel.addChild(panel);
        panel.addComponent(UITransform).setContentSize(344, 430);
        const g = panel.addComponent(Graphics);
        g.fillColor = new Color(22, 48, 48, 248);
        g.fillRect(-172, -215, 344, 430);
        g.fillColor = new Color(34, 67, 61, 245);
        g.fillRect(-158, -199, 316, 398);
        g.lineWidth = 2;
        g.strokeColor = new Color(244, 207, 111, 230);
        g.moveTo(-172, -215);
        g.lineTo(172, -215);
        g.lineTo(172, 215);
        g.lineTo(-172, 215);
        g.lineTo(-172, -215);
        g.stroke();

        this.createUpgradePanelLabel('升级符文', 0, 176, 260, 34, 24, new Color(255, 235, 152, 255));
        this.createUpgradePanelLabel(`局内金币 ${this.totalCoins}`, 0, 146, 220, 24, 15, new Color(148, 255, 231, 255));

        for (let i = 0; i < RUNE_DEFS.length; i++) {
            this.createRuneUpgradeRow(RUNE_DEFS[i], 84 - i * 64);
        }

        this.createUpgradePanelButton('广告+40', -72, -174, 118, 34, () => {
            this.watchAdForCoins();
            this.showRuneUpgradePanel(true);
        });
        this.createUpgradePanelButton('关闭', 72, -174, 118, 34, () => this.showRuneUpgradePanel());
    }

    private createRuneUpgradeRow(rune: RuneOption, y: number) {
        if (!this.runeUpgradePanel) {
            return;
        }

        const level = this.runeLevels[rune.id];
        const cost = this.getRuneUpgradeCost(rune.id);
        const row = new Node(`UpgradeRow-${rune.id}`);
        this.runeUpgradePanel.addChild(row);
        row.setPosition(new Vec3(0, y, 0));
        row.addComponent(UITransform).setContentSize(292, 54);

        const g = row.addComponent(Graphics);
        g.fillColor = level > 0 ? new Color(18, 54, 50, 230) : new Color(23, 34, 36, 205);
        g.fillRect(-146, -27, 292, 54);
        g.lineWidth = 1;
        g.strokeColor = level > 0 ? rune.color : new Color(116, 124, 118, 180);
        g.moveTo(-146, -27);
        g.lineTo(146, -27);
        g.lineTo(146, 27);
        g.lineTo(-146, 27);
        g.lineTo(-146, -27);
        g.stroke();

        g.fillColor = level > 0 ? rune.color : new Color(88, 98, 96, 220);
        g.circle(-116, 0, 16);
        g.fill();

        this.createUpgradePanelLabel(`${rune.title}  Lv${level}`, -38, 9, 138, 22, 16, new Color(255, 242, 188, 255), row);
        const sub = level > 0 ? `${rune.desc}  升级 ${cost}金币` : '未拥有，先选到该符文';
        this.createUpgradePanelLabel(sub, -34, -13, 160, 20, 12, new Color(216, 255, 238, 245), row);
        this.createUpgradePanelButton(level > 0 ? `升 ${cost}` : '未拥有', 104, 0, 70, 30, () => this.tryUpgradeRune(rune.id), row);
    }

    private createUpgradePanelButton(text: string, x: number, y: number, width: number, height: number, onClick: () => void, parent?: Node) {
        const target = parent ?? this.runeUpgradePanel;
        if (!target) {
            return;
        }

        const node = new Node(`UpgradeButton-${text}`);
        target.addChild(node);
        node.setPosition(new Vec3(x, y, 0));
        node.addComponent(UITransform).setContentSize(width, height);

        const g = node.addComponent(Graphics);
        g.fillColor = new Color(42, 79, 70, 240);
        g.fillRect(-width / 2, -height / 2, width, height);
        g.lineWidth = 2;
        g.strokeColor = new Color(240, 203, 107, 220);
        g.moveTo(-width / 2, -height / 2);
        g.lineTo(width / 2, -height / 2);
        g.lineTo(width / 2, height / 2);
        g.lineTo(-width / 2, height / 2);
        g.lineTo(-width / 2, -height / 2);
        g.stroke();

        this.createUpgradePanelLabel(text, 0, 0, width - 8, height, 13, new Color(255, 244, 190, 255), node);

        const button = node.addComponent(Button);
        button.target = node;
        node.on(Button.EventType.CLICK, () => {
            GameAudio.playClick();
            onClick();
        }, this);
    }

    private createUpgradePanelLabel(name: string, x: number, y: number, width: number, height: number, fontSize: number, color: Color, parent?: Node): Label | null {
        const target = parent ?? this.runeUpgradePanel;
        if (!target) {
            return null;
        }

        const node = new Node(`UpgradeLabel-${name}`);
        target.addChild(node);
        node.setPosition(new Vec3(x, y, 0));
        node.addComponent(UITransform).setContentSize(width, height);

        const label = node.addComponent(Label);
        label.string = name;
        label.fontSize = fontSize;
        label.lineHeight = height;
        label.color = color;
        (label as any).horizontalAlign = 1;
        (label as any).verticalAlign = 1;
        this.applyLabelStyle(label);
        return label;
    }

    private createRuneSummaryLabel(): Label | null {
        if (!this.hudRoot) {
            return null;
        }

        const node = new Node('RuneSummaryHud');
        this.hudRoot.addChild(node);
        node.setPosition(new Vec3(0, -300, 0));
        node.addComponent(UITransform).setContentSize(320, 34);

        const g = node.addComponent(Graphics);
        g.fillColor = new Color(13, 34, 32, 150);
        g.fillRect(-160, -17, 320, 34);

        const label = node.addComponent(Label);
        label.fontSize = 13;
        label.lineHeight = 34;
        label.color = new Color(228, 255, 236, 240);
        (label as any).horizontalAlign = 1;
        (label as any).verticalAlign = 1;
        this.applyLabelStyle(label);
        return label;
    }

    private tryUpgradeRune(id: RuneId) {
        if (this.runeLevels[id] <= 0) {
            this.refreshHud('先选择该符文');
            return;
        }

        const cost = this.getRuneUpgradeCost(id);
        if (this.totalCoins < cost) {
            this.refreshHud(`金币不足，升级需${cost}`);
            return;
        }

        this.totalCoins -= cost;
        this.runeLevels[id]++;
        this.refreshRuneSummary();
        const rune = this.getRuneDef(id);
        this.refreshHud(`${rune.title} 升至 Lv${this.runeLevels[id]}`);
        if (this.runeUpgradePanel) {
            this.showRuneUpgradePanel(true);
        }
    }

    private getRuneUpgradeCost(id: RuneId): number {
        return 25 + this.runeLevels[id] * 18;
    }

    private getRuneDef(id: RuneId): RuneOption {
        return RUNE_DEFS.find(item => item.id === id) ?? RUNE_DEFS[0];
    }

    private refreshRuneSummary() {
        if (!this.runeSummaryLabel) {
            return;
        }

        const owned = RUNE_DEFS
            .filter(rune => this.runeLevels[rune.id] > 0)
            .map(rune => `${rune.title}Lv${this.runeLevels[rune.id]}`);
        this.runeSummaryLabel.string = owned.length > 0 ? `符文 ${owned.join('  ')}` : '符文 暂无';
    }

    private drawHudPlate(g: Graphics, width: number, height: number) {
        g.fillColor = new Color(32, 38, 39, 220);
        g.fillRect(-width / 2 + 10, -height / 2, width - 20, height);
        g.fillColor = new Color(70, 55, 36, 235);
        g.fillRect(-width / 2 + 16, -height / 2 + 4, width - 32, height - 8);
        g.fillColor = new Color(23, 58, 58, 220);
        g.fillRect(-width / 2 + 20, -height / 2 + 7, width - 40, height - 14);
        g.lineWidth = 2;
        g.strokeColor = new Color(245, 201, 99, 180);
        g.moveTo(-width / 2 + 12, -height / 2 + 2);
        g.lineTo(width / 2 - 12, -height / 2 + 2);
        g.lineTo(width / 2 - 4, 0);
        g.lineTo(width / 2 - 12, height / 2 - 2);
        g.lineTo(-width / 2 + 12, height / 2 - 2);
        g.lineTo(-width / 2 + 4, 0);
        g.lineTo(-width / 2 + 12, -height / 2 + 2);
        g.stroke();
    }

    private drawHudIcon(g: Graphics, type: 'coin' | 'time' | 'score', x: number, y: number) {
        const main = type === 'coin'
            ? new Color(246, 190, 55, 255)
            : type === 'time'
                ? new Color(78, 224, 211, 255)
                : new Color(255, 231, 120, 255);
        g.fillColor = new Color(33, 24, 17, 230);
        g.circle(x, y, 16);
        g.fill();
        g.fillColor = main;
        g.circle(x, y, 12);
        g.fill();
        g.fillColor = new Color(255, 255, 255, 110);
        g.circle(x - 4, y + 5, 4);
        g.fill();

        if (type === 'time') {
            g.lineWidth = 3;
            g.strokeColor = new Color(18, 61, 63, 220);
            g.moveTo(x, y + 7);
            g.lineTo(x, y);
            g.lineTo(x + 6, y - 4);
            g.stroke();
            return;
        }

        if (type === 'score') {
            g.fillColor = new Color(113, 73, 23, 200);
            g.circle(x, y, 5);
            g.fill();
        }
    }

    private createPlainLabel(name: string, x: number, y: number, width: number, height: number, fontSize: number, color: Color): Label | null {
        if (!this.hudRoot) {
            return null;
        }

        const node = new Node(name);
        this.hudRoot.addChild(node);
        node.setPosition(new Vec3(x, y, 0));
        node.addComponent(UITransform).setContentSize(width, height);

        const label = node.addComponent(Label);
        label.fontSize = fontSize;
        label.lineHeight = height;
        label.color = color;
        (label as any).horizontalAlign = 1;
        (label as any).verticalAlign = 1;
        this.applyLabelStyle(label);
        return label;
    }

    private createNoticeLabel(): Label | null {
        if (!this.hudRoot) {
            return null;
        }

        const node = new Node('NoticeHud');
        this.hudRoot.addChild(node);
        node.setPosition(new Vec3(0, 255, 0));
        node.addComponent(UITransform).setContentSize(180, 22);

        const bg = node.addComponent(Graphics);
        bg.fillColor = new Color(18, 44, 38, 120);
        bg.fillRect(-90, -11, 180, 22);
        bg.lineWidth = 1;
        bg.strokeColor = new Color(210, 190, 104, 120);
        bg.moveTo(-90, -11);
        bg.lineTo(90, -11);
        bg.lineTo(90, 11);
        bg.lineTo(-90, 11);
        bg.lineTo(-90, -11);
        bg.stroke();

        const labelNode = new Node('NoticeHudLabel');
        this.hudRoot.addChild(labelNode);
        labelNode.setPosition(new Vec3(0, 255, 0));
        labelNode.addComponent(UITransform).setContentSize(170, 22);

        const label = labelNode.addComponent(Label);
        label.fontSize = 13;
        label.lineHeight = 22;
        label.color = new Color(236, 255, 224, 235);
        (label as any).horizontalAlign = 1;
        (label as any).verticalAlign = 1;
        this.applyLabelStyle(label);
        return label;
    }

    private applyLabelStyle(label: Label) {
        (label as any).enableOutline = true;
        (label as any).outlineColor = new Color(36, 31, 20, 220);
        (label as any).outlineWidth = 2;
    }

    private refreshHud(notice = '') {
        if (this.coinLabel) {
            this.coinLabel.string = `${this.totalCoins}`;
        }
        if (this.timeLabel) {
            this.timeLabel.string = `${Math.ceil(this.isEndlessMode ? this.endlessElapsed : this.timeLeft)}`;
        }
        if (this.scoreLabel) {
            this.scoreLabel.string = `${this.score}`;
        }
        if (this.comboLabel) {
            const freeze = this.freezeTime > 0 ? `  FREEZE ${this.freezeTime.toFixed(1)}s` : '';
            const waveText = this.isEndlessMode ? `ENDLESS WAVE ${this.currentWave}` : `WAVE ${this.currentWave}/${this.totalWaves}`;
            this.comboLabel.string = this.combo > 1
                ? `${waveText}  COMBO x${this.combo}${freeze}`
                : `${waveText}  RUNE ${this.runeCharge}/${this.runeChargeNeed}${freeze}`;
        }
        this.refreshRuneSummary();
        if (notice && this.noticeLabel) {
            this.noticeLabel.string = notice;
        }
    }

    private recordEndlessScore() {
        if (!this.isEndlessMode || this.score <= 0) {
            return;
        }

        const scores = this.loadLeaderboard();
        scores.push({
            score: this.score,
            time: Math.ceil(this.endlessElapsed),
            wave: this.currentWave,
        });
        scores.sort((a, b) => b.score - a.score);
        sys.localStorage.setItem(this.leaderboardStorageKey, JSON.stringify(scores.slice(0, 5)));
    }

    private loadLeaderboard(): { score: number; time: number; wave: number }[] {
        const raw = sys.localStorage.getItem(this.leaderboardStorageKey);
        if (!raw) {
            return [];
        }

        try {
            const saved = JSON.parse(raw) as { score: number; time: number; wave: number }[];
            return Array.isArray(saved) ? saved.filter(item => Number.isFinite(item.score)) : [];
        } catch {
            return [];
        }
    }

}
