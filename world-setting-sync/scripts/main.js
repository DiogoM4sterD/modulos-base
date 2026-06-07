import {SettingsSync} from "./app/SettingsSync.js";
import {initConfig} from "./config.js";
import { getSetting, registerSettings } from "./settings.js";
import {SettingsCompiler} from "./SettingsCompiler.js";

export const MODULE_ID = "world-setting-sync";

Hooks.on("init", () => {
    initConfig();
    registerSettings();
});

Hooks.on("ready", () => {
    if(!game.user.isGM) return;
    window.SettingsCompiler = SettingsCompiler;

    const masterAgnostic = getSetting("masterAgnostic");
    const masterSystem = getSetting("masterSystem");
    const autoCheckSync = getSetting("autoCheckSync");
    const autoPerformSync = getSetting("autoPerformSync");
    if ((masterAgnostic || masterSystem) && autoPerformSync) new SettingsCompiler().saveToFile();

    if((!masterAgnostic || !masterSystem) && autoCheckSync) new SettingsSync();

});