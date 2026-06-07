import {SettingsSync} from "./app/SettingsSync.js";
import {FormBuilder} from "./lib/formBuilder.js";
import {l} from "./lib/utils.js";
import {MODULE_ID} from "./main.js";

const SETTING_CACHE = {};
const DEFAULT_CACHE = false;

export function registerSettings() {
    const settings = {
        masterAgnostic: {
            scope: "world",
            config: true,
            type: Boolean,
            default: false,
        },
        masterSystem: {
            scope: "world",
            config: true,
            type: Boolean,
            default: false,
        },
        autoCheckSync: {
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
        },
        autoPerformSync: {
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
        },
        silentUpload: {
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
        },
        syncModules: {
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
        },
        syncUsers: {
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
        },
        syncSettings: {
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
        },
    };

    registerSettingsArray(settings);

    game.settings.registerMenu(MODULE_ID, "settingsSync", {
        name: `${MODULE_ID}.settings.settingsSync.name`,
        label: `${MODULE_ID}.settings.settingsSync.label`,
        hint: `${MODULE_ID}.settings.settingsSync.hint`,
        icon: "fas fa-cogs",
        scope: "world",
        restricted: true,
        type: SettingsSync,
    });

    Hooks.once("i18nInit", () => {

        const fb = new FormBuilder();
        fb.size({width: "auto", height: window.innerHeight * 0.8});
        fb.title(`${MODULE_ID}.settings.exclusionList.title`);
        console.log(l(`${MODULE_ID}.settings.exclusionList.info`));
        fb.info(l(`${MODULE_ID}.settings.exclusionList.info`));
        fb.checkbox({label: `${MODULE_ID}.settings.exclusionList.core`, name: "core"});
        fb.checkbox({label: game.system.title, name: game.system.id});
        const modules = Array.from(game.modules).sort((a, b) => a.title.localeCompare(b.title));
        for (const module of modules) {
            fb.checkbox({label: module.title, name: module.id});
        }
        fb.registerAsMenu({moduleId: MODULE_ID, icon: "fa-solid fa-ban", key: "exclusionList", name: `${MODULE_ID}.settings.exclusionList.name`, label: `${MODULE_ID}.settings.exclusionList.label`, hint: `${MODULE_ID}.settings.exclusionList.hint`, scope: "world", restricted: true, defaultValue: {}});

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