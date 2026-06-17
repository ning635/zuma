import { AudioClip, AudioSource, director, Node, resources } from 'cc';
import { SettingsStore } from './SettingsStore';

type SfxName = 'click' | 'shoot' | 'merge' | 'rune';

export class GameAudio {
    private static source: AudioSource | null = null;
    private static clips: Partial<Record<SfxName, AudioClip>> = {};
    private static loading: Partial<Record<SfxName, boolean>> = {};
    private static lastPlayed: Partial<Record<SfxName, number>> = {};
    private static readonly volume: Record<SfxName, number> = {
        click: 0.45,
        shoot: 0.55,
        merge: 0.68,
        rune: 0.75,
    };

    public static preload() {
        GameAudio.ensureSource();
        GameAudio.loadClip('click');
        GameAudio.loadClip('shoot');
        GameAudio.loadClip('merge');
        GameAudio.loadClip('rune');
    }

    public static playClick() {
        GameAudio.play('click');
    }

    public static playShoot() {
        GameAudio.play('shoot');
    }

    public static playMerge() {
        GameAudio.play('merge');
    }

    public static playRune() {
        GameAudio.play('rune');
    }

    private static play(name: SfxName) {
        if (!SettingsStore.load().soundEnabled) {
            return;
        }

        const now = Date.now();
        if ((GameAudio.lastPlayed[name] ?? 0) + 40 > now) {
            return;
        }
        GameAudio.lastPlayed[name] = now;

        const source = GameAudio.ensureSource();
        const clip = GameAudio.clips[name];
        if (!clip) {
            GameAudio.loadClip(name);
            return;
        }

        source.playOneShot(clip, GameAudio.volume[name]);
    }

    private static ensureSource(): AudioSource {
        if (GameAudio.source && GameAudio.source.isValid) {
            return GameAudio.source;
        }

        const scene = director.getScene();
        const node = new Node('GameAudio');
        scene?.addChild(node);
        GameAudio.source = node.addComponent(AudioSource);
        return GameAudio.source;
    }

    private static loadClip(name: SfxName) {
        if (GameAudio.clips[name] || GameAudio.loading[name]) {
            return;
        }

        GameAudio.loading[name] = true;
        resources.load(`audio/${name}`, AudioClip, (error, clip) => {
            GameAudio.loading[name] = false;
            if (!error && clip) {
                GameAudio.clips[name] = clip;
            }
        });
    }
}
