import {MODULE_ID} from "./main.js";

const SETTING_CACHE = {};
const DEFAULT_CACHE = false;

export function registerSettings() {
    const settings = {
        sidebarFilepicker: {
            name: `${MODULE_ID}.settings.sidebarFilepicker.name`,
            hint: `${MODULE_ID}.settings.sidebarFilepicker.hint`,
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
            requiresReload: true,
        },
        size: {
            name: `${MODULE_ID}.settings.size.name`,
            hint: `${MODULE_ID}.settings.size.hint`,
            scope: "world",
            config: true,
            type: Number,
            choices: {
                560: `${MODULE_ID}.settings.size.choices.default`,
                700: `${MODULE_ID}.settings.size.choices.large`,
                850: `${MODULE_ID}.settings.size.choices.extraLarge`,
                1000: `${MODULE_ID}.settings.size.choices.massive`,
            },
            default: 520,
            onChange: (setting) => {
                document.documentElement.style.setProperty("--filepickerplus-width", setting + "px");
            },
        },
        imagepreview: {
            name: `${MODULE_ID}.settings.imagepreview.name`,
            hint: `${MODULE_ID}.settings.imagepreview.hint`,
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
        },
        threepreview: {
            name: `${MODULE_ID}.settings.threepreview.name`,
            hint: `${MODULE_ID}.settings.threepreview.hint`,
            scope: "world",
            config: true,
            type: Boolean,
            default: false,
        },
        audiopreview: {
            name: `${MODULE_ID}.settings.audiopreview.name`,
            hint: `${MODULE_ID}.settings.audiopreview.hint`,
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
        },
        audiopreviewdelay: {
            name: `${MODULE_ID}.settings.audiopreviewdelay.name`,
            hint: `${MODULE_ID}.settings.audiopreviewdelay.hint`,
            scope: "world",
            config: true,
            type: Number,
            default: 500,
        },
        audiopreviewvol: {
            name: `${MODULE_ID}.settings.audiopreviewvol.name`,
            hint: `${MODULE_ID}.settings.audiopreviewvol.hint`,
            scope: "world",
            config: true,
            type: Number,
            default: 0.5,
            range: {
                min: 0.1,
                max: 1,
                step: 0.05,
            },
        }
    };

    registerSettingsArray(settings);

    // Apply the initial filepicker size setting
    document.documentElement.style.setProperty("--filepickerplus-width", game.settings.get(MODULE_ID, "size") + "px");
}

export function getSetting(key) {
    return SETTING_CACHE[key] ?? game.settings.get(MODULE_ID, key);
}

export async function setSetting(key, value) {
    return await game.settings.set(MODULE_ID, key, value);
}

function registerSettingsArray(settings) {
    for (const [key, value] of Object.entries(settings)) {
        if (!value.name) value.name = `${MODULE_ID}.settings.${key}.name`
        if (!value.hint) value.hint = `${MODULE_ID}.settings.${key}.hint`
        if (value.useCache === undefined) value.useCache = DEFAULT_CACHE;
        if (value.useCache) {
            const unwrappedOnChange = value.onChange;
            if (value.onChange) value.onChange = (value) => {
                SETTING_CACHE[key] = value;
                if (unwrappedOnChange) unwrappedOnChange(value);
            }
        }
        game.settings.register(MODULE_ID, key, value);
        if(value.useCache) SETTING_CACHE[key] = getSetting(key);
    }
}