import { getSetting } from "./settings";

export function   injectSidebarPicker(app, html) {
  const element = app.element;
    if(!getSetting("sidebarFilepicker")) return;
  if (element.querySelector("#filepicker-plus-sidebar-button")) return;

  const sidebarButton = document.createElement("li");
  sidebarButton.id = "filepicker-plus-sidebar-button";
  sidebarButton.innerHTML = `
        <button type="button" class="ui-control plain icon fa-solid fa-folder" data-action="tab" data-tab="filepicker" role="tab" aria-pressed="false" data-group="primary" aria-label="File Browser" data-tooltip=""></button>
        <div class="notification-pip"></div>
    `;

  sidebarButton.querySelector("button").addEventListener("click", (event) => {
    canvas.tiles.activate();
    renderAndInject(undefined, true);
  });

  // Inject button into the sidebar
  const settingsButton = element
    .querySelector("#sidebar nav menu li [data-tab='settings']")
    .closest("li");
  settingsButton.before(sidebarButton);

  const filePickerTab = document.createElement("section");
  filePickerTab.id = "filepicker-tab";
  filePickerTab.classList.add(
    "tab",
    "sidebar-tab",
    "directory",
    "flexcol",
    "filepicker-sidebar"
  );
  filePickerTab.setAttribute("data-tab", "filepicker");
  filePickerTab.setAttribute("data-group", "primary");

  const header = document.createElement("header");
  header.classList.add("directory-header", "flexcol");
  header.innerHTML = `<p class="hint" id="no-filepicker">${game.i18n.localize(
    "filepicker-plus.sidebar.no-filepicker"
  )}</p>`;
    filePickerTab.appendChild(header);

  element.querySelector("#sidebar-content").appendChild(filePickerTab);

  Hooks.on("closeFilePicker", (fp) => {
    renderAndInject(fp);
  });
}

//Wrap render function
const originalRender = foundry.applications.apps.FilePicker.prototype.render;
foundry.applications.apps.FilePicker.prototype.render = async function (
  ...args
) {
  const res = await originalRender.apply(this, args);
  const options = args[0] || {};
  const isSidebarActive = document.querySelector(`.ui-control.active[data-tab="filepicker"]`);
  if(this.isSidebar) options.sidebar = true;
  this.isSidebar = options.sidebar;
  if (options.sidebar) {
    const filePickerTab = document.getElementById("filepicker-tab");
    filePickerTab.appendChild(this.element);
  } else {
    document.body.appendChild(this.element);
  }
  return res;
};

function renderAndInject(fp, force = false) {
  const isSidebarActive = document.querySelector(`.ui-control.active[data-tab="filepicker"]`);
  if(!isSidebarActive && !force) return;
  (fp ?? new foundry.applications.apps.FilePicker.implementation({
    type: "any",
    displayMode: "tiles",
    tileSize: true,
  })).render({ force: true, sidebar: true });
}
