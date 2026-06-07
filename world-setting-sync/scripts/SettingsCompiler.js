import { MODULE_ID } from "./main.js";
import { getSetting } from "./settings.js";

const CORE_SETTINGS_SYSTEM = ["combatTrackerConfig"];

const CORE_SETTINGS_SKIP = ["moduleConfiguration", "combatTrackerConfig", "compendiumConfiguration", "worldTime"];

export class SettingsCompiler {
    constructor (forceNotification = false) {
        this.forceNotification = forceNotification;
        this.exclusionList = getSetting("exclusionList");
        this.#useActive = true;
        this.#initializeSettingsStorage();
    }

    #users;

    #agnostic;

    #system;

    #agnosticModules;

    #systemModules;

    #useActive;

    get worldSettings() {
        return Array.from(game.settings.settings)
            .map((s) => s[1])
            .filter((s) => s.scope === "world");
    }

    get agnosticJSON() {
        const json = {};
        json.users = this.#users;
        json.modules = this.#agnosticModules;
        json.settings = this.#agnostic;
        return json;
    }

    get systemJSON() {
        const json = {};
        json.users = this.#users;
        json.modules = this.#systemModules;
        json.settings = this.#system;
        return json;
    }

    saveAgnosticToFile() {
        const json = this.agnosticJSON;
        const file = new File([JSON.stringify(json)], "agnostic.json", {type: "text/plain"});
        return foundry.applications.apps.FilePicker.implementation.uploadPersistent(MODULE_ID, "", file, {}, { notify: !(getSetting("silentUpload") && !this.forceNotification) });
    }

    saveSystemToFile() {
        const json = this.systemJSON;
        const file = new File([JSON.stringify(json)], game.system.id + ".json", { type: "text/plain" });
        return foundry.applications.apps.FilePicker.implementation.uploadPersistent(MODULE_ID, "", file, {}, { notify: !(getSetting("silentUpload") && !this.forceNotification) });
    }

    saveToFile() {
        const masterAgnostic = getSetting("masterAgnostic");
        const masterSystem = getSetting("masterSystem");
        if (masterAgnostic) this.saveAgnosticToFile();
        if (masterSystem) this.saveSystemToFile();
    }

    #getModules(activeOnly = this.#useActive) {
        const agnostic = game.modules
            .filter((m) => m.relationships.systems?.size === 0)
            .filter((m) => !activeOnly || m.active)
            .filter((m) => m.id !== MODULE_ID)
            .filter((m) => !this.exclusionList[m.id]);
        const system = game.modules.filter((m) => m.relationships.systems?.find((s) => s.id === game.system.id)).filter((m) => !activeOnly || m.active);
        return {
            agnostic,
            system,
        };
    }

    #initializeSettingsStorage() {
        this.#compileActiveModules();
        this.#compileAgnosticSettings();
        this.#compileSystemSettings();
        this.#compileUsers();
    }

    #compileActiveModules() {
        const syncModules = getSetting("syncModules");
        if (!syncModules) {
            this.#agnosticModules = [];
            this.#systemModules = [];
            return;
        }
        const { agnostic, system } = this.#getModules(true);
        this.#agnosticModules = agnostic.map((m) => m.id);
        this.#systemModules = system.map((m) => m.id);
    }

    #compileAgnosticSettings() {
        const syncSettings = getSetting("syncSettings");
        if (!syncSettings) {
            this.#agnostic = {};
            return;
        }
        const {agnostic} = this.#getModules();
        const coreNamespace = this.exclusionList?.core ? [] : ["core"];
        const validNamespaces = agnostic.map((m) => m.id).concat(coreNamespace);
        const agnosticSettings = this.#getSettingsWithNamespace(validNamespaces);
        CORE_SETTINGS_SKIP.forEach((s) => {
            if (agnosticSettings?.core?.[s]) delete agnosticSettings.core[s];
        });
        this.#agnostic = agnosticSettings;
    }

    #compileSystemSettings() {
        const syncSettings = getSetting("syncSettings");
        if (!syncSettings) {
            this.#system = {};
            return;
        }
        const {system} = this.#getModules();
        const systemNamespace = this.exclusionList[game.system.id] ? [] : [game.system.id];
        const validNamespaces = system.map((m) => m.id).concat(systemNamespace);
        const systemSettings = this.#getSettingsWithNamespace(validNamespaces);
        systemSettings.core = {};
        CORE_SETTINGS_SYSTEM.forEach((s) => {
            systemSettings.core[s] = game.settings.get("core", s);
        });
        this.#system = systemSettings;
    }

    #getSettingsWithNamespace(namespaces) {
        const settings = this.worldSettings;
        const result = {};
        for (const setting of settings) {
            const namespace = setting.namespace;
            const key = setting.key;
            if (!namespaces.includes(namespace)) continue;
            if (!result[namespace]) result[namespace] = {};
            result[namespace][key] = game.settings.get(namespace, key);
        }
        return result;
    }

    #compileUsers() {
        const syncUsers = getSetting("syncUsers");
        if (!syncUsers) {
            this.#users = [];
            return;
        }
        const users = Array.from(game.users);
        this.#users = users.map((u) => u.toObject());
        this.#users.forEach((u) => {
            delete u._id;
            delete u._stats;
            delete u.character;
            delete u.hotbar;
        });
    }
}
