Hooks.once("init", async function () {
  game.settings.registerMenu("situational-shortcuts", "worldBonusConfig", {
    name: "Situational Bonuses (global)",
    label: "Configure Bonuses",
    icon: "fas fa-cogs",
    scope: "world",
    restricted: true,
    type: SituationalShortcutsConfig,
  });

  game.settings.registerMenu("situational-shortcuts", "userBonusConfig", {
    name: "Situational Bonuses (user)",
    label: "Configure Bonuses",
    icon: "fas fa-cogs",
    scope: "world",
    restricted: false,
    type: SituationalShortcutsConfigUser,
  });

  game.settings.register("situational-shortcuts", "worldBonusData", {
    name: "",
    hint: "",
    scope: "world",
    config: false,
    type: Object,
    default: {},
  });

  game.settings.register("situational-shortcuts", "bonusColors", {
    name: "Enable Color",
    hint: "Apply a color to bonuses depending on their starting operator",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register("situational-shortcuts", "replaceMode", {
    name: "Replace",
    hint: "When selecting a bonus, replace the whole value instead of appending to it",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

});
Hooks.once("ready", async function () {});


class SituationalShortcutsConfig extends foundry.applications.api.HandlebarsApplicationMixin(
    foundry.applications.api.ApplicationV2,
) {

  static get DEFAULT_OPTIONS() {
    return {
      tag: "form",
      id: "SituationalShortcutsConfig",
      window: {
        title: "Configure Bonuses",
        contentClasses: ["standard-form"],
      },
      position: {
        width: 400,
        height: 600,
      },
      actions: {
        add: this._add,
        remove: this._remove,
      },
      form: {
        handler: this._onSubmit,
        closeOnSubmit: true,
      },
    };
  }

  static get PARTS() {
    return {
      content: {
        template: `modules/situational-shortcuts/templates/config.hbs`,
        classes: ["standard-form", "scrollable"],
      },
      footer: {
        template: "templates/generic/form-footer.hbs",
      },
    };
  }

  async _prepareContext(options) {
    const buttons = [
      {
        label: "Save",
        type: "submit",
        action: "submit",
        icon: "fas fa-save",
      },
      {
        label: "Add",
        type: "button",
        action: "add",
        icon: "fas fa-plus",
      }
    ];
    return { buttons, setting: this._getSettingData() };
  }

  _getSettingData() {
    return game.settings.get("situational-shortcuts", "worldBonusData");
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const html = this.element;
  }

  static _add(e) {
    e.preventDefault();
    this.element.querySelector(".bonuses-config").insertAdjacentHTML("beforeend", `
      <li class="bonus-config">
        <div class="form-group">
          <label>Name: </label>
          <input type="text" class="name" value="">
          <label>Bonus: </label>
          <input type="text" class="value" value="">
          <button type="button" class="icon fas fa-trash" data-action="remove"></button>
        </div>
      </li>`);
  }

  static _remove(e) {
    e.preventDefault();
    e.target.closest(".bonus-config").remove();
  }

  static _onSubmit(event) {
    const data = {};
    this.element.querySelectorAll(".bonus-config").forEach((el) => {
      const name = el.querySelector(".name")?.value;
      const value = el.querySelector(".value")?.value;
      if (name && value) data[name] = value;
    });
    this.saveData(data);
  }

  async saveData(data) {
    game.settings.set("situational-shortcuts", "worldBonusData", data);
  }
}

class SituationalShortcutsConfigUser extends SituationalShortcutsConfig {
  _getSettingData() {
    return game.user.getFlag("situational-shortcuts", "userBonusData") ?? {};
  }

  async saveData(data) {
    await game.user.unsetFlag("situational-shortcuts", "userBonusData");
    await game.user.setFlag("situational-shortcuts", "userBonusData", data);
  }
}