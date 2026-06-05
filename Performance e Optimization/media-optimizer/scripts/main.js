import {initConfig} from "./config.js";
import {showWelcome} from "./lib/welcome.js";
import {registerSettings} from "./settings.js";
import { mergeTiles, upload } from "./optimizer.js";
import { BloatDetector } from "./app/bloatDetector.js";
import { TileCombiner } from "./app/TileCombiner.js";

export const MODULE_ID = "media-optimizer";

Hooks.on("init", () => {
    registerSettings();
});

initConfig();

Hooks.on("ready", () => {
    showWelcome();

    window.MediaOptimizer = {
        BloatDetector,
        TileCombiner,
        API: {
            mergeTiles,
        }
    };

    libWrapper.register(MODULE_ID, "foundry.applications.apps.FilePicker.implementation.upload", upload, "WRAPPER");
});