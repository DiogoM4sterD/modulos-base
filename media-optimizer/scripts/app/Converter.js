import { MODULE_ID } from "../main.js";
import {convertURL} from "../optimizer.js";
import {expandObject, HandlebarsApplication, mergeClone} from "../lib/utils.js";

export class FileConverter extends HandlebarsApplication {
    constructor(files, path) {
        super();
        this.files = files.filter((file) => {
            const lc = file.toLowerCase();
            if (lc.endsWith(".webp") || lc.endsWith(".ogg") || lc.endsWith(".webm")) return false;
            return true;
        });
        this.path = decodeURIComponent(path);
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
        const fileData = this.files.map((file) => {
            return {
                fullPath: file,
                fileName: decodeURIComponent(file.split("/").pop()),
            };
        });
        return {
            files: fileData,
        };
    }

    _onRender(context, options) {
        const html = this.element;
        html.querySelector(`#select-all`).addEventListener("click", (e) => {
            e.preventDefault();
            const checkboxes = html.querySelectorAll(`input[type="checkbox"]`);
            checkboxes.forEach((checkbox) => {
                checkbox.checked = true;
            });
            this.updateButton();
        });
        html.querySelector(`#select-none`).addEventListener("click", (e) => {
            e.preventDefault();
            const checkboxes = html.querySelectorAll(`input[type="checkbox"]`);
            checkboxes.forEach((checkbox) => {
                checkbox.checked = false;
            });
            this.updateButton();
        });
        html.querySelectorAll(`input[type="checkbox"]`).forEach((checkbox) => {
            checkbox.addEventListener("change", (e) => {
                this.updateButton();
            });
        });
        this.updateButton();
    }

    updateButton() {
        const checkboxes = this.element.querySelectorAll(`input[type="checkbox"]`);
        const checkedCount = Array.from(checkboxes).filter((checkbox) => checkbox.checked).length;
        const button = this.element.querySelector(`button[type="submit"]`);
        button.innerHTML = `<i class="far fa-compress"></i> ${game.i18n.localize("media-optimizer.file-converter.buttons.convert")} (${checkedCount})`;
    }

    static async #onSubmit(event, form, formData) {
        const filesToConvert = [];
        for (const [file, convert] of Object.entries(formData.object)) {
            if (!file.includes(".")) continue;
            if (convert) filesToConvert.push(file);
        }
        this.convert(filesToConvert);
        this.close();
    }

    async convert(filesToConvert) {
        for (const file of filesToConvert) {
            await convertURL(file, this.path);
        }
    }
}
