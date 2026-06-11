import { sys } from 'cc';

export type GameLanguage = 'zh-Hans' | 'zh-Hant' | 'en';
export type GameDifficulty = 'easy' | 'normal' | 'hard';

export interface GameSettings {
    language: GameLanguage;
    difficulty: GameDifficulty;
    musicEnabled: boolean;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
}

const STORAGE_KEY = 'zuma_mobile_settings_v1';
//加了语言：英语、简繁中文，先用着，到时候还得加日语、韩语等其他语言（万一大卖呢）
export const languageOptions: { value: GameLanguage; label: string }[] = [
    { value: 'zh-Hans', label: '简体中文' },
    { value: 'zh-Hant', label: '繁体中文' },
    { value: 'en', label: 'English' },
];
//难度选项：简单、普通、困难
export const difficultyOptions: { value: GameDifficulty; label: string }[] = [
    { value: 'easy', label: 'Easy' },
    { value: 'normal', label: 'Normal' },
    { value: 'hard', label: 'Hard' },
];
//默认设置：英语、普通难度、音乐开启、音效开启、震动开启
const defaultSettings: GameSettings = {
    language: 'zh-Hans',
    difficulty: 'normal',
    musicEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
};

export class SettingsStore {
    public static load(): GameSettings {
        const raw = sys.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return { ...defaultSettings };
        }

        try {
            const saved = JSON.parse(raw) as Partial<GameSettings>;
            return {
                language: SettingsStore.pickValid(saved.language, languageOptions, defaultSettings.language),
                difficulty: SettingsStore.pickValid(saved.difficulty, difficultyOptions, defaultSettings.difficulty),
                musicEnabled: typeof saved.musicEnabled === 'boolean' ? saved.musicEnabled : defaultSettings.musicEnabled,
                soundEnabled: typeof saved.soundEnabled === 'boolean' ? saved.soundEnabled : defaultSettings.soundEnabled,
                vibrationEnabled: typeof saved.vibrationEnabled === 'boolean' ? saved.vibrationEnabled : defaultSettings.vibrationEnabled,
            };
        } catch {
            return { ...defaultSettings };
        }
    }

    public static save(settings: GameSettings) {
        sys.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }

    public static update(patch: Partial<GameSettings>): GameSettings {
        const next = { ...SettingsStore.load(), ...patch };
        SettingsStore.save(next);
        return next;
    }

    public static nextLanguage(current: GameLanguage): GameLanguage {
        return SettingsStore.nextOption(current, languageOptions);
    }

    public static nextDifficulty(current: GameDifficulty): GameDifficulty {
        return SettingsStore.nextOption(current, difficultyOptions);
    }

    public static labelForLanguage(value: GameLanguage): string {
        return languageOptions.find(item => item.value === value)?.label ?? '简体中文';
    }

    public static labelForDifficulty(value: GameDifficulty): string {
        return difficultyOptions.find(item => item.value === value)?.label ?? 'Normal';
    }

    private static pickValid<T extends string>(
        value: T | undefined,
        options: { value: T; label: string }[],
        fallback: T,
    ): T {
        return options.some(item => item.value === value) ? value as T : fallback;
    }

    private static nextOption<T extends string>(current: T, options: { value: T; label: string }[]): T {
        const index = options.findIndex(item => item.value === current);
        return options[(index + 1 + options.length) % options.length].value;
    }
}
