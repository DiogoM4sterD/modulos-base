import {MODULE_ID} from "./main.js";
import { BloatDetector } from "./app/bloatDetector.js";

const SETTING_CACHE = {};
const DEFAULT_CACHE = false;

export function registerSettings() {
    const settings = {
        enabled: {
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
        },
        compressionRatio: {
            scope: "world",
            config: true,
            type: Number,
            default: 0.75,
            range: {
                min: 0.1,
                max: 1,
                step: 0.05,
            },
        },
        maxResolution: {
            scope: "world",
            config: true,
            type: Number,
            default: 8192,
            choices: {
                1024: "media-optimizer.settings.maxResolution.choices.1024",
                2048: "media-optimizer.settings.maxResolution.choices.2048",
                4096: "media-optimizer.settings.maxResolution.choices.4096",
                8192: "media-optimizer.settings.maxResolution.choices.8192",
                16384: "media-optimizer.settings.maxResolution.choices.16384",
            },
        },
        excludeFolders: {
            scope: "world",
            config: true,
            type: String,
            default: "",
        },
        optimizeImages: {
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
        },
        optimizeAudio: {
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
        },
        optimizeVideo: {
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
        },
        slugifyFileNames: {
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
        },
        combinerSettings: {
            scope: "world",
            config: false,
            type: Object,
            default: {},
        },
    };

    registerSettingsArray(settings);

    game.settings.registerMenu(MODULE_ID, "bloatDetector", {
        name: "media-optimizer.settings.bloatDetector.name",
        label: "media-optimizer.settings.bloatDetector.label",
        hint: "media-optimizer.settings.bloatDetector.hint",
        icon: "fa-duotone fa-database",
        type: BloatDetector,
        restricted: true,
    });
}

export function getSetting(key) {
    return SETTING_CACHE[key] ?? game.settings.get(MODULE_ID, key);
}

export async function setSetting(key, value) {
    return await game.settings.set(MODULE_ID, key, value);
}

function registerSettingsArray(settings) {
    for (const [key, value] of Object.entries(settings)) {
        if (!value.name) value.name = `${MODULE_ID}.settings.${key}.name`;
        if (!value.hint) value.hint = `${MODULE_ID}.settings.${key}.hint`;
        if (value.useCache === undefined) value.useCache = DEFAULT_CACHE;
        if (value.useCache) {
            const unwrappedOnChange = value.onChange;
            if (value.onChange)
                value.onChange = (value) => {
                    SETTING_CACHE[key] = value;
                    if (unwrappedOnChange) unwrappedOnChange(value);
                };
        }
        game.settings.register(MODULE_ID, key, value);
        if (value.useCache) SETTING_CACHE[key] = getSetting(key);
    }
}
