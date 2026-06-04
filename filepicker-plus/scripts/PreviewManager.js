export class PreviewManager {
    constructor() {
        this.audioHelper = {};
        this.threePreview = null;
        foundry.applications.apps.FilePicker.PreviewManager = this;
        Hooks.on("closeFilePicker", () => {
            this.clearAudioPreviews();
            this.removeTooltip();
        });
        Hooks.on("renderFilePicker", (app, element) => {
            this.bind(app, element);
        });
    }

    static extensions = {
        img: [".jpg", ".jpeg", ".png", ".svg", ".webp"],
        vid: [".mp4", ".webm", ".m4v"],
        aud: [".flac", ".m4a", ".mp3", ".ogg", ".opus", ".wav"],
        three: [".glb", ".gltf"],
    }

    bind(app, element) {
        if (element.classList.contains("filepicker-plus-bound")) return;
        element.addEventListener("mouseover", this.handleMouseEnter.bind(this));
        element.addEventListener("mouseout", this.handleMouseLeave.bind(this));
        element.addEventListener("contextmenu", this.handleContextMenu.bind(this));
        element.addEventListener("click", this.handleClick.bind(this));
        element.classList.add("filepicker-plus-bound");
    }

    async handleMouseEnter(event) {
        const target = event.target.closest(".file");
        if (!target) return;

        const filePicker = target.closest("#file-picker");
        const isSidebar = filePicker.closest("#sidebar") !== null;
        target.classList.add("filepicker-plus-hover");

        try {
            const imgPath = target.dataset.imagePreview || target.dataset.path;
            const extension = "." + imgPath.split(".").pop();
            const ext = PreviewManager.extensions;

            if (ext.aud.includes(extension) && game.settings.get("filepicker-plus", "audiopreview")) {
                this.playAudioPreview(imgPath, target);
            }

            if (ext.three.includes(extension) && game.settings.get("filepicker-plus", "threepreview") && game.modules.get("three-actor-portrait")?.active) {
                this.showThreePreview(imgPath, target, filePicker, isSidebar);
            }

            if ((ext.img.includes(extension) || ext.vid.includes(extension)) && game.settings.get("filepicker-plus", "imagepreview")) {
                this.showImageOrVideoPreview(imgPath, target, filePicker, isSidebar, ext.vid.includes(extension));
            }
        } catch (err) {
           this.clearAudioPreviews();
        }
    }

    handleMouseLeave(event) {
        const target = event.target.closest(".file");
        if (!target) return;

        target.classList.remove("filepicker-plus-hover");
        this.clearAudioPreviews();
        this.removeTooltip();
    }

    handleContextMenu(event) {
        const target = event.target.closest(".file");
        if (!target) return;

        const fileName = target.dataset.path;
        game.clipboard.copyPlainText(fileName);
        ui.notifications.info(`'${fileName}' copied to clipboard`);
        event.preventDefault();
    }

    handleClick(event) {
        const target = event.target.closest(".header-button");
        if (!target) return;

        this.clearAudioPreviews();
        this.removeTooltip();
    }

    playAudioPreview(imgPath, target) {
        this.clearAudioPreviews();
        setTimeout(async () => {
            if (!target.classList.contains("filepicker-plus-hover")) return;
            const id = foundry.utils.randomID(20);
            this.audioHelper[id] = foundry.audio.AudioHelper.play({
                src: imgPath,
                loop: true,
                volume: game.settings.get("filepicker-plus", "audiopreviewvol"),
            });
        }, game.settings.get("filepicker-plus", "audiopreviewdelay"));
    }

    showThreePreview(imgPath, target, filePicker, isSidebar) {
        const tooltip = document.createElement("div");
        tooltip.className = "filepicker-plus-tooltip isthree application";
        tooltip.style.width = `${window.innerWidth * 0.2}px`;
        tooltip.style.height = `${window.innerWidth * 0.2}px`;

        const threeContainer = document.createElement("div");
        threeContainer.className = "filepicker-plus-three";
        threeContainer.textContent = "Loading...";
        tooltip.appendChild(threeContainer);

        if (!isSidebar) {
            tooltip.style.left = `${-filePicker.offsetLeft + 10}px`;
            tooltip.style.top = `${-filePicker.offsetTop + 10}px`;
        }

        setTimeout(() => {
            if (!target.classList.contains("filepicker-plus-hover")) return;
            (isSidebar ? document.body : filePicker).appendChild(tooltip);

            if (this.threePreview) {
                this.threePreview.destroy(0);
                this.threePreview = null;
            }

            this.threePreview = new game.threeportrait.ThreePortraitPreview(null, threeContainer, {
                preventAutoDispose: true,
                gltf: imgPath,
            });
        }, 250);
    }

    showImageOrVideoPreview(imgPath, target, filePicker, isSidebar, isVideo) {
        const tooltip = document.createElement("div");
        tooltip.className = "filepicker-plus-tooltip application";

        const dimensionsSpan = document.createElement("span");
        dimensionsSpan.className = "filepicker-plus-dimensions";
        tooltip.appendChild(dimensionsSpan);

        const mediaElement = document.createElement(isVideo ? "video" : "img");
        mediaElement.className = "filepicker-plus-file-icon";
        mediaElement.src = imgPath;
        if (isVideo) {
            mediaElement.autoplay = true;
            mediaElement.loop = true;
        }
        tooltip.appendChild(mediaElement);

        mediaElement.onload = mediaElement.onloadedmetadata = () => {
            const dimensions = {
                width: mediaElement.naturalWidth || mediaElement.videoWidth,
                height: mediaElement.naturalHeight || mediaElement.videoHeight,
            };
            dimensionsSpan.textContent = `${dimensions.width}x${dimensions.height}`;
        };

        document.body.appendChild(tooltip);
    }

    clearAudioPreviews() {
        for (const [key, audio] of Object.entries(this.audioHelper)) {
            this.stopAudio(audio);
            delete this.audioHelper[key];
        }
    }

    stopAudio(audioPromise){
        if(!audioPromise) return;
        if (audioPromise && audioPromise.then) {
            audioPromise.then((audio) => {
                audio.stop();
            });
        } else if (audioPromise) {
            audioPromise.stop();
        }
    }

    removeTooltip() {
        const tooltip = document.querySelector(".filepicker-plus-tooltip");
        if (tooltip) {
            tooltip.remove();
        }

        if (this.threePreview) {
            this.threePreview.destroy(0);
            this.threePreview = null;
        }
    }
}