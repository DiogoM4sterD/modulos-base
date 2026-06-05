import { initAddApplyButton } from "./applyButton.js";
import {initConfig} from "./config.js";
import {showWelcome} from "./lib/welcome.js";
import { PreviewManager } from "./PreviewManager.js";
import { registerSettings } from "./settings.js";
import { injectSidebarPicker } from "./SidebarPicker.js";
import "../scss/module.scss";

export const MODULE_ID = "filepicker-plus";

Hooks.on("init", () => {
    registerSettings();
    initAddApplyButton();
});

Hooks.on("ready", () => {
    showWelcome();
    initConfig();
    new PreviewManager();
});

Hooks.once("renderSidebar", (app, html) => {
    injectSidebarPicker(app, html);
});

Hooks.once("canvasReady", () => {

});