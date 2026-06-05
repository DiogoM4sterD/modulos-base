import { inferCurrentDirectory, mergeTiles } from "../optimizer.js";
import {MODULE_ID} from "../main.js";
import {expandObject, HandlebarsApplication, mergeClone} from "../lib/utils.js";

export class TileCombiner extends HandlebarsApplication {
    constructor({scene, fileName, tiles, deleteTiles} = {}) {
        super();
        this.scene = scene ?? canvas.scene;
        this.fileName = fileName ?? "combined-" + foundry.utils.randomID(20);
        this.tiles = tiles ?? [];
        if(this.tiles.length) this.tiles = this.tiles.map(t => t.object ?? t);
        this.macroOptions = {};
        if(deleteTiles !== undefined) this.macroOptions.deleteTiles = deleteTiles;
    }

    static get DEFAULT_OPTIONS() {
        return mergeClone(super.DEFAULT_OPTIONS, {
            tag: "form",
            form: {
                handler: this.#onSubmit,
                submitOnChange: false,
                closeOnSubmit: true,
            },
        });
    }

    _prepareContext() {
        const selectModeOptions = {
            background: game.i18n.localize(`${MODULE_ID}.tile-combiner.mode.background`),
            foreground: game.i18n.localize(`${MODULE_ID}.tile-combiner.mode.foreground`),
            selected: game.i18n.localize(`${MODULE_ID}.tile-combiner.mode.selected`),
            all: game.i18n.localize(`${MODULE_ID}.tile-combiner.mode.all`),
        }
        return {
            ...game.settings.get(MODULE_ID, "combinerSettings"),
            ...this.macroOptions,
            fileName: this.fileName,
            selectModeOptions,
            macroTiles: !!this.tiles.length
        };
    }

    _onRender(context, options) {
        const html = this.element;
        html.querySelector(`button[data-action="cancel"]`).addEventListener("click", (e) => {
            e.preventDefault();
            this.close();
        });
    }

    static async #onSubmit(event, form, formData) {
        const doBackup = event.submitter.dataset.action === "backup-combine";
        const combineData = expandObject(formData.object);
        combineData.fileName = combineData.fileName || this.fileName;
        if (doBackup) await this.scene.clone({ name: `${this.scene._source.name} (Copy)` }, { save: true });
        this.combine(combineData);
    }

    async uploadFile(file, path) {
        const [source, folder] = inferCurrentDirectory(path);
        return await foundry.applications.apps.FilePicker.upload(source, folder, file);
    }

    async confirmCombine(backup = false) {
        let backupText = "";
        if (!backup) {
            backupText = `<p class="notification error">${game.i18n.localize(`${MODULE_ID}.tile-combiner.confirm.backup`)}</p>`;
        }
        return new Promise((resolve, reject) => {
            Dialog.confirm({
                title: game.i18n.localize(`${MODULE_ID}.tile-combiner.confirm.title`),
                content: backupText + `<div>${game.i18n.localize(`${MODULE_ID}.tile-combiner.confirm.content`)}</div>`,
                yes: () => resolve(true),
                no: () => resolve(false),
                defaultYes: false,
            });
        });
    }

    async combine(combineData) {
        if (!(await this.confirmCombine(combineData.backup))) return;
        let tiles;
        const FGElevation = canvas.scene.firstLevel?.elevation.top;
        switch (combineData.mode) {
            case "all":
                tiles = canvas.tiles.placeables;
                break;
            case "selected":
                tiles = canvas.tiles.controlled;
                break;
            case "background":
                tiles = canvas.tiles.placeables.filter((t) => t.document.elevation !== FGElevation);
                break;
            case "foreground":
                tiles = canvas.tiles.placeables.filter((t) => t.document.elevation === FGElevation);
                break;
        }
        if(this.tiles.length) tiles = this.tiles;
        if (!tiles.length) return;
        const combined = await mergeTiles(tiles, this.scene, combineData);
        const uploaded = await this.uploadFile(combined.file, combineData.folderPath);
        const combinedUrl = uploaded.path;
        const newTileData = {
            texture: {
                src: combinedUrl,
            },
            width: combined.width,
            height: combined.height,
            x: combined.x,
            y: combined.y,
        };
        if (combineData.background) {
            await this.scene.update({ "background.src": combinedUrl });
        } else {
            await this.scene.createEmbeddedDocuments("Tile", [newTileData]);
        }
        if (combineData.deleteTiles) {
            await canvas.scene.deleteEmbeddedDocuments(
                "Tile",
                tiles.map((t) => t.id),
            );
        }
    }

    async close(...args) {
        if(this.tiles.length) return super.close(...args);
        const combineData = new foundry.applications.ux.FormDataExtended(this.element).object
        delete combineData.fileName;
        game.settings.set(MODULE_ID, "combinerSettings", combineData);
        super.close(...args);
    }
}
