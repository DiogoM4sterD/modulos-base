import { MODULE_ID } from "./main.js";
import { TileCombiner } from "./app/TileCombiner.js";
import { FileConverter } from "./app/Converter.js";

export function initConfig() {

    Hooks.on("getSceneControlButtons", (buttons) => {
        buttons.tiles.tools.tileCombiner = {
                name: "tileCombiner",
                title: game.i18n.localize(`${MODULE_ID}.tile-combiner.title`),
                icon: "fas fa-compress",
                button: true,
                visible: game.user.isGM,
                onChange: () => {
                    new TileCombiner().render(true);
                },
            }
    });

    Hooks.on("getHeaderControlsFilePicker", (app, buttons) => {
        buttons.unshift({
            class: "file-converter",
            icon: "fas fa-compress",
            visible: game.user.isGM,
            label: game.i18n.localize(`${MODULE_ID}.file-converter.header-button`),
            onClick: () => {
                new FileConverter(app.result.files, app.result.target).render(true);
            },
        });
    });
}
