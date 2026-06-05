import { MODULE_ID } from "./main.js";

let ffmpeg;
let currentNotification;

let resizeCanvas, resizeContext;

const PROGRESS_COLOR = "#7bb95c";

const renderTexture = PIXI.RenderTexture.create({
  width: 1,
  height: 1,
});

export function inferCurrentDirectory(target) {
  const fp = new foundry.applications.apps.FilePicker({current: target});
  return [fp.activeSource, fp.target];
}

export async function upload(wrapped, ...args) {
  if (CONFIG.SUPPRESS_MEDIA_OPTIMIZER) return wrapped(...args);
  const excludeFolders = game.settings
    .get("media-optimizer", "excludeFolders")
    .split(",")
    .map((f) => f.trim())
    .filter((f) => !!f);
  if (excludeFolders.some((f) => args[1].includes(f))) return wrapped(...args);
  const oldFile = args[2];
  args[2] = await convertMedia(args[2]);
  if (args[2] === oldFile) args[2] = renameFile(args[2]);
  return wrapped(...args);
}

export async function convertURL(url, path) {
  path = path || url.split("/").slice(0, -1).join("/");
  const file = await getFileFromUrl(url);
  const convertedFile = await convertMedia(file);
  const [newSource, newFolder] = inferCurrentDirectory(path);
  return await foundry.applications.apps.FilePicker.upload(
    newSource,
    newFolder,
    convertedFile
  );
}

const dontOptimize = ["image/webp", "audio/ogg", "video/webm"];

async function convertMedia(file) {
  try {
    if (dontOptimize.includes(file.type)) return file;
    if (!game.settings.get("media-optimizer", "enabled")) return file;
    if (
      file.type.startsWith("video/") &&
      game.settings.get("media-optimizer", "optimizeVideo")
    )
      return convertVideoToWebm(file);
    if (
      file.type.includes("gif") &&
      game.settings.get("media-optimizer", "optimizeVideo")
    )
      return convertVideoToWebm(file, true);
    if (
      file.type.startsWith("image/") &&
      game.settings.get("media-optimizer", "optimizeImages")
    )
      return convertImageToWebP(file);
    if (
      file.type.startsWith("audio/") &&
      game.settings.get("media-optimizer", "optimizeAudio")
    )
      return convertAudioToOgg(file);
    return file;
  } catch (error) {
    console.error(error);
    return file;
  }
}

async function convertImageToWebP(file) {
  const MAX_RESOLUTION = game.settings.get("media-optimizer", "maxResolution");
  const COMPRESSION_RATIO = game.settings.get(
    "media-optimizer",
    "compressionRatio"
  );
  const fileSizeMB = file.size / 1024 / 1024;

  const app = canvas.app;

  // Load the image
  const image = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

  // Create PIXI sprite
  let sprite = PIXI.Sprite.from(image);

  // Wait for the image to load and get the actual dimensions
  if (!sprite.texture.baseTexture.valid)
    await new Promise((resolve) => {
      sprite.texture.once("update", () => {
        resolve();
      });
    });
  // Check image resolution and resize if necessary
  const width = sprite.texture.width;
  const height = sprite.texture.height;

  const originalResolution = `${width}x${height}`;
  if (width > MAX_RESOLUTION || height > MAX_RESOLUTION) {
    initResizeCanvas();
    const ratio = Math.min(MAX_RESOLUTION / width, MAX_RESOLUTION / height);
    sprite.width = width * ratio;
    sprite.height = height * ratio;
    //use canvas api to resize the image
    const img = new Image();
    img.src = image;
    await new Promise((resolve) => {
      img.onload = () => {
        resolve();
      };
    });
    resizeCanvas.width = sprite.width;
    resizeCanvas.height = sprite.height;
    // Clear the canvas
    resizeContext.clearRect(0, 0, resizeCanvas.width, resizeCanvas.height);
    resizeContext.drawImage(img, 0, 0, sprite.width, sprite.height);
    sprite = new PIXI.Sprite(PIXI.Texture.from(resizeCanvas));
    //update the texture
    await sprite.texture.update();
    if (!sprite.texture.baseTexture.valid)
      await new Promise((resolve) => {
        sprite.texture.once("update", () => {
          resolve();
        });
      });
  }

  renderTexture.resize(sprite.width, sprite.height);

  // Render sprite to render texture
  await app.renderer.render(sprite, { renderTexture });

  // Convert render texture to base64-encoded webp
  const base64WebP = await app.renderer.extract.base64(
    renderTexture,
    "image/webp",
    COMPRESSION_RATIO
  );

  // Convert base64 to Blob
  const byteCharacters = atob(base64WebP.split(",")[1]);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  const webpBlob = new Blob(byteArrays, { type: "image/webp" });

  // Create new File object
  const fileNameNoExtension = file.name.split(".").slice(0, -1).join(".");
  const convertedFile = new File(
    [webpBlob],
    `${processName(fileNameNoExtension)}.webp`,
    { type: "image/webp" }
  );

  const newSizeMB = convertedFile.size / 1024 / 1024;
  const newResolution = `${sprite.width}x${sprite.height}`;
  ui.notifications.clear?.();
  ui.notifications.info(
    `${game.i18n.localize("media-optimizer.converted")} ${
      file.name
    } || ${fileSizeMB.toFixed(
      2
    )} MB (${originalResolution}) → ${newSizeMB.toFixed(
      2
    )} MB (${newResolution})`
  );

  return convertedFile;
}

async function convertAudioToOgg(file) {
  //linear-gradient(97deg, var(--color-level-info) 0%, rgb(0 0 0 / 63%) 0%)
  try {
    if (ffmpeg === undefined) await initFFMPEG();
    const notificationId = ui.notifications.info(
      `${game.i18n.localize("media-optimizer.audioConversionStarted")} ${
        file.name
      }`,
      { permanent: true }
    );
    currentNotification = document.querySelector(
      `.notification[data-id="${notificationId}"]`
    );
    const originalFileSizeMB = file.size / 1024 / 1024;

    ffmpeg.FS("writeFile", "input", await fetchFileData(file));

    // Run the conversion command
    await ffmpeg.run(
      "-i",
      "input",
      "-c:a",
      "libvorbis",
      "-vn",
      "-vsync",
      "vfr",
      "output.ogg"
    );

    // Get the converted audio file
    const oggData = ffmpeg.FS("readFile", "output.ogg");

    // Create a new File object
    const fileNameNoExtension = file.name.split(".").slice(0, -1).join(".");
    const convertedFile = new File(
      [oggData.buffer],
      `${processName(fileNameNoExtension)}.ogg`,
      { type: "audio/ogg" }
    );

    // Clean up resources
    ffmpeg.FS("unlink", "input");
    ffmpeg.FS("unlink", "output.ogg");

    const newFileSizeMB = convertedFile.size / 1024 / 1024;
    if (currentNotification) {
      currentNotification.click();
      ui.notifications.clear?.();
    }
    ui.notifications.info(
      `${game.i18n.localize("media-optimizer.converted")} ${
        file.name
      } || ${originalFileSizeMB.toFixed(2)} MB → ${newFileSizeMB.toFixed(2)} MB`
    );

    return convertedFile;
  } catch (e) {
    console.log(e);
    ui.notifications.error(
      `${game.i18n.localize("media-optimizer.conversionFailed")} ${file.name}`
    );
    return file;
  }
}

async function convertVideoToWebm(file, isGif = false) {
  try {
    if (ffmpeg === undefined) await initFFMPEG();
    const notificationId = ui.notifications.info(
      `${game.i18n.localize("media-optimizer.videoConversionStarted")} ${
        file.name
      }`,
      { permanent: true }
    );
    const originalFileSizeMB = file.size / 1024 / 1024;
    currentNotification = document.querySelector(
      `.notification[data-id="${notificationId}"]`
    );

    ffmpeg.FS("writeFile", "input", await fetchFileData(file));

    // Run the conversion command
    if (isGif) {
      await ffmpeg.run(
        "-i",
        "input",
        "-c:v",
        "libvpx",
        "-pix_fmt",
        "yuva420p",
        "-auto-alt-ref",
        "0",
        "output.webm"
      );
    } else {
      await ffmpeg.run(
        "-i",
        "input",
        "-c:v",
        "libvpx",
        "-c:a",
        "libvorbis",
        "output.webm"
      );
    }

    // Get the converted video file
    const webmData = ffmpeg.FS("readFile", "output.webm");

    // Create a new File object
    const fileNameNoExtension = file.name.split(".").slice(0, -1).join(".");
    const convertedFile = new File(
      [webmData.buffer],
      `${processName(fileNameNoExtension)}.webm`,
      { type: "video/webm" }
    );

    // Clean up resources
    ffmpeg.FS("unlink", "input");
    ffmpeg.FS("unlink", "output.webm");

    const newFileSizeMB = convertedFile.size / 1024 / 1024;
    if (currentNotification) {
      currentNotification.click();
      ui.notifications.clear?.();
    }
    ui.notifications.info(
      `${game.i18n.localize("media-optimizer.converted")} ${
        file.name
      } || ${originalFileSizeMB.toFixed(2)} MB → ${newFileSizeMB.toFixed(2)} MB`
    );

    return convertedFile;
  } catch (e) {
    console.log(e);
    ui.notifications.error(
      `${game.i18n.localize("media-optimizer.conversionFailed")} ${file.name}`
    );
    return file;
  }
}

function fetchFileData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(new Uint8Array(reader.result));
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function processName(name) {
  if (game.settings.get(MODULE_ID, "slugifyFileNames")) {
    name = decodeURIComponent(name);
    name = name.slugify({ strict: false });
  }
  return name;
}

function renameFile(file) {
  const newName = processName(file.name);
  if (newName === file.name) return file;
  return new File([file], newName, { type: file.type });
}

async function getFileFromUrl(url) {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then((response) => {
        const contentType = response.headers.get("content-type");
        const filename = decodeURIComponent(
          url.substring(url.lastIndexOf("/") + 1)
        );
        return response.blob().then((blob) => {
          const file = new File([blob], processName(filename), {
            type: contentType,
          });
          resolve(file);
        });
      })
      .catch((error) => {
        reject(error);
      });
  });
}

// Tile Merger

export async function mergeTiles(
  tiles,
  scene = canvas.scene,
  options = { background: false, fileName: "merged" }
) {
  const container = new PIXI.Container();
  const sprites = [];
  let combinedX, combinedY, combinedWidth, combinedHeight;
  let minX, minY, maxX, maxY;
  for (const tile of tiles) {
    if (!tile.mesh) continue;
    const bounds = {
      minX: tile.center.x - tile.bounds.width / 2,
      minY: tile.center.y - tile.bounds.height / 2,
      maxX: tile.center.x + tile.bounds.width / 2,
      maxY: tile.center.y + tile.bounds.height / 2,
    };
    if (minX === undefined || bounds.minX < minX) minX = bounds.minX;
    if (minY === undefined || bounds.minY < minY) minY = bounds.minY;
    if (maxX === undefined || bounds.maxX > maxX) maxX = bounds.maxX;
    if (maxY === undefined || bounds.maxY > maxY) maxY = bounds.maxY;

    sprites.push(await cloneTileMesh(tile));
  }
  combinedX = minX;
  combinedY = minY;
  combinedWidth = maxX - minX;
  combinedHeight = maxY - minY;

  container.width = combinedWidth;
  container.height = combinedHeight;

  sprites.forEach((sprite) => {
    container.addChild(sprite);
    if (!options.background)
      sprite.position.set(
        sprite.position.x - combinedX,
        sprite.position.y - combinedY
      );
  });

  const padding = { x: scene.dimensions.sceneX, y: scene.dimensions.sceneY };

  if (options.background) {
    container.children.forEach((sprite) => {
      sprite.position.set(
        sprite.position.x - padding.x,
        sprite.position.y - padding.y
      );
    });
    if (scene.background.src) {
      const backgroundSprite = PIXI.Sprite.from(scene.background.src);
      backgroundSprite.anchor.set(0, 0);
      backgroundSprite.position.set(
        scene.background.offsetX,
        scene.background.offsetY
      );
      backgroundSprite.scale.set(
        scene.background.scaleX,
        scene.background.scaleY
      );
      backgroundSprite.tile = {
        document: {
          sort: -1e10,
          elevation: canvas.primary.background.elevation,
        },
      };
      backgroundSprite.width = scene.dimensions.sceneWidth;
      backgroundSprite.height = scene.dimensions.sceneHeight;
      container.addChild(backgroundSprite);
    }
    combinedX = padding.x;
    combinedY = padding.y;
    combinedWidth = scene.dimensions.sceneWidth;
    combinedHeight = scene.dimensions.sceneHeight;
  }

  const elevationMap = new Map();

  //First split by elevation

  container.children.forEach((sprite) => {
    const current = elevationMap.get(sprite.tile.document.elevation) ?? [];
    current.push(sprite);
    elevationMap.set(sprite.tile.document.elevation, current);
  });

  //Sort same elevation sprites by sort

  for (const [elevation, sprites] of elevationMap) {
    sprites.sort((a, b) => {
      const aZ = a.tile.sort ?? a.tile.document.sort;
      const bZ = b.tile.sort ?? b.tile.document.sort;
      return aZ - bZ;
    });
  }

  //Then merge all sprites

  const sortedSprites = [];
  for (const [elevation, sprites] of elevationMap) {
    sortedSprites.push(...sprites);
  }

  //Sort container in the same order as sortedSprites

  container.children.sort((a, b) => {
    const aIndex = sortedSprites.indexOf(a);
    const bIndex = sortedSprites.indexOf(b);
    return aIndex - bIndex;
  });

  const app = new PIXI.Application();

  const MAX_RESOLUTION = game.settings.get("media-optimizer", "maxResolution");

  if (combinedWidth > MAX_RESOLUTION || combinedHeight > MAX_RESOLUTION) {
    const ratio = Math.min(
      MAX_RESOLUTION / combinedWidth,
      MAX_RESOLUTION / combinedHeight
    );
    combinedWidth *= ratio;
    combinedHeight *= ratio;
    container.children.forEach((sprite) => {
      sprite.position.set(sprite.position.x * ratio, sprite.position.y * ratio);
      sprite.scale.set(sprite.scale.x * ratio, sprite.scale.y * ratio);
    });
  }

  // Create PIXI render texture
  const renderTexture = PIXI.RenderTexture.create({
    width: combinedWidth,
    height: combinedHeight,
  });

  // Render sprite to render texture
  await app.renderer.render(container, { renderTexture });

  // Convert render texture to base64-encoded webp
  const base64WebP = await app.renderer.extract.base64(
    renderTexture,
    "image/png",
    1
  );

  // Convert base64 to Blob
  const byteCharacters = atob(base64WebP.split(",")[1]);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  const webpBlob = new Blob(byteArrays, { type: "image/png" });

  // Create new File object
  const convertedFile = new File(
    [webpBlob],
    `${processName(options.fileName)}.png`,
    { type: "image/png" }
  );

  return {
    file: convertedFile,
    width: combinedWidth,
    height: combinedHeight,
    x: combinedX + combinedWidth / 2,
    y: combinedY + combinedHeight / 2,
  };
}

async function cloneTileMesh(tile) {
  if (!tile.mesh) {
    const sprite = new PIXI.Sprite();
    sprite.tile = tile;
    return sprite;
  }
  const sprite = PIXI.Sprite.from(tile.mesh.texture);
  sprite.tint = tile.document.texture.tint ?? 0xffffff;
  sprite.alpha = tile.document.alpha;
  sprite.width = tile.document.width;
  sprite.height = tile.document.height;
  sprite.position.set(tile.center.x, tile.center.y);
  sprite.anchor.set(0.5, 0.5);
  sprite.angle = tile.document.rotation;
  sprite.scale.x = (tile.mesh.width / tile.mesh.texture.width) * Math.sign(tile.document.texture.scaleX);
  sprite.scale.y = (tile.mesh.height / tile.mesh.texture.height) * Math.sign(tile.document.texture.scaleY);
  sprite.tile = tile;
  sprite.filters = tile.mesh.filters;
  if (tile.mesh.children.length) sprite.addChild(...tile.mesh.children);
  return sprite;
}

async function initFFMPEG() {
  if (!window.SharedArrayBuffer) {
    throw new Error(
      "Media Optimizer | SharedArrayBuffer is not supported in this browser. Please use a different browser."
    );
  }
  const dynamicImport = new Function("url", "return import(url)");
  await dynamicImport(
    "https://unpkg.com/@ffmpeg/ffmpeg@0.10.0/dist/ffmpeg.min.js"
  );
  const createFFmpeg = window.FFmpeg.createFFmpeg;
  ffmpeg = createFFmpeg({ log: true });
  await ffmpeg.load();
  ffmpeg.setProgress(({ ratio }) => {
    const percent = ratio * 100;
    if (currentNotification) {
      currentNotification.style.borderColor = PROGRESS_COLOR;
      currentNotification.style.background = `linear-gradient(90deg, ${PROGRESS_COLOR} ${percent}%, rgb(0 0 0 / 63%) ${percent}%)`;
    }
  });
}

function initResizeCanvas() {
  if (resizeCanvas) {
    return;
  }
  resizeCanvas = document.createElement("canvas");
  resizeContext = resizeCanvas.getContext("2d");
}
