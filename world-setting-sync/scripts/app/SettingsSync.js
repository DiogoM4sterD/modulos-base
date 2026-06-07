//import { MODULE_ID } from "../main.js";
import { HandlebarsApplication, l } from "../lib/utils.js";
import { getSetting } from "../settings.js";
import { SettingsCompiler } from "../SettingsCompiler.js";

const MODULE_ID = "world-setting-sync";

const EXCLUDED_SETTINGS = [
    "core.time"
];

export class SettingsSync extends HandlebarsApplication {
    constructor() {
        super();
        this.exclusionList = getSetting("exclusionList");
        this.#initializeData();
    }

    #agnostic;

    #system;

    #users;

    #modules;

    #excludedSettings;

    #diff = {
        users: {},
        modules: {},
        settings: {
            agnostic: {},
            system: {},
        },
    };

    static DEFAULT_OPTIONS = {
        classes: [this.APP_ID],
        tag: "form",
        window: {
            frame: true,
            positioned: true,
            title: `${MODULE_ID}.${this.APP_ID}.title`,
            icon: "",
            controls: [],
            minimizable: true,
            resizable: false,
            contentTag: "section",
            contentClasses: ["standard-form"],
        },
        actions: {},
        form: {
            handler: undefined,
            submitOnChange: false,
            closeOnSubmit: false,
        },
        position: {
            width: "auto",
            height: "auto",
        },
        actions: {
            syncAll: this.#syncAll,
            syncAgnostic: this.#syncAgnostic,
            syncSystem: this.#syncSystem,
            syncModules: this.#syncModules,
            syncUsers: this.#syncUsers,
            saveConfigurations: this.#saveConfigurations,
        },
    };

    static PARTS = {
        tabs: {
            template: "templates/generic/tab-navigation.hbs",
        },
        content: {
            template: `modules/${MODULE_ID}/templates/${this.APP_ID}.hbs`,
        },
        footer: {
            template: "templates/generic/form-footer.hbs",
        },
    };

    static get APP_ID() {
        return this.name
            .split(/(?=[A-Z])/)
            .join("-")
            .toLowerCase();
    }

    get APP_ID() {
        return this.constructor.APP_ID;
    }

    #getExcludedSettings() {
        // Combine hardcoded and user-defined exclusions @TODO
        const userExclusions = []; // Not implemented yet
        return EXCLUDED_SETTINGS.concat(userExclusions);
    }

    async #initializeData() {
        this.#agnostic = await this.#getJson("agnostic");
        this.#system = await this.#getJson(game.system.id);
        const agnosticUsers = this.#agnostic?.users ?? [];
        const systemUsers = this.#system?.users ?? [];
        const merged = [];
        for (const user of game.users) {
            const name = user.name;
            const agnosticMatch = agnosticUsers.find((u) => u.name === name);
            const systemMatch = systemUsers.find((u) => u.name === name);
            if (agnosticMatch && systemMatch) merged.push(foundry.utils.mergeObject(agnosticMatch, systemMatch));
            else if (agnosticMatch) merged.push(agnosticMatch);
            else if (systemMatch) merged.push(systemMatch);
        }
        this.#users = merged;

        const activeModules = new Set((this.#agnostic?.modules ?? []).concat(this.#system?.modules ?? []));
        this.#modules = Array.from(activeModules);
        this.#excludedSettings = this.#getExcludedSettings();

        this.#setupDiff();
    }

    #setupDiff() {
        const users = this.#users;
        const syncUsers = getSetting("syncUsers");
        const syncModules = getSetting("syncModules");
        const syncSettings = getSetting("syncSettings");

        if (syncUsers) {
            for (const user of game.users) {
                const matching = users.find((u) => u.name === user.name);
                if (!matching) continue;
                const currentUser = user.toObject();
                const matchingUser = matching;
                const diff = foundry.utils.diffObject(currentUser, matchingUser);
                if (Object.keys(diff).length === 0) continue;
                this.#diff.users[user.id] = diff;
            }
        }

        const modules = this.#modules;
        if (modules.length && syncModules) {
            for (const module of game.modules) {
                if (module.id === MODULE_ID || this.exclusionList[module.id]) continue;
                const active = module.active;
                if (modules.includes(module.id) && !active) this.#diff.modules[module.id] = true;
                else if (!modules.includes(module.id) && active) this.#diff.modules[module.id] = false;
            }
        }

        if (syncSettings) {
            for (const [namespace, settings] of Object.entries(this.#agnostic?.settings ?? {})) {
                if (this.exclusionList["core"] && namespace === "core") continue;
                if (namespace !== "core" && !game.modules.get(namespace)?.active) continue;
                if (this.exclusionList[namespace]) continue;
                for (const [key, value] of Object.entries(settings)) {
                    if (this.#excludedSettings.includes(namespace + "." + key)) continue;
                    const current = this._getSettingWithError(namespace, key);
                    if(current === "ERROR") continue;
                    if (JSON.stringify(current) === JSON.stringify(value)) continue;
                    this.#diff.settings.agnostic[namespace] = this.#diff.settings.agnostic[namespace] ?? {};
                    this.#diff.settings.agnostic[namespace][key] = value;
                }
            }

            for (const [namespace, settings] of Object.entries(this.#system?.settings ?? {})) {
                if (this.exclusionList[game.system.id] && namespace === game.system.id) continue;
                if (namespace !== game.system.id && namespace !== "core" && !game.modules.get(namespace)?.active) continue;
                if (this.exclusionList[namespace]) continue;
                for (const [key, value] of Object.entries(settings)) {
                    if (this.#excludedSettings.includes(namespace + "." + key)) continue;
                    const current = this._getSettingWithError(namespace, key);
                    if(current === "ERROR") continue;
                    if (JSON.stringify(current) === JSON.stringify(value)) continue;
                    this.#diff.settings.system[namespace] = this.#diff.settings.system[namespace] ?? {};
                    this.#diff.settings.system[namespace][key] = value;
                }
            }
        }

        const isDiff = Object.keys(this.#diff.users).length > 0 || Object.keys(this.#diff.modules).length > 0 || Object.keys(this.#diff.settings.agnostic).length > 0 || Object.keys(this.#diff.settings.system).length > 0;
        if (isDiff) this.render(true);
    }

    async #getJson(name) {
        try {
            const json = await foundry.utils.fetchJsonWithTimeout("modules/world-setting-sync/storage/" + name + ".json");
            return json;
        } catch (error) {
            return {};
        }
    }

    _getSettingWithError(namespace, key) {
        try {
            return game.settings.get(namespace, key);
        } catch (error) {
            return "ERROR";
        }
    }

    async _prepareContext(options) {
        const COLLAPSE_THRESHOLD = 100;
        const diff = this.#diff;
        const modules = [];
        for (const [id, active] of Object.entries(diff.modules)) {
            modules.push({
                label: game.modules.get(id)?.title,
                change: active ? l(`${MODULE_ID}.${this.APP_ID}.activate`) : l(`${MODULE_ID}.${this.APP_ID}.deactivate`),
                color: active ? "--color-level-success" : "--color-level-error",
                id,
            });
        }

        const users = [];
        for (const [id, diff] of Object.entries(diff.users)) {
            const stringified = JSON.stringify(diff);
            users.push({
                label: game.users.get(id)?.name,
                change: stringified,
                useDetails: true,
                id,
            });
        }

        const settingsAgnostic = [];
        for (const [namespace, diff] of Object.entries(diff.settings.agnostic)) {
            for (const [key, value] of Object.entries(diff)) {
                const stringified = JSON.stringify(value);
                settingsAgnostic.push({
                    label: namespace === "core" ? "Core" : game.modules.get(namespace)?.title ?? namespace,
                    change: stringified,
                    useDetails: (Array.isArray(value) || typeof value === "object") && stringified.length > COLLAPSE_THRESHOLD,
                    namespace,
                    key,
                    name: game.settings.settings.get(namespace + "." + key)?.name || key,
                });
            }
        }

        const settingsSystem = [];
        for (const [namespace, diff] of Object.entries(diff.settings.system)) {
            for (const [key, value] of Object.entries(diff)) {
                const systemLabel = namespace === game.system.id ? game.system.title : namespace;
                const stringified = JSON.stringify(value);
                settingsSystem.push({
                    label: namespace === "core" ? "Core" : game.modules.get(namespace)?.title ?? systemLabel,
                    change: stringified,
                    useDetails: (Array.isArray(value) || typeof value === "object") && stringified.length > COLLAPSE_THRESHOLD,
                    namespace,
                    key,
                    name: game.settings.settings.get(namespace + "." + key)?.name || key,
                });
            }
        }

        return {
            modules: modules.sort((a, b) => a.label.localeCompare(b.label)),
            users: users.sort((a, b) => a.label.localeCompare(b.label)),
            settingsAgnostic: settingsAgnostic.sort((a, b) => a.label.localeCompare(b.label)),
            settingsSystem: settingsSystem.sort((a, b) => a.label.localeCompare(b.label)),
            tabs: this.#getTabs(),
            buttons: this.#getButtons(),
        };
    }

    #getButtons() {
        const buttons = [];

        if (Object.keys(this.#diff.modules).length > 0) {
            buttons.push({
                type: "button",
                action: "syncModules",
                icon: "fas fa-sync",
                label: `${MODULE_ID}.${this.APP_ID}.actions.syncModules`,
            });
        }

        if (Object.keys(this.#diff.users).length > 0) {
            buttons.push({
                type: "button",
                action: "syncUsers",
                icon: "fas fa-sync",
                label: `${MODULE_ID}.${this.APP_ID}.actions.syncUsers`,
            });
        }

        if (Object.keys(this.#diff.settings.agnostic).length > 0) {
            buttons.push({
                type: "button",
                action: "syncAgnostic",
                icon: "fas fa-sync",
                label: `${MODULE_ID}.${this.APP_ID}.actions.syncAgnostic`,
            });
        }

        if (Object.keys(this.#diff.settings.system).length > 0) {
            buttons.push({
                type: "button",
                action: "syncSystem",
                icon: "fas fa-sync",
                label: `${MODULE_ID}.${this.APP_ID}.actions.syncSystem`,
            });
        }

        if (buttons.length) {
            buttons.unshift({
                type: "button",
                action: "syncAll",
                icon: "fas fa-sync",
                label: `${MODULE_ID}.${this.APP_ID}.actions.syncAll`,
            });
        }

        const masterAgnostic = getSetting("masterAgnostic");
        const masterSystem = getSetting("masterSystem");
        if (masterAgnostic || masterSystem) {
            buttons.push({
                type: "button",
                action: "saveConfigurations",
                icon: "fas fa-save",
                label: `${MODULE_ID}.${this.APP_ID}.actions.saveConfigurations`,
            });
        }

        return buttons;
    }

    #getTabs() {
        const tabs = [];

        if (Object.keys(this.#diff.modules).length > 0) {
            tabs.push({
                id: "modules",
                group: "main",
                icon: "fas fa-cubes",
                label: `${MODULE_ID}.${this.APP_ID}.tabs.modules`,
                active: false,
            });
        }

        if (Object.keys(this.#diff.users).length > 0) {
            tabs.push({
                id: "users",
                group: "main",
                icon: "fas fa-users",
                label: `${MODULE_ID}.${this.APP_ID}.tabs.users`,
                active: false,
            });
        }

        if (Object.keys(this.#diff.settings.agnostic).length > 0) {
            tabs.push({
                id: "settingsAgnostic",
                group: "main",
                icon: "fas fa-cogs",
                label: `${MODULE_ID}.${this.APP_ID}.tabs.settingsAgnostic`,
                active: false,
            });
        }

        if (Object.keys(this.#diff.settings.system).length > 0) {
            tabs.push({
                id: "settingsSystem",
                group: "main",
                icon: "fas fa-cogs",
                label: `${MODULE_ID}.${this.APP_ID}.tabs.settingsSystem`,
                active: false,
            });
        }

        if (tabs[0]) tabs[0].active = true;

        return tabs;
    }

    compileChanges() {
        const html = this.element;
        const changes = {
            settings: {},
        };

        // Modules

        const modulesTab = html.querySelector('.tab[data-tab="modules"]');
        const modules = {};
        modulesTab.querySelectorAll("[data-module]").forEach((module) => {
            const applyChange = module.querySelector('[name="apply"]');
            if (!applyChange.checked) return;
            const id = module.dataset.module;
            modules[id] = this.#diff.modules[id];
        });

        changes.modules = modules;

        // Users

        const usersTab = html.querySelector('.tab[data-tab="users"]');
        const users = {};
        usersTab.querySelectorAll("[data-user]").forEach((user) => {
            const applyChange = user.querySelector('[name="apply"]');
            if (!applyChange.checked) return;
            const id = user.dataset.user;
            users[id] = this.#diff.users[id];
        });

        changes.users = users;

        // Settings Agnostic

        const settingsAgnosticTab = html.querySelector('.tab[data-tab="settingsAgnostic"]');
        const settingsAgnostic = {};
        settingsAgnosticTab.querySelectorAll("[data-namespace]").forEach((setting) => {
            const applyChange = setting.querySelector('[name="apply"]');
            if (!applyChange.checked) return;
            const namespace = setting.dataset.namespace;
            const key = setting.dataset.key;
            settingsAgnostic[namespace] = settingsAgnostic[namespace] ?? {};
            settingsAgnostic[namespace][key] = this.#diff.settings.agnostic[namespace][key];
        });

        changes.settings.agnostic = settingsAgnostic;

        // Settings System

        const settingsSystemTab = html.querySelector('.tab[data-tab="settingsSystem"]');
        const settingsSystem = {};
        settingsSystemTab.querySelectorAll("[data-namespace]").forEach((setting) => {
            const applyChange = setting.querySelector('[name="apply"]');
            if (!applyChange.checked) return;
            const namespace = setting.dataset.namespace;
            const key = setting.dataset.key;
            settingsSystem[namespace] = settingsSystem[namespace] ?? {};
            settingsSystem[namespace][key] = this.#diff.settings.system[namespace][key];
        });

        changes.settings.system = settingsSystem;

        return changes;
    }

    async applyChanges(type) {
        // Confirm action

        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: {
                title: `${MODULE_ID}.${this.APP_ID}.confirm.sync${type.charAt(0).toUpperCase() + type.slice(1)}`,
            },
            content: l(`${MODULE_ID}.${this.APP_ID}.confirm.content`),
        });

        if (!confirmed) return;

        const changes = this.compileChanges();

        const promises = [];

        if (type === "modules" || type === "all") {
            const current = game.settings.get("core", "moduleConfiguration");
            for (const [id, active] of Object.entries(changes.modules)) {
                current[id] = active;
            }
            promises.push(game.settings.set("core", "moduleConfiguration", current));
        }

        if (type === "users" || type === "all") {
            for (const [id, diff] of Object.entries(changes.users)) {
                promises.push(game.users.get(id).update(diff));
            }
        }

        if (type === "agnostic" || type === "all") {
            for (const [namespace, diff] of Object.entries(changes.settings.agnostic)) {
                for (const [key, value] of Object.entries(diff)) {
                    promises.push(game.settings.set(namespace, key, value));
                }
            }
        }

        if (type === "system" || type === "all") {
            for (const [namespace, diff] of Object.entries(changes.settings.system)) {
                for (const [key, value] of Object.entries(diff)) {
                    promises.push(game.settings.set(namespace, key, value));
                }
            }
        }

        this.close(true);

        await Promise.all(promises);

        foundry.applications.settings.SettingsConfig.reloadConfirm();
    }

    _onRender(context, options) {
        super._onRender(context, options);
        const firstTabId = this.element.querySelector('[data-action="tab"]')?.dataset.tab;
        const firstTab = this.element.querySelector(`.tab[data-tab="${firstTabId}"]`);
        if (firstTab) firstTab.classList.add("active");
    }

    static async #syncAll() {
        this.applyChanges("all");
    }

    static async #syncAgnostic() {
        this.applyChanges("agnostic");
    }

    static async #syncSystem() {
        this.applyChanges("system");
    }

    static async #syncModules() {
        this.applyChanges("modules");
    }

    static async #syncUsers() {
        this.applyChanges("users");
    }

    static async #saveConfigurations() {
        new SettingsCompiler(true).saveToFile();
        this.close(true);
    }
}
