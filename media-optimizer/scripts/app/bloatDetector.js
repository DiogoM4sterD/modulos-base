import {MODULE_ID} from "../main.js";
import {HandlebarsApplication} from "../lib/utils.js";

export class BloatDetector extends HandlebarsApplication {
    constructor(collection, sizeThreshold = 0.5) {
        super();
        if (typeof collection === "string") {
            this.uuid = collection;
            collection = fromUuidSync(collection);
            this.document = collection;
        }
        if (collection?.collections) collection = Object.values(collection.collections);
        this.sizeThreshold = sizeThreshold;
        this.collection = collection ?? game.collections;
    }

    static fromUuid(uuid) {
        return new this(uuid, -Infinity).render(true);
    }

    get id() {
        if (this.uuid) return this.APP_ID + "-" + this.uuid;
        return this.APP_ID;
    }

    async _prepareContext() {
        const collectionData = [];

        let rawJson = "";

        const collections = this.collection;
        //loop key values of the Map
        collections.forEach((c) => {
            const entries = [];
            const collectionName = c.name;
            let collectionSize = 0;
            for (const document of Array.from(c)) {
                rawJson = JSON.stringify(document.toObject());
                const rawSizeMB = rawJson.length / 1000000;
                collectionSize += rawSizeMB;
                if (rawSizeMB < this.sizeThreshold) continue;
                entries.push({
                    name: document.name || document.key || document.id,
                    size: rawSizeMB,
                    type: document.documentName,
                    id: document.id,
                    uuid: Object.values(document.collections ?? {}).length ? document.uuid : undefined,
                });
            }
            const hasEntries = entries.length > 0;
            const isLarge = collectionSize > 10;
            if (!hasEntries && !isLarge) return;
            if (isLarge) {
                entries.push({
                    name: game.i18n.localize(`${MODULE_ID}.bloat-detector.large-collection`),
                    size: collectionSize,
                });
            }
            collectionData.push({ name: collectionName, collectionSize: collectionSize.toFixed(2), entries: entries.sort((a, b) => b.size - a.size) });
            entries.forEach((e) => (e.size = e.size.toFixed(2)));
        });
        //process flags
        if (this.document?.flags) {
            const entries = [];
            const collectionName = "Flags";
            for (const [key, value] of Object.entries(this.document.flags).concat(Object.entries(this.document?.prototypeToken?.flags ?? {}))) {
                rawJson = JSON.stringify(value);
                const rawSizeMB = rawJson.length / 1000000;
                if (rawSizeMB < this.sizeThreshold) continue;
                entries.push({
                    name: key,
                    size: rawSizeMB,
                    type: "Flag",
                });
            }
            const hasEntries = entries.length > 0;
            if (hasEntries) collectionData.push({ name: collectionName, entries: entries.sort((a, b) => b.size - a.size) });
            entries.forEach((e) => (e.size = e.size.toFixed(2)));
        }

        return {
            collections: collectionData,
            hasBloat: collectionData.length > 0,
            totalSize: collectionData.reduce((acc, c) => acc + c.entries.length, 0),
            displayMessage: isFinite(this.sizeThreshold),
        };
    }

    _onRender() {
        const html = this.element;
        html.querySelectorAll(`.fa-magnifying-glass-chart`).forEach((checkbox) => {
            checkbox.addEventListener("click", (e) => {
                e.preventDefault();
                const uuid = e.currentTarget.dataset.uuid;
                BloatDetector.fromUuid(uuid);
            });
        });
    }
}
