import { _decorator, Component, Node, Vec3, instantiate, Prefab, input, Input, EventTouch, UITransform, Label, Color, Graphics, Sprite, view, ResolutionPolicy } from 'cc';
const { ccclass, property } = _decorator;

type BallColor = number;
type GamePhase = 'playing' | 'won' | 'lost';
type ShotType = 'normal' | 'bomb';
type BallKind = 'normal' | 'relic';

const DESIGN_WIDTH = 720;
const DESIGN_HEIGHT = 1280;
const BALL_SCALE = 0.052;
const RELIC_SCALE = 0.06;
const BOMB_SCALE = 0.072;

interface ChainBall {
    node: Node;
    color: BallColor;
    distance: number;
    kind: BallKind;
}

interface ShotBall {
    node: Node;
    color: BallColor;
    type: ShotType;
    velocity: Vec3;
    targetIndex: number;
}

interface AimTarget {
    index: number;
    distanceToRay: number;
    forwardDistance: number;
}

@ccclass('ZumaGame')
export class ZumaGame extends Component {
    @property({ type: [Node], tooltip: 'Path points in moving order.' })
    pathPoints: Node[] = [];

    @property({ type: [Prefab], tooltip: 'Ball prefabs. Index is treated as color id.' })
    ballPrefab: Prefab[] = [];

    @property({ tooltip: 'How many balls exist when a level starts.' })
    spawnCount = 24;

    @property({ tooltip: 'Path speed in pixels per second.' })
    moveSpeed = 34;

    @property({ tooltip: 'Ball spacing in pixels along the path.' })
    ballSpacing = 58;

    @property({ tooltip: 'Touch assist corridor around the aim ray.' })
    aimAssistRadius = 96;

    @property({ tooltip: 'Projectile collision radius.' })
    hitRadius = 66;

    @property({ tooltip: 'Projectile speed in scene units per second.' })
    shotSpeed = 1120;

    @property({ tooltip: 'Relics needed to win the prototype level.' })
    relicGoal = 4;

    @property({ tooltip: 'Start position of the mobile shooter.' })
    shooterPosition = new Vec3(0, -510, 0);

    @property({ tooltip: 'Enable one rewarded-ad revive placeholder after losing.' })
    rewardedReviveEnabled = true;

    private chain: ChainBall[] = [];
    private shots: ShotBall[] = [];
    private segmentLengths: number[] = [];
    private pathLength = 0;
    private currentColor: BallColor = 0;
    private nextColor: BallColor = 0;
    private nextShotType: ShotType = 'normal';
    private phase: GamePhase = 'playing';
    private score = 0;
    private combo = 0;
    private streakCharge = 0;
    private relicsCollected = 0;
    private reviveUsed = false;
    private hudLabel: Label | null = null;
    private helperLabel: Label | null = null;
    private shooterNode: Node | null = null;
    private currentPreview: Node | null = null;
    private nextPreview: Node | null = null;
    private backdropGraphics: Graphics | null = null;
    private trackGraphics: Graphics | null = null;
    private guideGraphics: Graphics | null = null;
    private randomCursor = 0;

    start() {
        this.applyMobileDesign();
        this.applyPrototypeDefaults();
        this.cachePathMetrics();
        this.setupPrototypeVisuals();
        this.startLevel();
        input.on(Input.EventType.TOUCH_START, this.onTouchAim, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchAim, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.on(Input.EventType.TOUCH_CANCEL, this.clearAimGuide, this);
    }

    onDestroy() {
        input.off(Input.EventType.TOUCH_START, this.onTouchAim, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchAim, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.off(Input.EventType.TOUCH_CANCEL, this.clearAimGuide, this);
    }

    update(dt: number) {
        if (this.phase !== 'playing') {
            return;
        }

        this.advanceChain(dt);
        this.advanceShots(dt);
        this.refreshHud();
    }

    private applyMobileDesign() {
        view.setDesignResolutionSize(DESIGN_WIDTH, DESIGN_HEIGHT, ResolutionPolicy.FIXED_WIDTH);
        this.shooterPosition = new Vec3(0, -510, 0);
        this.applyMobilePath();
    }

    private applyMobilePath() {
        if (this.pathPoints.length < 2) {
            return;
        }
        const mobilePath = [
            new Vec3(-250, 410, 0),
            new Vec3(230, 410, 0),
            new Vec3(230, 245, 0),
            new Vec3(-215, 245, 0),
            new Vec3(-215, 75, 0),
            new Vec3(190, 75, 0),
            new Vec3(190, -92, 0),
            new Vec3(-160, -92, 0),
            new Vec3(-160, -248, 0),
            new Vec3(135, -248, 0),
            new Vec3(135, -390, 0),
            new Vec3(-20, -390, 0),
        ];
        const count = Math.min(this.pathPoints.length, mobilePath.length);
        for (let i = 0; i < count; i++) {
            this.pathPoints[i].setPosition(mobilePath[i]);
        }
    }
    private applyPrototypeDefaults() {
        this.spawnCount = Math.max(this.spawnCount, 26);
        this.moveSpeed = this.moveSpeed < 20 ? 38 : this.moveSpeed;
        this.ballSpacing = this.ballSpacing < 38 ? 42 : this.ballSpacing;
        this.hitRadius = Math.max(this.hitRadius, 38);
        this.aimAssistRadius = Math.max(this.aimAssistRadius, 66);
        this.shotSpeed = Math.max(this.shotSpeed, 920);
        this.relicGoal = Math.max(this.relicGoal, 4);
    }

    private startLevel() {
        this.clearRuntimeNodes();
        this.phase = 'playing';
        this.score = 0;
        this.combo = 0;
        this.streakCharge = 0;
        this.relicsCollected = 0;
        this.reviveUsed = false;
        this.nextShotType = 'normal';
        this.currentColor = this.pickHelpfulColor();
        this.nextColor = this.pickHelpfulColor();
        this.spawnChain();
        this.refreshShooterPreview();
        this.refreshHud('Collect relic balls. Combos charge a bomb shot.');
    }

    private cachePathMetrics() {
        this.segmentLengths = [];
        this.pathLength = 0;
        for (let i = 0; i < this.pathPoints.length - 1; i++) {
            const length = Vec3.distance(this.pathPoints[i].position, this.pathPoints[i + 1].position);
            this.segmentLengths.push(length);
            this.pathLength += length;
        }
    }

    private spawnChain() {
        const colors = Math.max(1, this.ballPrefab.length);
        for (let i = 0; i < this.spawnCount; i++) {
            const color = Math.floor(i / 2) % colors;
            const kind: BallKind = i > 0 && i % 7 === 0 ? 'relic' : 'normal';
            const distance = -i * this.ballSpacing;
            this.chain.push(this.createChainBall(color, distance, kind));
        }
        this.sortChain();
        this.layoutChain();
    }

    private createChainBall(color: BallColor, distance: number, kind: BallKind): ChainBall {
        const node = this.createBallNode(color, kind);
        node.setParent(this.node.parent ?? this.node);
        return { node, color, distance, kind };
    }

    private createBallNode(color: BallColor, kind: BallKind = 'normal'): Node {
        const prefab = this.ballPrefab[this.normalizeColor(color)];
        const node = prefab ? instantiate(prefab) : new Node(`Ball_${color}`);
        node.name = kind === 'relic' ? `RelicBall_${this.normalizeColor(color)}` : `Ball_${this.normalizeColor(color)}`;
        const scale = kind === 'relic' ? RELIC_SCALE : BALL_SCALE;
        node.setScale(scale, scale, 1);

        const sprite = node.getComponent(Sprite);
        if (sprite && kind === 'relic') {
            sprite.color = new Color(255, 236, 142, 255);
        }
        return node;
    }

    private advanceChain(dt: number) {
        for (const ball of this.chain) {
            ball.distance += this.moveSpeed * dt;
        }

        this.sortChain();
        this.keepSpacing();
        this.layoutChain();

        const head = this.chain[0];
        if (head && head.distance >= this.pathLength) {
            this.onLose();
        }
    }

    private keepSpacing() {
        for (let i = 1; i < this.chain.length; i++) {
            const previous = this.chain[i - 1];
            const current = this.chain[i];
            const desired = previous.distance - this.ballSpacing;
            if (current.distance > desired) {
                current.distance = desired;
            }
        }
    }

    private layoutChain() {
        for (const ball of this.chain) {
            ball.node.setPosition(this.getPointByDistance(ball.distance));
        }
    }

    private advanceShots(dt: number) {
        for (let i = this.shots.length - 1; i >= 0; i--) {
            const shot = this.shots[i];
            shot.node.setPosition(shot.node.position.add(shot.velocity.clone().multiplyScalar(dt)));

            const insertIndex = this.findHitIndex(shot.node.position, shot.targetIndex);
            if (insertIndex >= 0) {
                this.insertShot(i, insertIndex);
                continue;
            }

            if (Math.abs(shot.node.position.x) > DESIGN_WIDTH * 0.62 || Math.abs(shot.node.position.y) > DESIGN_HEIGHT * 0.56) {
                shot.node.destroy();
                this.shots.splice(i, 1);
            }
        }
    }

    private findHitIndex(position: Vec3, preferredIndex: number): number {
        if (preferredIndex >= 0 && preferredIndex < this.chain.length) {
            if (Vec3.distance(position, this.chain[preferredIndex].node.position) <= this.hitRadius * 1.3) {
                return preferredIndex;
            }
        }

        let bestIndex = -1;
        let bestDistance = this.hitRadius;
        for (let i = 0; i < this.chain.length; i++) {
            const distance = Vec3.distance(position, this.chain[i].node.position);
            if (distance <= bestDistance) {
                bestDistance = distance;
                bestIndex = i;
            }
        }
        return bestIndex;
    }

    private insertShot(shotIndex: number, hitIndex: number) {
        const shot = this.shots[shotIndex];
        shot.node.destroy();
        this.shots.splice(shotIndex, 1);

        if (shot.type === 'bomb') {
            this.resolveBomb(hitIndex);
            return;
        }

        const hitBall = this.chain[hitIndex];
        const insertDistance = hitBall.distance + this.ballSpacing;
        const inserted = this.createChainBall(shot.color, insertDistance, 'normal');
        this.chain.splice(hitIndex, 0, inserted);

        this.sortChain();
        this.keepSpacing();
        this.layoutChain();
        this.resolveMatches(this.chain.indexOf(inserted));
    }

    private resolveMatches(centerIndex: number) {
        if (centerIndex < 0 || centerIndex >= this.chain.length) {
            return;
        }

        const color = this.chain[centerIndex].color;
        let start = centerIndex;
        let end = centerIndex;

        while (start > 0 && this.chain[start - 1].color === color) {
            start--;
        }
        while (end < this.chain.length - 1 && this.chain[end + 1].color === color) {
            end++;
        }

        const count = end - start + 1;
        if (count < 3) {
            this.combo = 0;
            return;
        }

        this.combo++;
        this.streakCharge++;
        this.score += count * 100 + Math.max(0, this.combo - 1) * 120;
        this.removeRange(start, end, true);

        if (this.streakCharge >= 3) {
            this.streakCharge = 0;
            this.nextShotType = 'bomb';
            this.refreshHud('Combo charged a bomb shot.');
        } else {
            this.refreshHud(`Combo x${this.combo}`);
        }

        if (this.checkWin()) {
            return;
        }

        const bridgeIndex = Math.min(start, this.chain.length - 1);
        if (bridgeIndex >= 0) {
            this.scheduleOnce(() => this.resolveMatches(bridgeIndex), 0.08);
        }
    }

    private resolveBomb(hitIndex: number) {
        const start = Math.max(0, hitIndex - 2);
        const end = Math.min(this.chain.length - 1, hitIndex + 2);
        this.combo = 0;
        this.score += 350;
        this.removeRange(start, end, true);
        this.refreshHud('Bomb blast cleared the danger zone.');
        this.checkWin();
    }

    private removeRange(start: number, end: number, countRelics: boolean) {
        if (start < 0 || end < start || start >= this.chain.length) {
            return;
        }

        const safeEnd = Math.min(end, this.chain.length - 1);
        const anchorDistance = this.chain[start].distance;
        const removed = this.chain.splice(start, safeEnd - start + 1);
        for (const ball of removed) {
            if (countRelics && ball.kind === 'relic') {
                this.relicsCollected++;
            }
            ball.node.destroy();
        }

        this.compactAfterRemoval(start, anchorDistance);
        this.layoutChain();
    }

    private compactAfterRemoval(startIndex: number, anchorDistance: number) {
        for (let i = startIndex; i < this.chain.length; i++) {
            const desired = anchorDistance - (i - startIndex) * this.ballSpacing;
            this.chain[i].distance = Math.min(this.chain[i].distance, desired);
        }
        this.sortChain();
        this.keepSpacing();
    }

    private checkWin(): boolean {
        if (this.relicsCollected >= this.relicGoal || this.chain.length === 0) {
            this.onWin();
            return true;
        }
        return false;
    }

    private onTouchAim(event: EventTouch) {
        if (this.phase !== 'playing') {
            return;
        }
        this.drawAimGuide(this.touchToLocalPosition(event));
    }

    private onTouchEnd(event: EventTouch) {
        if (this.phase === 'lost') {
            this.tryRewardedRevive();
            return;
        }
        if (this.phase === 'won') {
            this.startLevel();
            return;
        }
        if (this.shots.length >= 2) {
            return;
        }

        const touchTarget = this.touchToLocalPosition(event);
        const assisted = this.findAimTarget(touchTarget);
        const fireTarget = assisted.index >= 0 ? this.chain[assisted.index].node.position.clone() : touchTarget;
        const direction = fireTarget.subtract(this.shooterPosition);
        if (direction.lengthSqr() <= 0.001) {
            return;
        }
        direction.normalize();

        const node = this.createBallNode(this.currentColor);
        node.setParent(this.node.parent ?? this.node);
        node.setPosition(this.shooterPosition);
        if (this.nextShotType === 'bomb') {
            node.setScale(BOMB_SCALE, BOMB_SCALE, 1);
        }

        this.shots.push({
            node,
            color: this.currentColor,
            type: this.nextShotType,
            velocity: direction.multiplyScalar(this.shotSpeed),
            targetIndex: assisted.index,
        });

        this.nextShotType = 'normal';
        this.currentColor = this.nextColor;
        this.nextColor = this.pickHelpfulColor();
        this.refreshShooterPreview();
        this.clearAimGuide();
    }

    private touchToLocalPosition(event: EventTouch): Vec3 {
        const uiLocation = event.getUILocation();
        const parent = this.node.parent;
        const transform = parent?.getComponent(UITransform);
        if (transform) {
            return transform.convertToNodeSpaceAR(new Vec3(uiLocation.x, uiLocation.y, 0));
        }
        return new Vec3(uiLocation.x, uiLocation.y, 0);
    }

    private findAimTarget(touchTarget: Vec3): AimTarget {
        const aim = touchTarget.clone().subtract(this.shooterPosition);
        if (aim.lengthSqr() <= 0.001) {
            return { index: -1, distanceToRay: 0, forwardDistance: 0 };
        }
        aim.normalize();

        let best: AimTarget = { index: -1, distanceToRay: this.aimAssistRadius, forwardDistance: 0 };
        for (let i = 0; i < this.chain.length; i++) {
            const toBall = this.chain[i].node.position.clone().subtract(this.shooterPosition);
            const forward = Vec3.dot(toBall, aim);
            if (forward <= 35) {
                continue;
            }

            const closest = this.shooterPosition.clone().add(aim.clone().multiplyScalar(forward));
            const distanceToRay = Vec3.distance(this.chain[i].node.position, closest);
            const colorBonus = this.chain[i].color === this.currentColor ? 18 : 0;
            const effectiveDistance = distanceToRay - colorBonus;
            if (effectiveDistance < best.distanceToRay) {
                best = { index: i, distanceToRay: effectiveDistance, forwardDistance: forward };
            }
        }
        return best;
    }

    private tryRewardedRevive() {
        if (!this.rewardedReviveEnabled || this.reviveUsed) {
            this.startLevel();
            return;
        }

        this.reviveUsed = true;
        this.phase = 'playing';
        this.nextShotType = 'bomb';
        for (const ball of this.chain) {
            ball.distance -= this.ballSpacing * 6;
        }
        this.refreshShooterPreview();
        this.refreshHud('Rewarded revive: chain pushed back and a bomb is ready.');
    }

    private onWin() {
        this.phase = 'won';
        this.clearAimGuide();
        this.refreshHud('Victory! Tap to replay. Show interstitial after a natural pause.');
    }

    private onLose() {
        this.phase = 'lost';
        this.clearAimGuide();
        const message = this.rewardedReviveEnabled && !this.reviveUsed
            ? 'Tap to simulate rewarded revive: push back + bomb.'
            : 'Out of time. Tap to restart.';
        this.refreshHud(message);
    }

    private setupPrototypeVisuals() {
        this.removePrototypeVisuals();
        this.hideOldBackground();
        this.createBackdrop();
        this.drawTrack();
        this.createShooterUi();
    }

    private removePrototypeVisuals() {
        const parent = this.node.parent;
        if (!parent) {
            return;
        }
        const names = ['TempleGardenBackdrop', 'MobileTempleBackdrop', 'MobileGameRoot', 'ReadableTrack', 'Shooter', 'AimGuide', 'PrototypeHUD', 'PrototypeHelper'];
        for (const name of names) {
            const child = parent.getChildByName(name);
            if (child) {
                child.destroy();
            }
        }
        this.backdropGraphics = null;
        this.trackGraphics = null;
        this.guideGraphics = null;
        this.shooterNode = null;
        this.currentPreview = null;
        this.nextPreview = null;
        this.hudLabel = null;
        this.helperLabel = null;
    }
    private hideOldBackground() {
        const bg = this.node.parent?.getChildByName('BackGround0');
        if (bg) {
            bg.active = false;
        }
    }

    private createBackdrop() {
        const parent = this.node.parent ?? this.node;
        const node = new Node('MobileGameRoot');
        node.setParent(parent);
        node.setSiblingIndex(1);
        this.backdropGraphics = node.addComponent(Graphics);

        const g = this.backdropGraphics;
        g.clear();
        g.fillColor = new Color(20, 44, 54, 255);
        g.fillRect(-360, -640, DESIGN_WIDTH, DESIGN_HEIGHT);
        g.fillColor = new Color(29, 74, 72, 255);
        g.fillRect(-360, -640, DESIGN_WIDTH, 260);
        g.fillColor = new Color(15, 33, 42, 190);
        g.fillRect(-360, 492, DESIGN_WIDTH, 148);
        g.fillColor = new Color(44, 104, 91, 255);
        for (let i = 0; i < 6; i++) {
            g.circle(-330 + i * 135, -365 + (i % 2) * 12, 34);
            g.fill();
        }
        g.fillColor = new Color(235, 191, 104, 255);
        g.circle(278, 464, 28);
        g.fill();
        g.fillColor = new Color(255, 237, 168, 160);
        g.circle(267, 474, 9);
        g.fill();
    }

    private drawTrack() {
        const parent = this.node.parent ?? this.node;
        const trackNode = new Node('ReadableTrack');
        trackNode.setParent(parent);
        trackNode.setSiblingIndex(2);
        this.trackGraphics = trackNode.addComponent(Graphics);
        const g = this.trackGraphics;
        g.clear();
        this.strokePath(g, 36, new Color(28, 25, 22, 225));
        this.strokePath(g, 28, new Color(110, 83, 57, 255));
        this.strokePath(g, 18, new Color(223, 181, 99, 255));
    }

    private strokePath(g: Graphics, width: number, color: Color) {
        if (this.pathPoints.length < 2) {
            return;
        }
        g.lineWidth = width;
        g.lineCap = 1;
        g.lineJoin = 1;
        g.strokeColor = color;
        g.moveTo(this.pathPoints[0].position.x, this.pathPoints[0].position.y);
        for (let i = 1; i < this.pathPoints.length; i++) {
            g.lineTo(this.pathPoints[i].position.x, this.pathPoints[i].position.y);
        }
        g.stroke();
    }

    private createShooterUi() {
        const parent = this.node.parent ?? this.node;
        this.shooterNode = new Node('Shooter');
        this.shooterNode.setParent(parent);
        this.shooterNode.setPosition(this.shooterPosition);
        this.shooterNode.setSiblingIndex(8);

        const base = this.shooterNode.addComponent(Graphics);
        base.fillColor = new Color(34, 38, 44, 255);
        base.circle(0, 0, 30);
        base.fill();
        base.lineWidth = 4;
        base.strokeColor = new Color(246, 196, 93, 255);
        base.circle(0, 0, 34);
        base.stroke();

        this.currentPreview = new Node('CurrentBallPreview');
        this.currentPreview.setParent(this.shooterNode);
        this.currentPreview.setPosition(0, 0, 0);

        this.nextPreview = new Node('NextBallPreview');
        this.nextPreview.setParent(this.shooterNode);
        this.nextPreview.setPosition(48, -14, 0);
        this.nextPreview.setScale(0.8, 0.8, 1);

        const guideNode = new Node('AimGuide');
        guideNode.setParent(parent);
        guideNode.setSiblingIndex(7);
        this.guideGraphics = guideNode.addComponent(Graphics);

        const hudNode = new Node('PrototypeHUD');
        hudNode.addComponent(UITransform).setContentSize(640, 120);
        hudNode.setParent(parent);
        hudNode.setPosition(-300, 555, 0);
        this.hudLabel = hudNode.addComponent(Label);
        this.hudLabel.fontSize = 22;
        this.hudLabel.lineHeight = 28;
        this.hudLabel.color = new Color(255, 248, 224, 255);
        this.hudLabel.string = '';

        const helperNode = new Node('PrototypeHelper');
        helperNode.addComponent(UITransform).setContentSize(360, 60);
        helperNode.setParent(parent);
        helperNode.setPosition(0, -590, 0);
        this.helperLabel = helperNode.addComponent(Label);
        this.helperLabel.fontSize = 18;
        this.helperLabel.lineHeight = 23;
        this.helperLabel.color = new Color(236, 244, 225, 255);
        this.helperLabel.string = 'Drag to aim. Release to fire.';
    }

    private drawAimGuide(touchTarget: Vec3) {
        if (!this.guideGraphics) {
            return;
        }
        const assisted = this.findAimTarget(touchTarget);
        const end = assisted.index >= 0 ? this.chain[assisted.index].node.position : touchTarget;
        const g = this.guideGraphics;
        g.clear();
        g.lineWidth = 4;
        g.strokeColor = assisted.index >= 0 ? new Color(132, 238, 209, 220) : new Color(255, 248, 224, 160);
        g.moveTo(this.shooterPosition.x, this.shooterPosition.y);
        g.lineTo(end.x, end.y);
        g.stroke();

        if (assisted.index >= 0) {
            g.lineWidth = 5;
            g.strokeColor = new Color(255, 222, 116, 235);
            g.circle(end.x, end.y, this.hitRadius * 0.65);
            g.stroke();
        }
    }

    private clearAimGuide() {
        this.guideGraphics?.clear();
    }

    private refreshShooterPreview() {
        this.replacePreview(this.currentPreview, this.currentColor, Vec3.ZERO, this.nextShotType === 'bomb' ? 1.25 : 1);
        this.replacePreview(this.nextPreview, this.nextColor, Vec3.ZERO, 0.75);
    }

    private replacePreview(holder: Node | null, color: BallColor, position: Vec3, scale: number) {
        if (!holder) {
            return;
        }
        holder.destroyAllChildren();
        const preview = this.createBallNode(color);
        preview.setParent(holder);
        preview.setPosition(position);
        preview.setScale(BALL_SCALE * scale, BALL_SCALE * scale, 1);
    }

    private refreshHud(extra = '') {
        if (!this.hudLabel) {
            return;
        }
        const status = this.phase === 'playing' ? 'PLAY' : this.phase.toUpperCase();
        const bomb = this.nextShotType === 'bomb' ? 'READY' : `${this.streakCharge}/3`;
        this.hudLabel.string = `TEMPLE ORBS | ${status}\nRelics ${this.relicsCollected}/${this.relicGoal}  Score ${this.score}\nBomb ${bomb}  ${extra}`;
    }

    private clearRuntimeNodes() {
        for (const ball of this.chain) {
            ball.node.destroy();
        }
        for (const shot of this.shots) {
            shot.node.destroy();
        }
        this.chain = [];
        this.shots = [];
        this.clearAimGuide();
    }

    private sortChain() {
        this.chain.sort((a, b) => b.distance - a.distance);
    }

    private pickHelpfulColor(): BallColor {
        const colorCount = Math.max(1, this.ballPrefab.length);
        const candidates = new Map<number, number>();
        for (let i = 0; i < this.chain.length - 1; i++) {
            if (this.chain[i].color === this.chain[i + 1].color) {
                candidates.set(this.chain[i].color, (candidates.get(this.chain[i].color) ?? 0) + 1);
            }
        }

        if (candidates.size > 0 && Math.random() < 0.62) {
            const weighted = Array.from(candidates.entries()).sort((a, b) => b[1] - a[1]);
            return weighted[Math.floor(Math.random() * Math.min(3, weighted.length))][0];
        }

        this.randomCursor = (this.randomCursor + 3) % colorCount;
        return Math.floor(Math.random() * colorCount + this.randomCursor) % colorCount;
    }

    private normalizeColor(color: BallColor): BallColor {
        return Math.abs(color) % Math.max(1, this.ballPrefab.length);
    }

    getPointByDistance(distance: number): Vec3 {
        if (this.pathPoints.length < 2) {
            return Vec3.ZERO.clone();
        }

        let remaining = Math.max(0, Math.min(this.pathLength, distance));
        for (let i = 0; i < this.segmentLengths.length; i++) {
            const length = this.segmentLengths[i];
            if (remaining <= length || i === this.segmentLengths.length - 1) {
                const localT = length <= 0 ? 0 : remaining / length;
                const p0 = this.pathPoints[i].position;
                const p1 = this.pathPoints[i + 1].position;
                return new Vec3(
                    p0.x + (p1.x - p0.x) * localT,
                    p0.y + (p1.y - p0.y) * localT,
                    p0.z + (p1.z - p0.z) * localT,
                );
            }
            remaining -= length;
        }
        return this.pathPoints[this.pathPoints.length - 1].position.clone();
    }

    getPointByT(t: number): Vec3 {
        return this.getPointByDistance(t * this.pathLength);
    }
}




