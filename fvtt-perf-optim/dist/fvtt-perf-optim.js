//#region src/settings/constants.ts
var e = /* @__PURE__ */ function(e) {
	return e.OptimizeTokenUiBatching = "optimize-interface-layer-clipping", e.EffectsCaching = "token-effects-caching", e.TokenBarsCaching = "token-bars-caching", e.ControlIconCaching = "control-icon-caching", e.PrecomputedNoiseTextures = "precomputed-noise-textures", e.ReduceLightingResolution = "reduce-lighting-resolution", e.DisableAppV2BackgroundBlur = "disable-app-v2-background-blur", e.CustomRenderScale = "custom-render-scale", e.MeshGeometryFitting = "mesh-geometry-fitting", e.WallSpriteCaching = "wall-sprite-caching", e.TokenLayerCache = "token-layer-cache", e.EmberShaderOptimizations = "ember-shader-optimizations", e.DnD5eOptimizations = "dnd5e-optimizations", e;
}({}), t = {
	background: 100,
	illumination: 40,
	coloration: 100,
	darkness: 50
}, n = "fvtt-perf-optim", r = {
	loadTexture: (e) => foundry.canvas.loadTexture(e),
	getTexture: (e) => foundry.canvas.getTexture(e),
	createSpriteMesh: (e) => new foundry.canvas.containers.SpriteMesh(e),
	get game() {
		return foundry.game ?? game;
	},
	get generation() {
		return game.release.generation;
	},
	get hasCanvas() {
		return !game.settings.get("core", "noCanvas");
	},
	getShaderByName: (e) => foundry.canvas.rendering.shaders[e]
};
//#endregion
//#region src/hacks/reduceLightingResolution.ts
function i() {
	let e = canvas.app.renderer;
	return e.renderTexture.current?.resolution ?? e.resolution;
}
function a() {
	let r = C(e.CustomRenderScale);
	return Array.isArray(r) && (game.settings.set(n, e.CustomRenderScale, t), r = t), r;
}
function o(t, n) {
	if (t) {
		if (!C(e.ReduceLightingResolution)) {
			t.resolution = null;
			return;
		}
		Object.defineProperty(t, "resolution", {
			get() {
				let e = a()?.[n];
				return e === void 0 ? null : i() * (e / 100);
			},
			set(e) {},
			configurable: !0
		});
	}
}
function s(e, t) {
	return async function(n, ...r) {
		let i = await n(...r);
		return o(t(this), e), i;
	};
}
var c = [
	{
		path: "foundry.canvas.layers.CanvasIlluminationEffects.prototype._draw",
		fn: s("illumination", (e) => e.filter)
	},
	{
		path: "foundry.canvas.layers.CanvasColorationEffects.prototype._draw",
		fn: s("coloration", (e) => e.filter)
	},
	{
		path: "foundry.canvas.layers.CanvasDarknessEffects.prototype._draw",
		fn: s("darkness", (e) => e.filter)
	},
	{
		path: "foundry.canvas.layers.CanvasBackgroundAlterationEffects.prototype._draw",
		fn: s("background", (e) => e.lighting?.filter)
	}
], l = !1;
function u() {
	if (r.hasCanvas && !l) {
		for (let { path: e, fn: t } of c) libWrapper.register(n, e, t, "WRAPPER");
		l = !0;
	}
}
function d() {
	if (l) {
		for (let { path: e } of c) libWrapper.unregister(n, e);
		l = !1;
	}
}
async function f() {
	C(e.ReduceLightingResolution) && u();
}
function p() {
	r.hasCanvas && (canvas?.effects?.background?.draw(), canvas?.effects?.illumination?.draw(), canvas?.effects?.coloration?.draw(), canvas?.effects?.darkness?.draw());
}
//#endregion
//#region src/apps/CustomRenderScaleMenu.ts
var m = foundry.data.fields, h = class r extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
	static DEFAULT_OPTIONS = {
		id: "render-scale-config",
		tag: "form",
		window: {
			contentClasses: ["standard-form"],
			title: `${n}.settings.${e.CustomRenderScale}.menu.title`,
			icon: "fa-solid fa-percent"
		},
		position: { width: 600 },
		form: {
			closeOnSubmit: !0,
			handler: r.#r
		},
		actions: { reset: r.#i }
	};
	static PARTS = {
		body: {
			template: `modules/${n}/templates/render-resolution-menu.hbs`,
			scrollable: [""]
		},
		footer: { template: "templates/generic/form-footer.hbs" }
	};
	static #e = new m.SchemaField({
		background: new m.NumberField({
			required: !0,
			min: 25,
			max: 100,
			step: 5,
			initial: t.background
		}),
		illumination: new m.NumberField({
			required: !0,
			min: 25,
			max: 100,
			step: 5,
			initial: t.illumination
		}),
		coloration: new m.NumberField({
			required: !0,
			min: 25,
			max: 100,
			step: 5,
			initial: t.coloration
		}),
		darkness: new m.NumberField({
			required: !0,
			min: 25,
			max: 100,
			step: 5,
			initial: t.darkness
		})
	});
	static get schema() {
		return r.#e;
	}
	static #t = !1;
	async _preFirstRender(t, i) {
		await super._preFirstRender(t, i), r.#t ||= (foundry.helpers.Localization.localizeDataModel({ schema: r.#e }, { prefixes: [`${n}.settings.${e.CustomRenderScale}.menu`] }), !0);
	}
	#n = t;
	async _prepareContext(i) {
		return i.isFirstRender && (this.#n = C(e.CustomRenderScale) ?? t), {
			renderScale: C(e.CustomRenderScale) ?? t,
			fields: r.#e.fields,
			buttons: [{
				type: "button",
				label: `${n}.settings.${e.CustomRenderScale}.menu.cancel`,
				icon: "fa-solid fa-arrow-rotate-left",
				action: "reset"
			}, {
				type: "submit",
				label: `${n}.settings.${e.CustomRenderScale}.menu.confirm`,
				icon: "fa-solid fa-check",
				action: "confirm"
			}]
		};
	}
	static async #r(t, r, i) {
		let a = foundry.utils.expandObject(i.object);
		game.settings.set(n, e.CustomRenderScale, a);
	}
	static async #i() {
		game.settings.set(n, e.CustomRenderScale, r.#n), r.render();
	}
	_onClose(t) {
		super._onClose(t), t.submitted || (game.settings.set(n, e.CustomRenderScale, this.#n), p());
	}
	_onChangeForm(t, r) {
		if (!this.form) return;
		let i = new foundry.applications.ux.FormDataExtended(this.form), a = foundry.utils.expandObject(i.object);
		game.settings.set(n, e.CustomRenderScale, a);
	}
};
//#endregion
//#region src/hacks/disableAppBackgroundBlur.ts
function g() {
	let t = C(e.DisableAppV2BackgroundBlur);
	t && _(t);
}
function _(e) {
	e ? document.body.classList.add("disable-app-background-blur") : document.body.classList.remove("disable-app-background-blur");
}
//#endregion
//#region src/utils/getBitmapCacheResolution.ts
function v() {
	let e = canvas.performance.mode === CONST.CANVAS_PERFORMANCE_MODES.MAX ? 2 : 1.5;
	return canvas.scene.grid.size < 100 && canvas.scene.grid.size > 50 ? e *= 1.5 : canvas.scene.grid.size <= 50 && (e *= 2), canvas.app.renderer.resolution * e;
}
//#endregion
//#region src/hacks/effectsCaching.ts
function y(e) {
	e.cacheAsBitmap = !1, e.cacheAsBitmapResolution = v(), e.cacheAsBitmap = !0;
}
function b() {
	return !!game.modules.get("effect-hider")?.active;
}
async function x(...e) {
	let [t] = e;
	(t?.redrawEffects || t?.refreshEffects) && (b() ? this.effects.children.forEach((e) => {
		y(e);
	}) : y(this.effects));
}
function ee() {
	return !(game.settings.settings.has("pf2e-dorako-ux.moving.adjust-token-effects-hud") && game.settings.get("pf2e-dorako-ux", "moving.adjust-token-effects-hud") || game.modules.has("pf2e-effects-halo") && game.modules.get("pf2e-effects-halo")?.active);
}
var S = "CONFIG.Token.objectClass.prototype._applyRenderFlags", te, ne = !1, re = () => {
	C(e.EffectsCaching) && ie();
};
function ie() {
	ne || !ee() || !r.hasCanvas || (ne = !0, te = libWrapper.register(n, S, async function(e, ...t) {
		let n = e(...t);
		n instanceof Promise && await n, await x.call(this, ...t);
	}, "WRAPPER"));
}
function ae() {
	if (ne && (ne = !1, te !== void 0 && (libWrapper.unregister(n, te), te = void 0), r.hasCanvas)) for (let e of canvas?.tokens?.placeables ?? []) {
		let t = e.effects;
		if (t) {
			t.cacheAsBitmap = !1;
			for (let e of t.children) "cacheAsBitmap" in e && (e.cacheAsBitmap = !1);
		}
	}
}
//#endregion
//#region src/utils/convexHull.ts
var oe = 128, se = 256, ce = 512, le = .01;
function ue(e) {
	return e <= 1024 ? oe : e <= 4096 ? se : ce;
}
var de = /* @__PURE__ */ new Map();
function fe(e) {
	let t = de.get(e);
	return t || (t = new OffscreenCanvas(e, e).getContext("2d", { willReadFrequently: !0 }), de.set(e, t)), t;
}
var pe = new Uint8Array(ce * ce);
function me(e, t, n) {
	return (e[0] - n[0]) * (t[1] - n[1]) - (e[1] - n[1]) * (t[0] - n[0]);
}
function he(e) {
	e.sort((e, t) => e[0] === t[0] ? e[1] - t[1] : e[0] - t[0]);
	let t = e.length, n = Array(t), r = 0;
	for (let i = 0; i < t; i++) {
		for (; r >= 2 && me(n[r - 2], n[r - 1], e[i]) <= 0;) r--;
		n[r++] = e[i];
	}
	let i = Array(t), a = 0;
	for (let n = t - 1; n >= 0; n--) {
		for (; a >= 2 && me(i[a - 2], i[a - 1], e[n]) <= 0;) a--;
		i[a++] = e[n];
	}
	r--, a--;
	let o = new Float32Array((r + a) * 2);
	for (let e = 0; e < r; e++) o[e * 2] = n[e][0], o[e * 2 + 1] = n[e][1];
	for (let e = 0; e < a; e++) o[(r + e) * 2] = i[e][0], o[(r + e) * 2 + 1] = i[e][1];
	return o;
}
function ge(e, t) {
	let n = e.getImageData(0, 0, t, t).data, r = t * t;
	for (let e = 0; e < r; e++) pe[e] = n[e << 2 | 3];
	let i = [];
	for (let e = 0; e < t; e++) {
		let n = e * t;
		for (let r = 0; r < t; r++) pe[n + r] > 0 && i.push([(r + .5) / t, (e + .5) / t]);
	}
	return i;
}
var _e = 8, ve = 1e-12;
function ye(e, t) {
	let n = e.length >> 1, r = Math.max(t, 3);
	if (n <= r) return e;
	let i = new Float64Array(n), a = new Float64Array(n), o = new Int32Array(n), s = new Int32Array(n);
	for (let t = 0; t < n; t++) i[t] = e[t * 2], a[t] = e[t * 2 + 1], o[t] = (t - 1 + n) % n, s[t] = (t + 1) % n;
	function c(e) {
		let t = s[e], n = o[e], r = s[t], c = i[e] - i[n], l = a[e] - a[n], u = i[r] - i[t], d = a[r] - a[t], f = c * d - l * u;
		if (Math.abs(f) < ve) return Infinity;
		let p = ((i[t] - i[n]) * d - (a[t] - a[n]) * u) / f, m = i[n] + p * c, h = a[n] + p * l;
		return Math.abs((i[t] - i[e]) * (h - a[e]) - (m - i[e]) * (a[t] - a[e])) * .5;
	}
	let l = new Float64Array(n);
	for (let e = 0; e < n; e++) l[e] = c(e);
	let u = n, d = 0;
	for (; u > r;) {
		let e = Infinity, t = d, n = d;
		for (let r = 0; r < u; r++) l[n] < e && (e = l[n], t = n), n = s[n];
		if (e === Infinity) break;
		let r = t, f = s[r], p = o[r], m = s[f], h = i[r] - i[p], g = a[r] - a[p], _ = i[m] - i[f], v = a[m] - a[f], y = h * v - g * _;
		if (Math.abs(y) < ve) {
			l[r] = Infinity;
			continue;
		}
		let b = ((i[f] - i[p]) * v - (a[f] - a[p]) * _) / y;
		i[r] = i[p] + b * h, a[r] = a[p] + b * g, s[r] = m, o[m] = r, u--, d = r, l[o[r]] = c(o[r]), l[r] = c(r);
	}
	let f = new Float32Array(u * 2), p = d;
	for (let e = 0; e < u; e++) f[e * 2] = i[p], f[e * 2 + 1] = a[p], p = s[p];
	return f;
}
function be(e, t) {
	let n = e.length >> 1, r = 0, i = 0;
	for (let t = 0; t < n; t++) r += e[t * 2], i += e[t * 2 + 1];
	r /= n, i /= n;
	let a = new Float32Array(e.length);
	for (let o = 0; o < n; o++) {
		let n = e[o * 2], s = e[o * 2 + 1], c = n - r, l = s - i, u = Math.sqrt(c * c + l * l);
		a[o * 2] = u > 0 ? n + c / u * t : n, a[o * 2 + 1] = u > 0 ? s + l / u * t : s;
	}
	return a;
}
function xe(e) {
	let t = Se(e);
	return t.length === 0 ? t : ye(be(t, le), _e);
}
function Se(e, t = 0, n = 0, r = e.width, i = e.height) {
	let a = ue(Math.max(r, i)), o = fe(a);
	o.clearRect(0, 0, a, a), o.drawImage(e, t, n, r, i, 0, 0, a, a);
	let s = ge(o, a);
	return s.length === 0 ? new Float32Array() : he(s);
}
function Ce(e, t, n, r, i, a, o) {
	let s = (r - t) * a, c = (i - n) * o;
	return Se(e, t * a, n * o, s, c);
}
function we(e) {
	let t = [];
	for (let n of e) for (let e = 0; e < n.length; e += 2) t.push([n[e], n[e + 1]]);
	return t.length === 0 ? new Float32Array() : ye(be(he(t), le), _e);
}
//#endregion
//#region src/hacks/meshGeometryFitting.ts
var Te = /* @__PURE__ */ new Map();
function Ee(e, t, n) {
	let r = 1 - t, i = 1 - n;
	return [i * (r * e[0] + t * e[2]) + n * (t * e[4] + r * e[6]), i * (r * e[1] + t * e[3]) + n * (t * e[5] + r * e[7])];
}
function De(e, t, n) {
	let r = t.ringUVs ?? [], i = t.bkgUVs ?? [], a = t.maskUVs ?? [], o = e.length / 2, s = new Float32Array(o * 2), c = new Float32Array(o * 2), l = n ? new Float32Array(o * 2) : null;
	for (let t = 0; t < o; t++) {
		let n = e[t * 2], o = e[t * 2 + 1], [u, d] = Ee(r, n, o);
		s[t * 2] = u, s[t * 2 + 1] = d;
		let [f, p] = Ee(i, n, o);
		if (c[t * 2] = f, c[t * 2 + 1] = p, l) {
			let [e, r] = Ee(a, n, o);
			l[t * 2] = e, l[t * 2 + 1] = r;
		}
	}
	return {
		ringUVs: s,
		bkgUVs: c,
		maskUVs: l,
		origRingUVs: r,
		origBkgUVs: i,
		origMaskUVs: t.maskUVs
	};
}
function Oe(e) {
	let t = PIXI.utils.TextureCache[e];
	if (!t?.valid) return null;
	let n = t.baseTexture.resource?.source;
	if (!(n instanceof HTMLImageElement || n instanceof ImageBitmap)) return null;
	let r = t.baseTexture.realWidth ?? t.baseTexture.width, i = t.baseTexture.realHeight ?? t.baseTexture.height, a = t.frame;
	return {
		source: n,
		u0: a.x / r,
		v0: a.y / i,
		u1: (a.x + a.width) / r,
		v1: (a.y + a.height) / i,
		spritesheetWidth: r,
		spritesheetHeight: i
	};
}
function ke(e) {
	let t = e.baseTexture, n = t.resource, r = n?.source;
	if (!(r instanceof HTMLImageElement || r instanceof ImageBitmap)) return null;
	let i = (r instanceof HTMLImageElement ? r.src : null) ?? n.url ?? t.cacheId ?? t.textureCacheIds?.[0] ?? "";
	return i ? {
		source: r,
		key: i
	} : null;
}
function Ae(e) {
	let t = ke(e);
	if (!t) return null;
	let { source: n, key: r } = t;
	if (Te.has(r)) {
		let e = Te.get(r) ?? null;
		return e ? {
			pts: e,
			key: r
		} : null;
	}
	let i = xe(n), a = i.length >= 6 ? i : null;
	return Te.set(r, a), a ? {
		pts: a,
		key: r
	} : null;
}
function je(e, t) {
	let n = ke(e);
	if (!n) return null;
	let r = `${n.key}|ring:${t.ringName}|bkg:${t.bkgName}`;
	if (Te.has(r)) {
		let e = Te.get(r) ?? null;
		return e ? {
			pts: e,
			key: r
		} : null;
	}
	let i = Se(n.source), a = t.textureScaleAdjustment || 1, o = new Float32Array(i.length);
	for (let e = 0; e < i.length; e += 2) o[e] = (i[e] - .5) / a + .5, o[e + 1] = (i[e + 1] - .5) / a + .5;
	let s = Oe(t.ringName), c = Oe(t.bkgName);
	if (!s || !c) return null;
	let l = Ce(s.source, s.u0, s.v0, s.u1, s.v1, s.spritesheetWidth, s.spritesheetHeight), u = Ce(c.source, c.u0, c.v0, c.u1, c.v1, c.spritesheetWidth, c.spritesheetHeight), d = t.scaleCorrection || 1;
	function f(e) {
		let t = new Float32Array(e.length);
		for (let n = 0; n < e.length; n += 2) t[n] = (e[n] - .5) / d + .5, t[n + 1] = (e[n + 1] - .5) / d + .5;
		return t;
	}
	let p = we([
		o,
		f(l),
		f(u)
	]), m = p.length >= 6 ? p : null;
	return Te.set(r, m), m ? {
		pts: p,
		key: r
	} : null;
}
var Me = /* @__PURE__ */ new WeakMap();
function Ne(e) {
	let t = Me.get(e);
	if (t) return t;
	let n = e.length / 2 - 2, r = new Uint16Array(n * 3);
	for (let e = 0; e < n; e++) r[e * 3] = 0, r[e * 3 + 1] = e + 1, r[e * 3 + 2] = e + 2;
	return Me.set(e, r), r;
}
var Pe = /* @__PURE__ */ new WeakMap(), Fe = () => canvas.primary.tokens.values().filter((e) => Pe.has(e)), Ie = !1, Le = 65535, Re = .85, ze = 1.5, Be = 16777215, Ve = .15, He = .5;
function Ue(e) {
	let t = e.length >> 1, n = 0;
	for (let r = 0; r < t; r++) {
		let i = (r + 1) % t;
		n += e[r * 2] * e[i * 2 + 1], n -= e[i * 2] * e[r * 2 + 1];
	}
	return Math.abs(n) * .5;
}
function We(e, t) {
	let n = t.texture.orig.width, r = t.texture.orig.height, i = t.anchor.x, a = t.anchor.y, o = 1 / Math.max(t.scale.x, .001), s = new PIXI.Container(), c = new PIXI.Graphics();
	s.addChild(c), c.lineStyle(o, Be, He), c.beginFill(Be, Ve), c.drawRect(-i * n, -a * r, n, r), c.endFill(), c.lineStyle(ze * o, Le, Re);
	let l = e.length / 2, u = (e[0] - i) * n, d = (e[1] - a) * r;
	c.moveTo(u, d);
	for (let t = 1; t < l; t++) c.lineTo((e[t * 2] - i) * n, (e[t * 2 + 1] - a) * r);
	c.lineTo(u, d);
	let f = 3 * o;
	c.lineStyle(0), c.beginFill(Le, Re);
	for (let t = 0; t < l; t++) c.drawCircle((e[t * 2] - i) * n, (e[t * 2 + 1] - a) * r, f);
	c.endFill();
	let p = Math.min(100, Math.round(Ue(e) * 100)), m = new PIXI.Text(`${p}%`, {
		fontSize: 14,
		fill: Le,
		align: "center",
		dropShadow: !0,
		dropShadowDistance: 1,
		dropShadowAlpha: .8
	});
	return m.anchor.set(.5), m.scale.set(o), m.position.set((.5 - i) * n, (.5 - a) * r), s.addChild(m), s;
}
function Ge(e) {
	let t = Pe.get(e), n = t?.debugOverlay;
	if (n && (e.removeChild(n), n.destroy(), t && (t.debugOverlay = void 0)), !Ie) return;
	let r = t?.polygon;
	if (!r) return;
	let i = We(r, e);
	e.addChild(i), t && (t.debugOverlay = i);
}
function Ke(e) {
	Ie = e;
	for (let e of Fe()) Ge(e);
	console.log(`[PrimePerformance] Mesh geometry fitting debug overlay ${e ? "enabled" : "disabled"}`);
}
function qe() {
	let e = Pe.get(this);
	e?.originalUpdateBatchData.call(this);
	let t = e?.polygon;
	if (!t) return;
	let n = this._batchData, r = this.vertexData, i = this.uvs, a = r[0], o = r[1], s = r[2], c = r[3], l = r[4], u = r[5], d = r[6], f = r[7], p = i[0], m = i[1], h = i[2], g = i[3], _ = i[4], v = i[5], y = i[6], b = i[7], x = t.length / 2, ee = new Float32Array(x * 2), S = new Float32Array(x * 2);
	for (let e = 0; e < x; e++) {
		let n = t[e * 2], r = t[e * 2 + 1], i = 1 - n, x = 1 - r, te = i * a + n * s, ne = i * o + n * c, re = i * d + n * l, ie = i * f + n * u;
		ee[e * 2] = x * te + r * re, ee[e * 2 + 1] = x * ne + r * ie;
		let ae = i * p + n * h, oe = i * m + n * g, se = i * y + n * _, ce = i * b + n * v;
		S[e * 2] = x * ae + r * se, S[e * 2 + 1] = x * oe + r * ce;
	}
	n.vertexData = ee, n.uvs = S;
	let te = Ne(t);
	n.indices = te, this.indices = te;
	let ne = e?.ringUVs;
	if (ne) {
		let e = this.object?.ring;
		e && (e.ringUVs = ne.ringUVs, e.bkgUVs = ne.bkgUVs, ne.maskUVs !== null && (e.maskUVs = ne.maskUVs));
	}
}
function Je(e) {
	let t = Pe.get(e);
	if (!t) return;
	e._updateBatchData = t.originalUpdateBatchData, t.originalIndices && (e.indices = t.originalIndices);
	let n = t.ringUVs;
	if (n) {
		let t = e.object?.ring;
		t && (t.ringUVs = n.origRingUVs, t.bkgUVs = n.origBkgUVs, n.origMaskUVs !== void 0 && (t.maskUVs = n.origMaskUVs));
	}
	Pe.delete(e), Ge(e);
}
function Ye(e, t, n = null) {
	let r = e.texture;
	if (!r?.valid || t || e.castShadow) {
		Je(e);
		return;
	}
	let i = n ? je(r, n) : Ae(r);
	if (!i) {
		Je(e);
		return;
	}
	let a = Pe.get(e);
	if (a?.src === i.key) return;
	if (a) a.polygon = i.pts, a.src = i.key;
	else {
		let t = {
			polygon: i.pts,
			src: i.key,
			originalUpdateBatchData: e._updateBatchData.bind(e),
			originalIndices: e.indices,
			debugOverlay: void 0,
			ringUVs: null
		};
		Pe.set(e, t), e._updateBatchData = qe.bind(e);
	}
	let o = a ?? Pe.get(e);
	if (o) {
		if (n) {
			let e = CONFIG.Token?.ring?.shaderClass?.nullUvs, t = n.maskUVs, r = t != null && (e ? t !== e : Array.from(t).some((e) => e !== 0));
			o.ringUVs = De(i.pts, n, r);
		} else o.ringUVs = null;
		Ge(e);
	}
}
function Xe() {
	let e = this.mesh;
	e && Ye(e, this.isVideo, this.ring ?? null);
}
function Ze() {
	let e = this.mesh;
	e && Ye(e, this.isVideo);
}
function Qe(e) {
	let t = e.mesh;
	if (!t) return null;
	let n = Pe.get(t)?.polygon;
	if (!n || n.length < 6) return null;
	typeof t.calculateVertices == "function" && t.calculateVertices();
	let r = t.vertexData;
	if (!r || r.length < 8) return null;
	let i = r[0], a = r[1], o = r[2], s = r[3], c = r[4], l = r[5], u = r[6], d = r[7], f = n.length >> 1, p = new Float32Array(n.length);
	for (let e = 0; e < f; e++) {
		let t = n[e * 2], r = n[e * 2 + 1], f = 1 - t, m = 1 - r, h = f * i + t * o, g = f * a + t * s, _ = f * u + t * c, v = f * d + t * l;
		p[e * 2] = m * h + r * _, p[e * 2 + 1] = m * g + r * v;
	}
	return p;
}
var $e = "CONFIG.Token.objectClass.prototype._refreshMesh", et = "CONFIG.Tile.objectClass.prototype._refreshMesh", tt = "foundry.canvas.rendering.shaders.TokenRingSamplerShader._packInterleavedGeometry", nt = !1, rt = () => {
	C(e.MeshGeometryFitting) && it();
};
function it() {
	if (!(nt || !r.hasCanvas) && canvas?.manager?.config?.managerClass !== "EmberVista" && (nt = !0, libWrapper.register(n, tt, function(e, t, n, r, i, a) {
		e.call(this, t, n, r, i, a);
		let o = t.object;
		if (!(o && Pe.get(o)?.ringUVs)) return;
		let s = t.vertexData, c = o.object?.ring;
		if (!s || (c?.maskUVs?.length ?? 0) >= s.length) return;
		let { float32View: l } = n, u = this.vertexSize - 14 + 4;
		for (let e = 0, t = u; e < s.length; e += 2, t += this.vertexSize) {
			let e = i + t;
			l[e] = 0, l[e + 1] = 0;
		}
	}, "WRAPPER"), libWrapper.register(n, $e, async function(e, ...t) {
		let n = e(...t);
		n instanceof Promise && await n, Xe.call(this);
	}, "WRAPPER"), libWrapper.register(n, et, async function(e, ...t) {
		let n = e(...t);
		n instanceof Promise && await n, Ze.call(this);
	}, "WRAPPER"), r.hasCanvas)) {
		for (let e of canvas.tokens?.placeables ?? []) Xe.call(e);
		for (let e of canvas.tiles?.placeables ?? []) Ze.call(e);
	}
}
//#endregion
//#region src/utils/multiWrapper.ts
var at = /* @__PURE__ */ new Map();
function ot(e, t) {
	let r = at.get(e);
	if (r) {
		r.push(t);
		return;
	}
	let i = [t];
	at.set(e, i), libWrapper.register(n, e, async function(e, ...t) {
		let n = e(...t);
		n instanceof Promise && await n;
		for (let e of i) {
			let n = e.apply(this, t);
			n instanceof Promise && await n;
		}
	}, "WRAPPER");
}
function st(e, t) {
	let r = at.get(e);
	if (!r) return;
	let i = r.indexOf(t);
	i !== -1 && (r.splice(i, 1), r.length === 0 && (at.delete(e), libWrapper.unregister(n, e)));
}
//#endregion
//#region src/hacks/generalizedOooRendering.ts
var ct = {
	BatchRenderer: 0,
	CustomShaderFallback: 1,
	ConstructorFallback: 2
};
function lt(e) {
	if ("shader" in e && e.shader) {
		let t = e.shader;
		return t.program?.id ?? t.constructor?.name ?? ct.CustomShaderFallback;
	}
	return e instanceof PIXI.Sprite ? ct.BatchRenderer : e.constructor?.name ?? ct.ConstructorFallback;
}
function ut(e, t) {
	let n = e.length >> 1, r = t.length >> 1;
	for (let i = 0; i < n; i++) {
		let a = (i + 1) % n, o = e[a * 2] - e[i * 2], s = -(e[a * 2 + 1] - e[i * 2 + 1]), c = o, l = Infinity, u = -Infinity;
		for (let t = 0; t < n; t++) {
			let n = e[t * 2] * s + e[t * 2 + 1] * c;
			n < l && (l = n), n > u && (u = n);
		}
		let d = Infinity, f = -Infinity;
		for (let e = 0; e < r; e++) {
			let n = t[e * 2] * s + t[e * 2 + 1] * c;
			n < d && (d = n), n > f && (f = n);
		}
		if (u < d || f < l) return !0;
	}
	return !1;
}
function dt(e, t) {
	return !ut(e, t) && !ut(t, e);
}
function ft(e) {
	return e.getBounds(!1);
}
function pt(e) {
	let t = foundry.canvas.primary.PrimarySpriteMesh;
	if (!(e instanceof foundry.canvas.placeables.Token) || !(e.mesh instanceof t)) return null;
	let n = e.mesh;
	typeof n.calculateVertices == "function" && n.calculateVertices();
	let r = n.vertexData;
	if (!r || r.length < 8) return null;
	let i = r[0], a = r[0], o = r[1], s = r[1];
	for (let e = 2; e < r.length; e += 2) r[e] < i && (i = r[e]), r[e] > a && (a = r[e]), r[e + 1] < o && (o = r[e + 1]), r[e + 1] > s && (s = r[e + 1]);
	return new PIXI.Rectangle(i, o, a - i, s - o);
}
function mt(e, t) {
	let n = [], r = 0, i = 0, a = 0;
	for (let o of e) {
		if (!o.visible || o.worldAlpha <= 0 || !o.renderable) continue;
		if (!(o instanceof t)) {
			n.push({
				kind: "barrier",
				object: o,
				stateKey: `barrier|${a++}`,
				zOrder: r++,
				parentToken: null,
				bounds: o.getBounds(!1),
				polygon: null,
				flushed: !1
			});
			continue;
		}
		let e = o;
		if (e.mask || e.filters?.length) {
			n.push({
				kind: "atomic-token",
				object: o,
				stateKey: `atomic|${i++}`,
				zOrder: r++,
				parentToken: e,
				bounds: o.getBounds(!0),
				polygon: null,
				flushed: !1
			});
			continue;
		}
		let s = pt(e), c = Qe(e), l = e.voidMesh;
		for (let t = 0; t < e.children.length; t++) {
			let i = e.children[t], a = i === l;
			if (!a && (!i.visible || i.worldAlpha <= 0 || !i.renderable)) continue;
			let o = `${a ? PIXI.BLEND_MODES.ERASE : i.blendMode ?? PIXI.BLEND_MODES.NORMAL}|${lt(i)}`, u = a && s ? s.clone() : ft(i);
			n.push({
				kind: "child",
				object: i,
				stateKey: o,
				zOrder: r++,
				parentToken: e,
				bounds: u,
				polygon: a ? c : null,
				flushed: !1
			});
		}
	}
	return n;
}
function ht(e, t) {
	if (!e.bounds.intersects(t.bounds)) return !1;
	let n = e.polygon ?? t.polygon;
	if (!n) return !0;
	let r = e.polygon ? t.bounds : e.bounds, i = new Float32Array(8);
	return i[0] = r.left, i[1] = r.top, i[2] = r.right, i[3] = r.top, i[4] = r.right, i[5] = r.bottom, i[6] = r.left, i[7] = r.bottom, dt(n, i);
}
function gt(e) {
	if (e.length === 0) return [];
	let t = foundry.canvas.geometry.CanvasQuadtree, n = new t(), r = /* @__PURE__ */ new Map(), i = [], a = 0, o = (e) => {
		e.sort((e, t) => e.creationOrder - t.creationOrder);
		for (let t of e) {
			i.push(t.units);
			for (let e of t.units) e.flushed = !0;
			r.delete(t.stateKey);
		}
	};
	for (let t of e) {
		if (t.kind === "barrier") {
			o(Array.from(r.values())), i.push([t]), t.flushed = !0;
			continue;
		}
		let e = /* @__PURE__ */ new Set();
		if (n.getObjects(t.bounds, { collisionTest: ({ t: n }) => (n.flushed || n.stateKey === t.stateKey || ht(t, n) && e.add(n.stateKey), !1) }), e.size > 0) {
			let t = [];
			for (let n of e) {
				let e = r.get(n);
				e && t.push(e);
			}
			o(t);
		}
		let s = r.get(t.stateKey);
		s || (s = {
			stateKey: t.stateKey,
			units: [],
			creationOrder: a++
		}, r.set(t.stateKey, s)), s.units.push(t);
		let c = {
			r: t.bounds,
			t,
			n: /* @__PURE__ */ new Set()
		};
		n.insert(c);
	}
	let s = Array.from(r.values());
	s.sort((e, t) => e.creationOrder - t.creationOrder);
	for (let e of s) i.push(e.units);
	return i;
}
var _t = class {
	#e = "";
	#t = null;
	#n(e, t) {
		let n = `n=${e.length};`;
		for (let r of e) if (r instanceof t) {
			let e = r, t = e.mesh, i = t?.x ?? e.x, a = t?.y ?? e.y, o = t?.scale?.x ?? 1, s = t?.scale?.y ?? 1;
			n += `${i},${a},${o},${s},`, n += `${e.document?.width ?? 1},${e.document?.height ?? 1},`, n += `${e.document?.elevation ?? 0},${e.document?.sort ?? 0},${e.zIndex},`, n += `${+!!e.visible},${e.filters?.length ?? 0},${+!!e.mask},`, n += `${e.children.length};`;
		} else n += `o${+!!r.visible};`;
		return n;
	}
	getSchedule(e) {
		let t = foundry.canvas.placeables.Token, n = this.#n(e.children, t);
		return n === this.#e && this.#t ? this.#t : (this.#e = n, this.#t = this.#r(e, t), this.#t);
	}
	invalidate() {
		this.#e = "", this.#t = null;
	}
	#r(e, t) {
		let n = gt(mt(e.children, t)), r = /* @__PURE__ */ new Set(), i = `${PIXI.BLEND_MODES.ERASE}|`, a = 0, o = !1;
		for (let e of n) {
			let t = e.length > 0 && e[0].stateKey.startsWith(i);
			t && !o && a++, o = t;
			for (let t of e) t.parentToken !== null && r.add(t.parentToken);
		}
		return {
			batches: n,
			tokenCount: r.size,
			voidMeshBatchCount: a
		};
	}
}, vt = new PIXI.Matrix();
function yt(e, t) {
	let n = e.renderTexture.sourceFrame;
	if (!(n.width > 0 && n.height > 0)) return;
	let r, i;
	this.cullArea ? (r = this.cullArea, i = this.worldTransform) : this._render !== PIXI.Container.prototype._render && (r = this.getBounds(!0));
	let a = e.projection.transform;
	if (a && (i ? (i = vt.copyFrom(i), i.prepend(a)) : i = a), r && n.intersects(r, i)) this._render(e);
	else if (this.cullArea) return;
	let { batches: o, tokenCount: s, voidMeshBatchCount: c } = t.getSchedule(this);
	bt = s, xt = c;
	for (let n of o) {
		let r = !1;
		for (let t of n) {
			let n = t.object;
			if (n.destroyed) {
				r = !0;
				continue;
			}
			if (t.kind === "child" && t.parentToken) {
				let r = n.cullable;
				n.cullable = r ?? t.parentToken.cullable, n.render(e), n.cullable = r;
			} else n.render(e);
		}
		r && t.invalidate();
	}
}
var bt = 0, xt = 0, St = "CONFIG.Canvas.layers.tokens.layerClass.prototype._draw", Ct = new _t(), wt = /* @__PURE__ */ new WeakMap();
function Tt(e) {
	yt.call(this, e, Ct);
}
function Et(e) {
	wt.has(e) || (wt.set(e, e.render), e.render = Tt);
}
function Dt(e) {
	let t = wt.get(e);
	t !== void 0 && (e.render = t, wt.delete(e));
}
function Ot() {
	this.objects && Et(this.objects);
}
var kt = () => Ct.invalidate(), At = !1;
function jt() {
	C(e.OptimizeTokenUiBatching) && Mt();
}
function Mt() {
	if (At || !r.hasCanvas) return;
	At = !0, ot(St, Ot), Hooks.on("updateToken", kt), Hooks.on("createToken", kt), Hooks.on("deleteToken", kt), Hooks.on("refreshToken", kt), Hooks.on("canvasReady", kt);
	let e = canvas?.tokens?.objects;
	e && Et(e);
}
function Nt() {
	if (!At) return;
	At = !1, st(St, Ot), Hooks.off("updateToken", kt), Hooks.off("createToken", kt), Hooks.off("deleteToken", kt), Hooks.off("refreshToken", kt), Hooks.off("canvasReady", kt);
	let e = canvas?.tokens?.objects;
	e && Dt(e), Ct.invalidate();
}
//#endregion
//#region src/hacks/tokenBarsCaching.ts
var Pt = /* @__PURE__ */ new WeakMap();
function Ft(e) {
	if (e instanceof PIXI.Graphics) e.cacheAsBitmap = !1;
	else if (e instanceof PIXI.Container) for (let t of e.children) Ft(t);
}
function It(e, t) {
	if (e instanceof PIXI.Graphics) e.cacheAsBitmapResolution = t, e.cacheAsBitmap = !0;
	else if (e instanceof PIXI.Container) for (let n of e.children) It(n, t);
}
async function Lt(e, ...t) {
	let n = Pt.get(this);
	n !== void 0 && (PIXI.Ticker.shared.remove(n), Pt.delete(this)), this.bars && Ft(this.bars);
	let r = e(...t);
	r instanceof Promise && await r;
	let i = v();
	if (game.modules.get("barbrawl")?.active) setTimeout(() => It(this.bars, i), 50);
	else {
		let e = () => {
			Pt.delete(this), It(this.bars, i), PIXI.Ticker.shared.remove(e);
		};
		PIXI.Ticker.shared.addOnce(e, this, PIXI.UPDATE_PRIORITY.LOW), Pt.set(this, e);
	}
}
function Rt() {
	let e = game.modules.get("barbrawl");
	return !(e?.active && foundry.utils.isNewerVersion(e.version, "1.8.8"));
}
var zt = "CONFIG.Token.objectClass.prototype.drawBars", Bt = !1, Vt = () => {
	C(e.TokenBarsCaching) && Ht();
};
function Ht() {
	Bt || !Rt() || !r.hasCanvas || (Bt = !0, libWrapper.register(n, zt, Lt, "WRAPPER"));
}
function Ut() {
	if (Bt && (Bt = !1, libWrapper.unregister(n, zt), r.hasCanvas)) for (let e of canvas?.tokens?.placeables ?? []) {
		let t = Pt.get(e);
		t !== void 0 && (PIXI.Ticker.shared.remove(t), Pt.delete(e)), e.bars && Ft(e.bars);
	}
}
//#endregion
//#region src/utils/registerWrapper.ts
function Wt(e, t, { v12: i, v13: a, v14: o }) {
	let s = r.game.release.generation;
	i && s < 13 ? libWrapper.register(n, i, e, t) : o && s >= 14 ? libWrapper.register(n, o, e, t) : a && s >= 13 && libWrapper.register(n, a, e, t);
}
function Gt({ v12: e, v13: t, v14: i }) {
	let a = r.game.release.generation;
	e && a < 13 ? libWrapper.unregister(n, e) : i && a >= 14 ? libWrapper.unregister(n, i) : t && a >= 13 && libWrapper.unregister(n, t);
}
//#endregion
//#region src/hacks/wallSpriteCaching.ts
var Kt = null;
function qt(e) {
	return 2 ** Math.ceil(Math.log2(Math.max(1, e)));
}
function Jt(e, t, n) {
	t.baseTexture.mipmap = PIXI.MIPMAP_MODES.ON, e.render(n, {
		renderTexture: t,
		clear: !0
	}), e.framebuffer.blit(), e.texture.bind(t.baseTexture), e.gl.generateMipmap(e.gl.TEXTURE_2D);
}
function Yt() {
	if (Kt) return Kt;
	let e = canvas?.app?.renderer;
	if (!e) return null;
	let t = 2 * canvas.dimensions.uiScale, n = PIXI.RenderTexture.create({
		width: 32,
		height: 32
	}), r = new PIXI.Graphics();
	r.beginFill(0).drawRect(0, 0, 32, 32).endFill(), r.beginFill(16777215).drawRect(0, 11, 32, 10).endFill(), Jt(e, n, r), r.destroy();
	let i = (n) => {
		let r = n + t / 2, i = qt(Math.ceil(r * 2) + 2) * 2, a = i / 2, o = PIXI.RenderTexture.create({
			width: i,
			height: i,
			resolution: e.resolution
		}), s = new PIXI.Graphics();
		return s.lineStyle(t, 0, 1), s.beginFill(16777215, 1), s.drawCircle(a, a, n), s.endFill(), Jt(e, o, s), s.destroy(), {
			tex: o,
			displaySize: i
		};
	}, a = i(t * 3), o = i(t * 4);
	return Kt = {
		lineTex: n,
		endpointTex: a.tex,
		endpointHoverTex: o.tex,
		lw: t,
		epNormalSize: a.displaySize,
		epHoverSize: o.displaySize
	}, Kt;
}
function Xt() {
	Kt &&= (Kt.lineTex.destroy(!0), Kt.endpointTex.destroy(!0), Kt.endpointHoverTex.destroy(!0), null);
}
var Zt = /* @__PURE__ */ new WeakMap();
function Qt(e, t) {
	let n = Zt.get(e);
	if (n && !n.line.destroyed && n.line.parent) return n;
	let r = new PIXI.Sprite(t.lineTex);
	r.anchor.set(0, .5), e.line.addChild(r);
	let i = new PIXI.Sprite(t.endpointTex);
	i.anchor.set(.5, .5), e.endpoints.addChild(i);
	let a = new PIXI.Sprite(t.endpointTex);
	a.anchor.set(.5, .5), e.endpoints.addChild(a);
	let o = {
		line: r,
		epA: i,
		epB: a
	};
	return Zt.set(e, o), o;
}
function $t(e) {
	let t = Zt.get(e);
	if (t) {
		for (let e of [
			t.line,
			t.epA,
			t.epB
		]) e.destroyed || (e.parent?.removeChild(e), e.destroy());
		Zt.delete(e);
	}
}
function en(e) {
	e(), this.line.clear();
	let t = Yt();
	if (!t) return;
	let n = this.document.c, r = n[2] - n[0], i = n[3] - n[1], a = Math.sqrt(r * r + i * i), o = this._getWallColor(), { line: s } = Qt(this, t);
	s.texture = t.lineTex, s.position.set(n[0], n[1]), s.width = Math.max(1, a), s.height = t.lw * 3, s.rotation = Math.atan2(i, r), s.tint = o;
}
function tn(e) {
	e(), this.endpoints.clear();
	let t = Yt();
	if (!t) return;
	let n = this.document.c, r = this._getWallColor(), i = !!(this.hover || this.layer?.highlightObjects), a = i ? t.endpointHoverTex : t.endpointTex, o = i ? t.epHoverSize : t.epNormalSize, { epA: s, epB: c } = Qt(this, t);
	s.texture = a, s.position.set(n[0], n[1]), s.width = s.height = o, s.tint = r, c.texture = a, c.position.set(n[2], n[3]), c.width = c.height = o, c.tint = r;
}
var nn = { v13: "foundry.canvas.placeables.Wall.prototype._refreshLine" }, rn = { v13: "foundry.canvas.placeables.Wall.prototype._refreshEndpoints" }, an = !1;
function on() {
	if (!(an || !r.hasCanvas)) {
		an = !0, Wt(en, "WRAPPER", nn), Wt(tn, "WRAPPER", rn);
		for (let e of canvas?.walls?.placeables ?? []) e.renderFlags?.set({
			refreshLine: !0,
			refreshEndpoints: !0
		});
	}
}
function sn() {
	if (an) {
		an = !1, Gt(nn), Gt(rn);
		for (let e of canvas?.walls?.placeables ?? []) $t(e), e.renderFlags?.set({
			refreshLine: !0,
			refreshEndpoints: !0
		});
		Xt();
	}
}
function cn() {
	C(e.WallSpriteCaching) && on();
}
//#endregion
//#region src/settings/settings.ts
function C(e) {
	return game.settings.get(n, e);
}
Hooks.on("init", () => {
	game.settings.register(n, e.CustomRenderScale, {
		name: `${n}.settings.${e.CustomRenderScale}.name`,
		hint: `${n}.settings.${e.CustomRenderScale}.hint`,
		config: !1,
		scope: "client",
		type: Object,
		default: t
	}), game.settings.registerMenu(n, e.CustomRenderScale, {
		name: `${n}.settings.${e.CustomRenderScale}.name`,
		hint: `${n}.settings.${e.CustomRenderScale}.hint`,
		label: `${n}.settings.${e.CustomRenderScale}.label`,
		icon: "fa-solid fa-percent",
		type: h,
		restricted: !1
	}), game.settings.register(n, e.PrecomputedNoiseTextures, {
		name: `${n}.settings.${e.PrecomputedNoiseTextures}.name`,
		hint: `${n}.settings.${e.PrecomputedNoiseTextures}.hint`,
		scope: "client",
		config: !0,
		requiresReload: !0,
		type: Boolean,
		default: !0
	}), game.settings.register(n, e.ReduceLightingResolution, {
		name: `${n}.settings.${e.ReduceLightingResolution}.name`,
		hint: `${n}.settings.${e.ReduceLightingResolution}.hint`,
		scope: "client",
		requiresReload: !0,
		config: !0,
		onChange: (e) => {
			e ? u() : d(), p();
		},
		type: Boolean,
		default: !0
	}), game.settings.register(n, e.OptimizeTokenUiBatching, {
		name: `${n}.settings.${e.OptimizeTokenUiBatching}.name`,
		hint: `${n}.settings.${e.OptimizeTokenUiBatching}.hint`,
		scope: "client",
		config: !0,
		requiresReload: !1,
		onChange: (e) => {
			e ? Mt() : Nt();
		},
		type: Boolean,
		default: !0
	}), game.settings.register(n, e.EffectsCaching, {
		name: `${n}.settings.${e.EffectsCaching}.name`,
		hint: `${n}.settings.${e.EffectsCaching}.hint`,
		scope: "client",
		config: !0,
		requiresReload: !1,
		onChange: (e) => {
			e ? ie() : ae();
		},
		type: Boolean,
		default: !0
	}), game.settings.register(n, e.TokenBarsCaching, {
		name: `${n}.settings.${e.TokenBarsCaching}.name`,
		hint: `${n}.settings.${e.TokenBarsCaching}.hint`,
		scope: "client",
		config: !0,
		requiresReload: !1,
		onChange: (e) => {
			e ? Ht() : Ut();
		},
		type: Boolean,
		default: !0
	}), game.settings.register(n, e.ControlIconCaching, {
		name: `${n}.settings.${e.ControlIconCaching}.name`,
		hint: `${n}.settings.${e.ControlIconCaching}.hint`,
		scope: "client",
		config: !0,
		requiresReload: !1,
		onChange: (e) => {
			e ? vn() : yn();
		},
		type: Boolean,
		default: !0
	}), game.settings.register(n, e.WallSpriteCaching, {
		name: `${n}.settings.${e.WallSpriteCaching}.name`,
		hint: `${n}.settings.${e.WallSpriteCaching}.hint`,
		scope: "client",
		config: !0,
		requiresReload: !1,
		onChange: (e) => {
			e ? on() : sn();
		},
		type: Boolean,
		default: !0
	}), game.settings.register(n, e.MeshGeometryFitting, {
		name: `${n}.settings.${e.MeshGeometryFitting}.name`,
		hint: `${n}.settings.${e.MeshGeometryFitting}.hint`,
		scope: "client",
		config: !0,
		requiresReload: !0,
		type: Boolean,
		default: !1
	}), game.settings.register(n, e.DnD5eOptimizations, {
		name: `${n}.settings.${e.DnD5eOptimizations}.name`,
		hint: `${n}.settings.${e.DnD5eOptimizations}.hint`,
		scope: "client",
		config: game.system?.id === "dnd5e",
		requiresReload: !0,
		type: Boolean,
		default: !0
	}), game.settings.register(n, e.EmberShaderOptimizations, {
		name: `${n}.settings.${e.EmberShaderOptimizations}.name`,
		hint: `${n}.settings.${e.EmberShaderOptimizations}.hint`,
		scope: "client",
		config: !!game.modules.get("ember")?.active,
		requiresReload: !0,
		type: Boolean,
		default: !0
	}), game.settings.register(n, e.DisableAppV2BackgroundBlur, {
		name: `${n}.settings.${e.DisableAppV2BackgroundBlur}.name`,
		hint: `${n}.settings.${e.DisableAppV2BackgroundBlur}.hint`,
		scope: "client",
		requiresReload: !1,
		config: !0,
		onChange: (e) => {
			_(!!e);
		},
		type: Boolean,
		default: !1
	});
});
//#endregion
//#region src/hacks/controlIconCaching.ts
var ln = /* @__PURE__ */ new WeakSet();
function un(e) {
	if (e.filters?.length) return !0;
	if (!(e instanceof PIXI.Container)) return !1;
	for (let t of e.children) if (un(t)) return !0;
	return !1;
}
function dn(e, ...t) {
	if (un(this)) return e(...t);
	this.cacheAsBitmap = !1, e(...t), this.cacheAsBitmapResolution = v(), this.cacheAsBitmap = !0, ln.add(this);
}
function fn(e, ...t) {
	e(...t);
	let n = this.controlIcon;
	n instanceof PIXI.Container && ln.has(n) && (n.cacheAsBitmap = !1);
}
function pn(e, ...t) {
	e(...t);
	let n = this.controlIcon;
	n instanceof PIXI.Container && ln.has(n) && (n.cacheAsBitmapResolution = v(), n.cacheAsBitmap = !0);
}
var mn = {
	v13: "foundry.canvas.containers.ControlIcon.prototype.refresh",
	v14: "foundry.canvas.containers.ControlIcon.prototype._refresh"
}, hn = { v13: "foundry.canvas.placeables.PlaceableObject.prototype._onHoverIn" }, gn = { v13: "foundry.canvas.placeables.PlaceableObject.prototype._onHoverOut" }, _n = !1;
function vn() {
	_n || !r.hasCanvas || (_n = !0, Wt(dn, "WRAPPER", mn), Wt(fn, "WRAPPER", hn), Wt(pn, "WRAPPER", gn));
}
function yn() {
	if (!(!_n || !r.hasCanvas) && (_n = !1, ln = /* @__PURE__ */ new WeakSet(), Gt(mn), Gt(hn), Gt(gn), r.hasCanvas)) for (let e of [
		canvas.lighting,
		canvas.sounds,
		canvas.notes,
		canvas.drawings
	]) for (let t of e.placeables) {
		let e = t.controlIcon;
		e instanceof PIXI.Container && (e.cacheAsBitmap = !1);
	}
}
function bn() {
	C(e.ControlIconCaching) && vn();
}
//#endregion
//#region node_modules/svelte/src/internal/disclose-version.js
typeof window < "u" && ((window.__svelte ??= {}).v ??= /* @__PURE__ */ new Set()).add("5");
//#endregion
//#region node_modules/svelte/src/constants.js
var xn = {}, w = Symbol(), Sn = Symbol("filename"), Cn = globalThis.process?.env?.NODE_ENV, T = Cn && !Cn.toLowerCase().startsWith("prod"), wn = Array.isArray, Tn = Array.prototype.indexOf, En = Array.prototype.includes, Dn = Array.from, On = Object.defineProperty, kn = Object.getOwnPropertyDescriptor, An = Object.prototype, jn = Array.prototype, Mn = Object.getPrototypeOf, Nn = Object.isExtensible, Pn = () => {};
function Fn(e) {
	for (var t = 0; t < e.length; t++) e[t]();
}
function In() {
	var e, t;
	return {
		promise: new Promise((n, r) => {
			e = n, t = r;
		}),
		resolve: e,
		reject: t
	};
}
var E = 1024, Ln = 2048, Rn = 4096, zn = 8192, Bn = 16384, Vn = 32768, Hn = 1 << 25, Un = 65536, Wn = 1 << 19, Gn = 1 << 20, Kn = 1 << 25, qn = 65536, Jn = 1 << 21, Yn = 1 << 22, Xn = 1 << 23, Zn = Symbol("$state"), Qn = Symbol("proxy path"), $n = Symbol("hmr anchor"), er = new class extends Error {
	name = "StaleReactionError";
	message = "The reaction that called `getAbortSignal()` was re-run or destroyed";
}();
globalThis.document?.contentType;
//#endregion
//#region node_modules/svelte/src/internal/shared/errors.js
function tr(e) {
	if (T) {
		let t = /* @__PURE__ */ Error(`invariant_violation\nAn invariant violation occurred, meaning Svelte's internal assumptions were flawed. This is a bug in Svelte, not your app — please open an issue at https://github.com/sveltejs/svelte, citing the following message: "${e}"\nhttps://svelte.dev/e/invariant_violation`);
		throw t.name = "Svelte error", t;
	} else throw Error("https://svelte.dev/e/invariant_violation");
}
//#endregion
//#region node_modules/svelte/src/internal/client/errors.js
function nr() {
	if (T) {
		let e = /* @__PURE__ */ Error("async_derived_orphan\nCannot create a `$derived(...)` with an `await` expression outside of an effect tree\nhttps://svelte.dev/e/async_derived_orphan");
		throw e.name = "Svelte error", e;
	} else throw Error("https://svelte.dev/e/async_derived_orphan");
}
function rr() {
	if (T) {
		let e = /* @__PURE__ */ Error("derived_references_self\nA derived value cannot reference itself recursively\nhttps://svelte.dev/e/derived_references_self");
		throw e.name = "Svelte error", e;
	} else throw Error("https://svelte.dev/e/derived_references_self");
}
function ir(e, t, n) {
	if (T) {
		let r = /* @__PURE__ */ Error(`each_key_duplicate\n${n ? `Keyed each block has duplicate key \`${n}\` at indexes ${e} and ${t}` : `Keyed each block has duplicate key at indexes ${e} and ${t}`}\nhttps://svelte.dev/e/each_key_duplicate`);
		throw r.name = "Svelte error", r;
	} else throw Error("https://svelte.dev/e/each_key_duplicate");
}
function ar(e, t, n) {
	if (T) {
		let r = /* @__PURE__ */ Error(`each_key_volatile\nKeyed each block has key that is not idempotent — the key for item at index ${e} was \`${t}\` but is now \`${n}\`. Keys must be the same each time for a given item\nhttps://svelte.dev/e/each_key_volatile`);
		throw r.name = "Svelte error", r;
	} else throw Error("https://svelte.dev/e/each_key_volatile");
}
function or() {
	if (T) {
		let e = /* @__PURE__ */ Error("effect_update_depth_exceeded\nMaximum update depth exceeded. This typically indicates that an effect reads and writes the same piece of state\nhttps://svelte.dev/e/effect_update_depth_exceeded");
		throw e.name = "Svelte error", e;
	} else throw Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function sr(e) {
	if (T) {
		let t = /* @__PURE__ */ Error(`rune_outside_svelte\nThe \`${e}\` rune is only available inside \`.svelte\` and \`.svelte.js/ts\` files\nhttps://svelte.dev/e/rune_outside_svelte`);
		throw t.name = "Svelte error", t;
	} else throw Error("https://svelte.dev/e/rune_outside_svelte");
}
function cr() {
	if (T) {
		let e = /* @__PURE__ */ Error("state_descriptors_fixed\nProperty descriptors defined on `$state` objects must contain `value` and always be `enumerable`, `configurable` and `writable`.\nhttps://svelte.dev/e/state_descriptors_fixed");
		throw e.name = "Svelte error", e;
	} else throw Error("https://svelte.dev/e/state_descriptors_fixed");
}
function lr() {
	if (T) {
		let e = /* @__PURE__ */ Error("state_prototype_fixed\nCannot set prototype of `$state` object\nhttps://svelte.dev/e/state_prototype_fixed");
		throw e.name = "Svelte error", e;
	} else throw Error("https://svelte.dev/e/state_prototype_fixed");
}
function ur() {
	if (T) {
		let e = /* @__PURE__ */ Error("state_unsafe_mutation\nUpdating state inside `$derived(...)`, `$inspect(...)` or a template expression is forbidden. If the value should not be reactive, declare it without `$state`\nhttps://svelte.dev/e/state_unsafe_mutation");
		throw e.name = "Svelte error", e;
	} else throw Error("https://svelte.dev/e/state_unsafe_mutation");
}
function dr() {
	if (T) {
		let e = /* @__PURE__ */ Error("svelte_boundary_reset_onerror\nA `<svelte:boundary>` `reset` function cannot be called while an error is still being handled\nhttps://svelte.dev/e/svelte_boundary_reset_onerror");
		throw e.name = "Svelte error", e;
	} else throw Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
//#endregion
//#region node_modules/svelte/src/internal/client/warnings.js
var fr = "font-weight: bold", pr = "font-weight: normal";
function mr(e) {
	T ? console.warn(`%c[svelte] await_reactivity_loss\n%cDetected reactivity loss when reading \`${e}\`. This happens when state is read in an async function after an earlier \`await\`\nhttps://svelte.dev/e/await_reactivity_loss`, fr, pr) : console.warn("https://svelte.dev/e/await_reactivity_loss");
}
function hr(e, t) {
	T ? console.warn(`%c[svelte] await_waterfall\n%cAn async derived, \`${e}\` (${t}) was not read immediately after it resolved. This often indicates an unnecessary waterfall, which can slow down your app\nhttps://svelte.dev/e/await_waterfall`, fr, pr) : console.warn("https://svelte.dev/e/await_waterfall");
}
function gr() {
	T ? console.warn("%c[svelte] derived_inert\n%cReading a derived belonging to a now-destroyed effect may result in stale values\nhttps://svelte.dev/e/derived_inert", fr, pr) : console.warn("https://svelte.dev/e/derived_inert");
}
function _r(e) {
	T ? console.warn(`%c[svelte] hydration_mismatch\n%c${e ? `Hydration failed because the initial UI does not match what was rendered on the server. The error occurred near ${e}` : "Hydration failed because the initial UI does not match what was rendered on the server"}\nhttps://svelte.dev/e/hydration_mismatch`, fr, pr) : console.warn("https://svelte.dev/e/hydration_mismatch");
}
function vr() {
	T ? console.warn("%c[svelte] lifecycle_double_unmount\n%cTried to unmount a component that was not mounted\nhttps://svelte.dev/e/lifecycle_double_unmount", fr, pr) : console.warn("https://svelte.dev/e/lifecycle_double_unmount");
}
function yr(e) {
	T ? console.warn(`%c[svelte] state_proxy_equality_mismatch\n%cReactive \`$state(...)\` proxies and the values they proxy have different identities. Because of this, comparisons with \`${e}\` will produce unexpected results\nhttps://svelte.dev/e/state_proxy_equality_mismatch`, fr, pr) : console.warn("https://svelte.dev/e/state_proxy_equality_mismatch");
}
function br() {
	T ? console.warn("%c[svelte] state_proxy_unmount\n%cTried to unmount a state proxy, rather than a component\nhttps://svelte.dev/e/state_proxy_unmount", fr, pr) : console.warn("https://svelte.dev/e/state_proxy_unmount");
}
function xr() {
	T ? console.warn("%c[svelte] svelte_boundary_reset_noop\n%cA `<svelte:boundary>` `reset` function only resets the boundary the first time it is called\nhttps://svelte.dev/e/svelte_boundary_reset_noop", fr, pr) : console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/hydration.js
var D = !1;
function Sr(e) {
	D = e;
}
var O;
function k(e) {
	if (e === null) throw _r(), xn;
	return O = e;
}
function Cr() {
	return k(/* @__PURE__ */ ha(O));
}
function A(e) {
	if (D) {
		if (/* @__PURE__ */ ha(O) !== null) throw _r(), xn;
		O = e;
	}
}
function wr(e = 1) {
	if (D) {
		for (var t = e, n = O; t--;) n = /* @__PURE__ */ ha(n);
		O = n;
	}
}
function Tr(e = !0) {
	for (var t = 0, n = O;;) {
		if (n.nodeType === 8) {
			var r = n.data;
			if (r === "]") {
				if (t === 0) return n;
				--t;
			} else (r === "[" || r === "[!" || r[0] === "[" && !isNaN(Number(r.slice(1)))) && (t += 1);
		}
		var i = /* @__PURE__ */ ha(n);
		e && n.remove(), n = i;
	}
}
function Er(e) {
	if (!e || e.nodeType !== 8) throw _r(), xn;
	return e.data;
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/equality.js
function Dr(e) {
	return e === this.v;
}
function Or(e, t) {
	return e == e ? e !== t || typeof e == "object" && !!e || typeof e == "function" : t == t;
}
function kr(e) {
	return !Or(e, this.v);
}
//#endregion
//#region node_modules/svelte/src/internal/flags/index.js
var Ar = !1, jr = !1, Mr = !1, Nr = null;
function j(e, t) {
	return e.label = t, Pr(e.v, t), e;
}
function Pr(e, t) {
	return e?.[Qn]?.(t), e;
}
function Fr(e) {
	return typeof e == "symbol" ? `Symbol(${e.description})` : typeof e == "function" ? "<function>" : typeof e == "object" && e ? "<object>" : String(e);
}
//#endregion
//#region node_modules/svelte/src/internal/shared/dev.js
function Ir(e) {
	let t = /* @__PURE__ */ Error(), n = Lr();
	return n.length === 0 ? null : (n.unshift("\n"), On(t, "stack", { value: n.join("\n") }), On(t, "name", { value: e }), t);
}
function Lr() {
	let e = Error.stackTraceLimit;
	Error.stackTraceLimit = Infinity;
	let t = (/* @__PURE__ */ Error()).stack;
	if (Error.stackTraceLimit = e, !t) return [];
	let n = t.split("\n"), r = [];
	for (let e = 0; e < n.length; e++) {
		let t = n[e], i = t.replaceAll("\\", "/");
		if (t.trim() !== "Error") {
			if (t.includes("validate_each_keys")) return [];
			i.includes("svelte/src/internal") || i.includes("node_modules/.vite") || r.push(t);
		}
	}
	return r;
}
function Rr(e, t) {
	if (!T) throw Error("invariant(...) was not guarded by if (DEV)");
	e || tr(t);
}
//#endregion
//#region node_modules/svelte/src/internal/client/context.js
var M = null;
function zr(e) {
	M = e;
}
var Br = null;
function Vr(e) {
	Br = e;
}
var Hr = null;
function Ur(e) {
	Hr = e;
}
function Wr(e, t = !1, n) {
	M = {
		p: M,
		i: !1,
		c: null,
		e: null,
		s: e,
		x: null,
		r: q,
		l: jr && !t ? {
			s: null,
			u: null,
			$: []
		} : null
	}, T && (M.function = n, Hr = n);
}
function Gr(e) {
	var t = M, n = t.e;
	if (n !== null) {
		t.e = null;
		for (var r of n) Ea(r);
	}
	return e !== void 0 && (t.x = e), t.i = !0, M = t.p, T && (Hr = M?.function ?? null), e ?? {};
}
function Kr() {
	return !jr || M !== null && M.l === null;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/task.js
var qr = [];
function Jr() {
	var e = qr;
	qr = [], Fn(e);
}
function Yr(e) {
	if (qr.length === 0 && !ci) {
		var t = qr;
		queueMicrotask(() => {
			t === qr && Jr();
		});
	}
	qr.push(e);
}
//#endregion
//#region node_modules/svelte/src/internal/client/error-handling.js
var Xr = /* @__PURE__ */ new WeakMap();
function Zr(e) {
	var t = q;
	if (t === null) return W.f |= Xn, e;
	if (T && e instanceof Error && !Xr.has(e) && Xr.set(e, $r(e, t)), !(t.f & 32768) && !(t.f & 4)) throw T && !t.parent && e instanceof Error && ei(e), e;
	Qr(e, t);
}
function Qr(e, t) {
	for (; t !== null;) {
		if (t.f & 128) {
			if (!(t.f & 32768)) throw e;
			try {
				t.b.error(e);
				return;
			} catch (t) {
				e = t;
			}
		}
		t = t.parent;
	}
	throw T && e instanceof Error && ei(e), e;
}
function $r(e, t) {
	let n = kn(e, "message");
	if (!(n && !n.configurable)) {
		for (var r = ua ? "  " : "	", i = `\n${r}in ${t.fn?.name || "<unknown>"}`, a = t.ctx; a !== null;) i += `\n${r}in ${a.function?.[Sn].split("/").pop()}`, a = a.p;
		return {
			message: e.message + `\n${i}\n`,
			stack: e.stack?.split("\n").filter((e) => !e.includes("svelte/src/internal")).join("\n")
		};
	}
}
function ei(e) {
	let t = Xr.get(e);
	t && (On(e, "message", { value: t.message }), On(e, "stack", { value: t.stack }));
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/status.js
var ti = ~(Ln | Rn | E);
function N(e, t) {
	e.f = e.f & ti | t;
}
function ni(e) {
	e.f & 512 || e.deps === null ? N(e, E) : N(e, Rn);
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/utils.js
function ri(e) {
	if (e !== null) for (let t of e) !(t.f & 2) || !(t.f & 65536) || (t.f ^= qn, ri(t.deps));
}
function ii(e, t, n) {
	e.f & 2048 ? t.add(e) : e.f & 4096 && n.add(e), ri(e.deps), N(e, E);
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/store.js
var ai = !1, oi = /* @__PURE__ */ new Set(), P = null, F = null, si = null, ci = !1, li = !1, di = null, fi = null, pi = 0, mi = T ? /* @__PURE__ */ new Set() : null, hi = 1, gi = class e {
	id = hi++;
	current = /* @__PURE__ */ new Map();
	previous = /* @__PURE__ */ new Map();
	#e = /* @__PURE__ */ new Set();
	#t = /* @__PURE__ */ new Set();
	#n = /* @__PURE__ */ new Set();
	#r = /* @__PURE__ */ new Map();
	#i = /* @__PURE__ */ new Map();
	#a = null;
	#o = [];
	#s = [];
	#c = /* @__PURE__ */ new Set();
	#l = /* @__PURE__ */ new Set();
	#u = /* @__PURE__ */ new Map();
	#d = /* @__PURE__ */ new Set();
	is_fork = !1;
	#f = !1;
	#p = /* @__PURE__ */ new Set();
	#m() {
		return this.is_fork || this.#i.size > 0;
	}
	#h() {
		for (let n of this.#p) for (let r of n.#i.keys()) {
			for (var e = !1, t = r; t.parent !== null;) {
				if (this.#u.has(t)) {
					e = !0;
					break;
				}
				t = t.parent;
			}
			if (!e) return !0;
		}
		return !1;
	}
	skip_effect(e) {
		this.#u.has(e) || this.#u.set(e, {
			d: [],
			m: []
		}), this.#d.delete(e);
	}
	unskip_effect(e, t = (e) => this.schedule(e)) {
		var n = this.#u.get(e);
		if (n) {
			this.#u.delete(e);
			for (var r of n.d) N(r, Ln), t(r);
			for (r of n.m) N(r, Rn), t(r);
		}
		this.#d.add(e);
	}
	#g() {
		if (pi++ > 1e3 && (oi.delete(this), _i()), !this.#m()) {
			for (let e of this.#c) this.#l.delete(e), N(e, Ln), this.schedule(e);
			for (let e of this.#l) N(e, Rn), this.schedule(e);
		}
		let t = this.#o;
		this.#o = [], this.apply();
		var n = di = [], r = [], i = fi = [];
		for (let e of t) try {
			this.#_(e, n, r);
		} catch (t) {
			throw wi(e), t;
		}
		if (P = null, i.length > 0) {
			var a = e.ensure();
			for (let e of i) a.schedule(e);
		}
		if (di = null, fi = null, this.#m() || this.#h()) {
			this.#v(r), this.#v(n);
			for (let [e, t] of this.#u) Ci(e, t);
		} else {
			this.#r.size === 0 && oi.delete(this), this.#c.clear(), this.#l.clear();
			for (let e of this.#e) e(this);
			this.#e.clear(), yi(r), yi(n), this.#a?.resolve();
		}
		var o = P;
		if (this.#o.length > 0) {
			let e = o ??= this;
			e.#o.push(...this.#o.filter((t) => !e.#o.includes(t)));
		}
		if (o !== null) {
			if (oi.add(o), T) for (let e of this.current.keys()) mi.add(e);
			o.#g();
		}
		Ar && !oi.has(this) && this.#y();
	}
	#_(e, t, n) {
		e.f ^= E;
		for (var r = e.first; r !== null;) {
			var i = r.f, a = (i & 96) != 0;
			if (!(a && i & 1024 || i & 8192 || this.#u.has(r)) && r.fn !== null) {
				a ? r.f ^= E : i & 4 ? t.push(r) : Ar && i & 16777224 ? n.push(r) : eo(r) && (i & 16 && this.#l.add(r), ao(r));
				var o = r.first;
				if (o !== null) {
					r = o;
					continue;
				}
			}
			for (; r !== null;) {
				var s = r.next;
				if (s !== null) {
					r = s;
					break;
				}
				r = r.parent;
			}
		}
	}
	#v(e) {
		for (var t = 0; t < e.length; t += 1) ii(e[t], this.#c, this.#l);
	}
	capture(e, t, n = !1) {
		e.v !== w && !this.previous.has(e) && this.previous.set(e, e.v), e.f & 8388608 || (this.current.set(e, [t, n]), F?.set(e, t)), this.is_fork || (e.v = t);
	}
	activate() {
		P = this;
	}
	deactivate() {
		P = null, F = null;
	}
	flush() {
		var e = T ? /* @__PURE__ */ new Set() : null;
		try {
			li = !0, P = this, this.#g();
		} finally {
			if (pi = 0, si = null, di = null, fi = null, li = !1, P = null, F = null, Ki.clear(), T) for (let t of e) t.updated = null;
		}
	}
	discard() {
		for (let e of this.#t) e(this);
		this.#t.clear(), this.#n.clear(), oi.delete(this);
	}
	register_created_effect(e) {
		this.#s.push(e);
	}
	#y() {
		for (let l of oi) {
			var e = l.id < this.id, t = [];
			for (let [r, [i, a]] of this.current) {
				if (l.current.has(r)) {
					var n = l.current.get(r)[0];
					if (e && i !== n) l.current.set(r, [i, a]);
					else continue;
				}
				t.push(r);
			}
			var r = [...l.current.keys()].filter((e) => !this.current.has(e));
			if (r.length === 0) e && l.discard();
			else if (t.length > 0) {
				if (T && Rr(l.#o.length === 0, "Batch has scheduled roots"), e) for (let e of this.#d) l.unskip_effect(e, (e) => {
					e.f & 4194320 ? l.schedule(e) : l.#v([e]);
				});
				l.activate();
				var i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Map();
				for (var o of t) bi(o, r, i, a);
				a = /* @__PURE__ */ new Map();
				var s = [...l.current.keys()].filter((e) => this.current.has(e) ? this.current.get(e)[0] !== e : !0);
				for (let e of this.#s) !(e.f & 155648) && xi(e, s, a) && (e.f & 4194320 ? (N(e, Ln), l.schedule(e)) : l.#c.add(e));
				if (l.#o.length > 0) {
					l.apply();
					for (var c of l.#o) l.#_(c, [], []);
					l.#o = [];
				}
				l.deactivate();
			}
		}
		for (let e of oi) e.#p.has(this) && (e.#p.delete(this), e.#p.size === 0 && !e.#m() && (e.activate(), e.#g()));
	}
	increment(e, t) {
		let n = this.#r.get(t) ?? 0;
		if (this.#r.set(t, n + 1), e) {
			let e = this.#i.get(t) ?? 0;
			this.#i.set(t, e + 1);
		}
	}
	decrement(e, t, n) {
		let r = this.#r.get(t) ?? 0;
		if (r === 1 ? this.#r.delete(t) : this.#r.set(t, r - 1), e) {
			let e = this.#i.get(t) ?? 0;
			e === 1 ? this.#i.delete(t) : this.#i.set(t, e - 1);
		}
		this.#f || n || (this.#f = !0, Yr(() => {
			this.#f = !1, this.flush();
		}));
	}
	transfer_effects(e, t) {
		for (let t of e) this.#c.add(t);
		for (let e of t) this.#l.add(e);
		e.clear(), t.clear();
	}
	oncommit(e) {
		this.#e.add(e);
	}
	ondiscard(e) {
		this.#t.add(e);
	}
	on_fork_commit(e) {
		this.#n.add(e);
	}
	run_fork_commit_callbacks() {
		for (let e of this.#n) e(this);
		this.#n.clear();
	}
	settled() {
		return (this.#a ??= In()).promise;
	}
	static ensure() {
		if (P === null) {
			let t = P = new e();
			li || (oi.add(P), ci || Yr(() => {
				P === t && t.flush();
			}));
		}
		return P;
	}
	apply() {
		if (!Ar || !this.is_fork && oi.size === 1) {
			F = null;
			return;
		}
		F = /* @__PURE__ */ new Map();
		for (let [e, [t]] of this.current) F.set(e, t);
		for (let n of oi) if (!(n === this || n.is_fork)) {
			var e = !1, t = !1;
			if (n.id < this.id) for (let [r, [, i]] of n.current) i || (e ||= this.current.has(r), t ||= !this.current.has(r));
			if (e && t) this.#p.add(n);
			else for (let [e, t] of n.previous) F.has(e) || F.set(e, t);
		}
	}
	schedule(e) {
		if (si = e, e.b?.is_pending && e.f & 16777228 && !(e.f & 32768)) {
			e.b.defer_effect(e);
			return;
		}
		for (var t = e; t.parent !== null;) {
			t = t.parent;
			var n = t.f;
			if (di !== null && t === q && (Ar || (W === null || !(W.f & 2)) && !ai)) return;
			if (n & 96) {
				if (!(n & 1024)) return;
				t.f ^= E;
			}
		}
		this.#o.push(t);
	}
};
function _i() {
	if (T) {
		var e = /* @__PURE__ */ new Map();
		for (let n of P.current.keys()) for (let [r, i] of n.updated ?? []) {
			var t = e.get(r);
			t || (t = {
				error: i.error,
				count: 0
			}, e.set(r, t)), t.count += i.count;
		}
		for (let t of e.values()) t.error && console.error(t.error);
	}
	try {
		or();
	} catch (e) {
		T && On(e, "stack", { value: "" }), Qr(e, si);
	}
}
var vi = null;
function yi(e) {
	var t = e.length;
	if (t !== 0) {
		for (var n = 0; n < t;) {
			var r = e[n++];
			if (!(r.f & 24576) && eo(r) && (vi = /* @__PURE__ */ new Set(), ao(r), r.deps === null && r.first === null && r.nodes === null && r.teardown === null && r.ac === null && Ia(r), vi?.size > 0)) {
				Ki.clear();
				for (let e of vi) {
					if (e.f & 24576) continue;
					let t = [e], n = e.parent;
					for (; n !== null;) vi.has(n) && (vi.delete(n), t.push(n)), n = n.parent;
					for (let e = t.length - 1; e >= 0; e--) {
						let n = t[e];
						n.f & 24576 || ao(n);
					}
				}
				vi.clear();
			}
		}
		vi = null;
	}
}
function bi(e, t, n, r) {
	if (!n.has(e) && (n.add(e), e.reactions !== null)) for (let i of e.reactions) {
		let e = i.f;
		e & 2 ? bi(i, t, n, r) : e & 4194320 && !(e & 2048) && xi(i, t, r) && (N(i, Ln), Si(i));
	}
}
function xi(e, t, n) {
	let r = n.get(e);
	if (r !== void 0) return r;
	if (e.deps !== null) for (let r of e.deps) {
		if (En.call(t, r)) return !0;
		if (r.f & 2 && xi(r, t, n)) return n.set(r, !0), !0;
	}
	return n.set(e, !1), !1;
}
function Si(e) {
	P.schedule(e);
}
function Ci(e, t) {
	if (!(e.f & 32 && e.f & 1024)) {
		e.f & 2048 ? t.d.push(e) : e.f & 4096 && t.m.push(e), N(e, E);
		for (var n = e.first; n !== null;) Ci(n, t), n = n.next;
	}
}
function wi(e) {
	N(e, E);
	for (var t = e.first; t !== null;) wi(t), t = t.next;
}
//#endregion
//#region node_modules/svelte/src/reactivity/create-subscriber.js
function Ti(e) {
	let t = 0, n = Xi(0), r;
	return T && j(n, "createSubscriber version"), () => {
		wa() && (Q(n), ka(() => (t === 0 && (r = co(() => e(() => ea(n)))), t += 1, () => {
			Yr(() => {
				--t, t === 0 && (r?.(), r = void 0, ea(n));
			});
		})));
	};
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/boundary.js
var Ei = Un | Wn;
function Di(e, t, n, r) {
	new Oi(e, t, n, r);
}
var Oi = class {
	parent;
	is_pending = !1;
	transform_error;
	#e;
	#t = D ? O : null;
	#n;
	#r;
	#i;
	#a = null;
	#o = null;
	#s = null;
	#c = null;
	#l = 0;
	#u = 0;
	#d = !1;
	#f = /* @__PURE__ */ new Set();
	#p = /* @__PURE__ */ new Set();
	#m = null;
	#h = Ti(() => (this.#m = Xi(this.#l), T && j(this.#m, "$effect.pending()"), () => {
		this.#m = null;
	}));
	constructor(e, t, n, r) {
		this.#e = e, this.#n = t, this.#r = (e) => {
			var t = q;
			t.b = this, t.f |= 128, n(e);
		}, this.parent = q.b, this.transform_error = r ?? this.parent?.transform_error ?? ((e) => e), this.#i = ja(() => {
			if (D) {
				let e = this.#t;
				Cr();
				let t = e.data === "[!";
				if (e.data.startsWith("[?")) {
					let t = JSON.parse(e.data.slice(2));
					this.#_(t);
				} else t ? this.#v() : this.#g();
			} else this.#y();
		}, Ei), D && (this.#e = O);
	}
	#g() {
		try {
			this.#a = H(() => this.#r(this.#e));
		} catch (e) {
			this.error(e);
		}
	}
	#_(e) {
		let t = this.#n.failed;
		t && (this.#s = H(() => {
			t(this.#e, () => e, () => () => {});
		}));
	}
	#v() {
		let e = this.#n.pending;
		e && (this.is_pending = !0, this.#o = H(() => e(this.#e)), Yr(() => {
			var e = this.#c = document.createDocumentFragment(), t = z();
			e.append(t), this.#a = this.#x(() => H(() => this.#r(t))), this.#u === 0 && (this.#e.before(e), this.#c = null, La(this.#o, () => {
				this.#o = null;
			}), this.#b(P));
		}));
	}
	#y() {
		try {
			if (this.is_pending = this.has_pending_snippet(), this.#u = 0, this.#l = 0, this.#a = H(() => {
				this.#r(this.#e);
			}), this.#u > 0) {
				var e = this.#c = document.createDocumentFragment();
				Va(this.#a, e);
				let t = this.#n.pending;
				this.#o = H(() => t(this.#e));
			} else this.#b(P);
		} catch (e) {
			this.error(e);
		}
	}
	#b(e) {
		this.is_pending = !1, e.transfer_effects(this.#f, this.#p);
	}
	defer_effect(e) {
		ii(e, this.#f, this.#p);
	}
	is_rendered() {
		return !this.is_pending && (!this.parent || this.parent.is_rendered());
	}
	has_pending_snippet() {
		return !!this.#n.pending;
	}
	#x(e) {
		var t = q, n = W, r = M;
		Ka(this.#i), K(this.#i), zr(this.#i.ctx);
		try {
			return gi.ensure(), e();
		} catch (e) {
			return Zr(e), null;
		} finally {
			Ka(t), K(n), zr(r);
		}
	}
	#S(e, t) {
		if (!this.has_pending_snippet()) {
			this.parent && this.parent.#S(e, t);
			return;
		}
		this.#u += e, this.#u === 0 && (this.#b(t), this.#o && La(this.#o, () => {
			this.#o = null;
		}), this.#c &&= (this.#e.before(this.#c), null));
	}
	update_pending_count(e, t) {
		this.#S(e, t), this.#l += e, !(!this.#m || this.#d) && (this.#d = !0, Yr(() => {
			this.#d = !1, this.#m && Qi(this.#m, this.#l);
		}));
	}
	get_effect_pending() {
		return this.#h(), Q(this.#m);
	}
	error(e) {
		if (!this.#n.onerror && !this.#n.failed) throw e;
		P?.is_fork ? (this.#a && P.skip_effect(this.#a), this.#o && P.skip_effect(this.#o), this.#s && P.skip_effect(this.#s), P.on_fork_commit(() => {
			this.#C(e);
		})) : this.#C(e);
	}
	#C(e) {
		this.#a &&= (U(this.#a), null), this.#o &&= (U(this.#o), null), this.#s &&= (U(this.#s), null), D && (k(this.#t), wr(), k(Tr()));
		var t = this.#n.onerror;
		let n = this.#n.failed;
		var r = !1, i = !1;
		let a = () => {
			if (r) {
				xr();
				return;
			}
			r = !0, i && dr(), this.#s !== null && La(this.#s, () => {
				this.#s = null;
			}), this.#x(() => {
				this.#y();
			});
		}, o = (e) => {
			try {
				i = !0, t?.(e, a), i = !1;
			} catch (e) {
				Qr(e, this.#i && this.#i.parent);
			}
			n && (this.#s = this.#x(() => {
				try {
					return H(() => {
						var t = q;
						t.b = this, t.f |= 128, n(this.#e, () => e, () => a);
					});
				} catch (e) {
					return Qr(e, this.#i.parent), null;
				}
			}));
		};
		Yr(() => {
			var t;
			try {
				t = this.transform_error(e);
			} catch (e) {
				Qr(e, this.#i && this.#i.parent);
				return;
			}
			typeof t == "object" && t && typeof t.then == "function" ? t.then(o, (e) => Qr(e, this.#i && this.#i.parent)) : o(t);
		});
	}
};
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/async.js
function ki(e, t, n, r) {
	let i = Kr() ? Fi : Ri;
	var a = e.filter((e) => !e.settled);
	if (n.length === 0 && a.length === 0) {
		r(t.map(i));
		return;
	}
	var o = q, s = Ai(), c = a.length === 1 ? a[0].promise : a.length > 1 ? Promise.all(a.map((e) => e.promise)) : null;
	function l(e) {
		s();
		try {
			r(e);
		} catch (e) {
			o.f & 16384 || Qr(e, o);
		}
		ji();
	}
	if (n.length === 0) {
		c.then(() => l(t.map(i)));
		return;
	}
	var u = Mi();
	function d() {
		Promise.all(n.map((e) => /* @__PURE__ */ Ii(e))).then((e) => l([...t.map(i), ...e])).catch((e) => Qr(e, o)).finally(() => u());
	}
	c ? c.then(() => {
		s(), d(), ji();
	}) : d();
}
function Ai() {
	var e = q, t = W, n = M, r = P;
	if (T) var i = Br;
	return function(a = !0) {
		Ka(e), K(t), zr(n), a && !(e.f & 16384) && (r?.activate(), r?.apply()), T && (Ni(null), Vr(i));
	};
}
function ji(e = !0) {
	Ka(null), K(null), zr(null), e && P?.deactivate(), T && (Ni(null), Vr(null));
}
function Mi() {
	var e = q, t = e.b, n = P, r = t.is_rendered();
	return t.update_pending_count(1, n), n.increment(r, e), (i = !1) => {
		t.update_pending_count(-1, n), n.decrement(r, e, i);
	};
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/deriveds.js
var I = null;
function Ni(e) {
	I = e;
}
var Pi = /* @__PURE__ */ new Set();
/* @__NO_SIDE_EFFECTS__ */
function Fi(e) {
	var t = 2 | Ln;
	q !== null && (q.f |= Wn);
	let n = {
		ctx: M,
		deps: null,
		effects: null,
		equals: Dr,
		f: t,
		fn: e,
		reactions: null,
		rv: 0,
		v: w,
		wv: 0,
		parent: q,
		ac: null
	};
	return T && Mr && (n.created = Ir("created at")), n;
}
/* @__NO_SIDE_EFFECTS__ */
function Ii(e, t, n) {
	let r = q;
	r === null && nr();
	var i = void 0, a = Xi(w);
	T && (a.label = t);
	var o = !W, s = /* @__PURE__ */ new Map();
	return Oa(() => {
		var t = q;
		T && (I = {
			effect: t,
			effect_deps: /* @__PURE__ */ new Set(),
			warned: !1
		});
		var c = In();
		i = c.promise;
		try {
			Promise.resolve(e()).then(c.resolve, c.reject).finally(ji);
		} catch (e) {
			c.reject(e), ji();
		}
		if (T) {
			if (I) {
				if (t.deps !== null) for (let e = 0; e < X; e += 1) I.effect_deps.add(t.deps[e]);
				if (Y !== null) for (let e = 0; e < Y.length; e += 1) I.effect_deps.add(Y[e]);
			}
			I = null;
		}
		var l = P;
		if (o) {
			if (t.f & 32768) var u = Mi();
			if (r.b.is_rendered()) s.get(l)?.reject(er), s.delete(l);
			else {
				for (let e of s.values()) e.reject(er);
				s.clear();
			}
			s.set(l, c);
		}
		let d = (e, r = void 0) => {
			if (T && (I = null), u && u(r === er), !(r === er || t.f & 16384)) {
				if (l.activate(), r) a.f |= Xn, Qi(a, r);
				else {
					a.f & 8388608 && (a.f ^= Xn), Qi(a, e);
					for (let [e, t] of s) {
						if (s.delete(e), e === l) break;
						t.reject(er);
					}
					T && n !== void 0 && (Pi.add(a), setTimeout(() => {
						Pi.has(a) && (hr(a.label, n), Pi.delete(a));
					}));
				}
				l.deactivate();
			}
		};
		c.promise.then(d, (e) => d(null, e || "unknown"));
	}), Ta(() => {
		for (let e of s.values()) e.reject(er);
	}), T && (a.f |= Yn), new Promise((e) => {
		function t(n) {
			function r() {
				n === i ? e(a) : t(i);
			}
			n.then(r, r);
		}
		t(i);
	});
}
/* @__NO_SIDE_EFFECTS__ */
function Li(e) {
	let t = /* @__PURE__ */ Fi(e);
	return Ar || qa(t), t;
}
/* @__NO_SIDE_EFFECTS__ */
function Ri(e) {
	let t = /* @__PURE__ */ Fi(e);
	return t.equals = kr, t;
}
function zi(e) {
	var t = e.effects;
	if (t !== null) {
		e.effects = null;
		for (var n = 0; n < t.length; n += 1) U(t[n]);
	}
}
var Bi = [];
function Vi(e) {
	var t, n = q, r = e.parent;
	if (!Wa && r !== null && r.f & 24576) return gr(), e.v;
	if (Ka(r), T) {
		let r = Gi;
		qi(/* @__PURE__ */ new Set());
		try {
			En.call(Bi, e) && rr(), Bi.push(e), e.f &= ~qn, zi(e), t = no(e);
		} finally {
			Ka(n), qi(r), Bi.pop();
		}
	} else try {
		e.f &= ~qn, zi(e), t = no(e);
	} finally {
		Ka(n);
	}
	return t;
}
function Hi(e) {
	var t = Vi(e);
	if (!e.equals(t) && (e.wv = $a(), (!P?.is_fork || e.deps === null) && (P === null ? e.v = t : P.capture(e, t, !0), e.deps === null))) {
		N(e, E);
		return;
	}
	Wa || (F === null ? ni(e) : (wa() || P?.is_fork) && F.set(e, t));
}
function Ui(e) {
	if (e.effects !== null) for (let t of e.effects) (t.teardown || t.ac) && (t.teardown?.(), t.ac?.abort(er), t.teardown = Pn, t.ac = null, io(t, 0), Na(t));
}
function Wi(e) {
	if (e.effects !== null) for (let t of e.effects) t.teardown && ao(t);
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/sources.js
var Gi = /* @__PURE__ */ new Set(), Ki = /* @__PURE__ */ new Map();
function qi(e) {
	Gi = e;
}
var Ji = !1;
function Yi() {
	Ji = !0;
}
function Xi(e, t) {
	var n = {
		f: 0,
		v: e,
		reactions: null,
		equals: Dr,
		rv: 0,
		wv: 0
	};
	return T && Mr && (n.created = t ?? Ir("created at"), n.updated = null, n.set_during_effect = !1, n.trace = null), n;
}
/* @__NO_SIDE_EFFECTS__ */
function L(e, t) {
	let n = Xi(e, t);
	return qa(n), n;
}
/* @__NO_SIDE_EFFECTS__ */
function Zi(e, t = !1, n = !0) {
	let r = Xi(e);
	return t || (r.equals = kr), jr && n && M !== null && M.l !== null && (M.l.s ??= []).push(r), r;
}
function R(e, t, n = !1) {
	W !== null && (!G || W.f & 131072) && Kr() && W.f & 4325394 && (J === null || !En.call(J, e)) && ur();
	let r = n ? ra(t) : t;
	return T && Pr(r, e.label), Qi(e, r, fi);
}
function Qi(e, t, n = null) {
	if (!e.equals(t)) {
		Ki.set(e, Wa ? t : e.v);
		var r = gi.ensure();
		if (r.capture(e, t), T) {
			if (Mr || q !== null) {
				e.updated ??= /* @__PURE__ */ new Map();
				let t = (e.updated.get("")?.count ?? 0) + 1;
				if (e.updated.set("", {
					error: null,
					count: t
				}), Mr || t > 5) {
					let t = Ir("updated at");
					if (t !== null) {
						let n = e.updated.get(t.stack);
						n || (n = {
							error: t,
							count: 0
						}, e.updated.set(t.stack, n)), n.count++;
					}
				}
			}
			q !== null && (e.set_during_effect = !0);
		}
		if (e.f & 2) {
			let t = e;
			e.f & 2048 && Vi(t), F === null && ni(t);
		}
		e.wv = $a(), ta(e, Ln, n), Kr() && q !== null && q.f & 1024 && !(q.f & 96) && (Z === null ? Ja([e]) : Z.push(e)), !r.is_fork && Gi.size > 0 && !Ji && $i();
	}
	return t;
}
function $i() {
	Ji = !1;
	for (let e of Gi) e.f & 1024 && N(e, Rn), eo(e) && ao(e);
	Gi.clear();
}
function ea(e) {
	R(e, e.v + 1);
}
function ta(e, t, n) {
	var r = e.reactions;
	if (r !== null) for (var i = Kr(), a = r.length, o = 0; o < a; o++) {
		var s = r[o], c = s.f;
		if (!(!i && s === q)) {
			if (T && c & 131072) {
				Gi.add(s);
				continue;
			}
			var l = (c & Ln) === 0;
			if (l && N(s, t), c & 2) {
				var u = s;
				F?.delete(u), c & 65536 || (c & 512 && (q === null || !(q.f & 2097152)) && (s.f |= qn), ta(u, Rn, n));
			} else if (l) {
				var d = s;
				c & 16 && vi !== null && vi.add(d), n === null ? Si(d) : n.push(d);
			}
		}
	}
}
//#endregion
//#region node_modules/svelte/src/internal/client/proxy.js
var na = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/;
function ra(e) {
	if (typeof e != "object" || !e || Zn in e) return e;
	let t = Mn(e);
	if (t !== An && t !== jn) return e;
	var n = /* @__PURE__ */ new Map(), r = wn(e), i = /* @__PURE__ */ L(0), a = T && Mr ? Ir("created at") : null, o = Za, s = (e) => {
		if (Za === o) return e();
		var t = W, n = Za;
		K(null), Qa(o);
		var r = e();
		return K(t), Qa(n), r;
	};
	r && (n.set("length", /* @__PURE__ */ L(e.length, a)), T && (e = sa(e)));
	var c = "";
	let l = !1;
	function u(e) {
		if (!l) {
			l = !0, c = e, j(i, `${c} version`);
			for (let [e, t] of n) j(t, ia(c, e));
			l = !1;
		}
	}
	return new Proxy(e, {
		defineProperty(e, t, r) {
			(!("value" in r) || r.configurable === !1 || r.enumerable === !1 || r.writable === !1) && cr();
			var i = n.get(t);
			return i === void 0 ? s(() => {
				var e = /* @__PURE__ */ L(r.value, a);
				return n.set(t, e), T && typeof t == "string" && j(e, ia(c, t)), e;
			}) : R(i, r.value, !0), !0;
		},
		deleteProperty(e, t) {
			var r = n.get(t);
			if (r === void 0) {
				if (t in e) {
					let e = s(() => /* @__PURE__ */ L(w, a));
					n.set(t, e), ea(i), T && j(e, ia(c, t));
				}
			} else R(r, w), ea(i);
			return !0;
		},
		get(t, r, i) {
			if (r === Zn) return e;
			if (T && r === Qn) return u;
			var o = n.get(r), l = r in t;
			if (o === void 0 && (!l || kn(t, r)?.writable) && (o = s(() => {
				var e = /* @__PURE__ */ L(ra(l ? t[r] : w), a);
				return T && j(e, ia(c, r)), e;
			}), n.set(r, o)), o !== void 0) {
				var d = Q(o);
				return d === w ? void 0 : d;
			}
			return Reflect.get(t, r, i);
		},
		getOwnPropertyDescriptor(e, t) {
			var r = Reflect.getOwnPropertyDescriptor(e, t);
			if (r && "value" in r) {
				var i = n.get(t);
				i && (r.value = Q(i));
			} else if (r === void 0) {
				var a = n.get(t), o = a?.v;
				if (a !== void 0 && o !== w) return {
					enumerable: !0,
					configurable: !0,
					value: o,
					writable: !0
				};
			}
			return r;
		},
		has(e, t) {
			if (t === Zn) return !0;
			var r = n.get(t), i = r !== void 0 && r.v !== w || Reflect.has(e, t);
			return (r !== void 0 || q !== null && (!i || kn(e, t)?.writable)) && (r === void 0 && (r = s(() => {
				var n = /* @__PURE__ */ L(i ? ra(e[t]) : w, a);
				return T && j(n, ia(c, t)), n;
			}), n.set(t, r)), Q(r) === w) ? !1 : i;
		},
		set(e, t, o, l) {
			var u = n.get(t), d = t in e;
			if (r && t === "length") for (var f = o; f < u.v; f += 1) {
				var p = n.get(f + "");
				p === void 0 ? f in e && (p = s(() => /* @__PURE__ */ L(w, a)), n.set(f + "", p), T && j(p, ia(c, f))) : R(p, w);
			}
			if (u === void 0) (!d || kn(e, t)?.writable) && (u = s(() => /* @__PURE__ */ L(void 0, a)), T && j(u, ia(c, t)), R(u, ra(o)), n.set(t, u));
			else {
				d = u.v !== w;
				var m = s(() => ra(o));
				R(u, m);
			}
			var h = Reflect.getOwnPropertyDescriptor(e, t);
			if (h?.set && h.set.call(l, o), !d) {
				if (r && typeof t == "string") {
					var g = n.get("length"), _ = Number(t);
					Number.isInteger(_) && _ >= g.v && R(g, _ + 1);
				}
				ea(i);
			}
			return !0;
		},
		ownKeys(e) {
			Q(i);
			var t = Reflect.ownKeys(e).filter((e) => {
				var t = n.get(e);
				return t === void 0 || t.v !== w;
			});
			for (var [r, a] of n) a.v !== w && !(r in e) && t.push(r);
			return t;
		},
		setPrototypeOf() {
			lr();
		}
	});
}
function ia(e, t) {
	return typeof t == "symbol" ? `${e}[Symbol(${t.description ?? ""})]` : na.test(t) ? `${e}.${t}` : /^\d+$/.test(t) ? `${e}[${t}]` : `${e}['${t}']`;
}
function aa(e) {
	try {
		if (typeof e == "object" && e && Zn in e) return e[Zn];
	} catch {}
	return e;
}
var oa = new Set([
	"copyWithin",
	"fill",
	"pop",
	"push",
	"reverse",
	"shift",
	"sort",
	"splice",
	"unshift"
]);
function sa(e) {
	return new Proxy(e, { get(e, t, n) {
		var r = Reflect.get(e, t, n);
		return oa.has(t) ? function(...e) {
			Yi();
			var t = r.apply(this, e);
			return $i(), t;
		} : r;
	} });
}
//#endregion
//#region node_modules/svelte/src/internal/client/dev/equality.js
function ca() {
	let e = Array.prototype, t = Array.__svelte_cleanup;
	t && t();
	let { indexOf: n, lastIndexOf: r, includes: i } = e;
	e.indexOf = function(e, t) {
		let r = n.call(this, e, t);
		if (r === -1) {
			for (let n = t ?? 0; n < this.length; n += 1) if (aa(this[n]) === e) {
				yr("array.indexOf(...)");
				break;
			}
		}
		return r;
	}, e.lastIndexOf = function(e, t) {
		let n = r.call(this, e, t ?? this.length - 1);
		if (n === -1) {
			for (let n = 0; n <= (t ?? this.length - 1); n += 1) if (aa(this[n]) === e) {
				yr("array.lastIndexOf(...)");
				break;
			}
		}
		return n;
	}, e.includes = function(e, t) {
		let n = i.call(this, e, t);
		if (!n) {
			for (let t = 0; t < this.length; t += 1) if (aa(this[t]) === e) {
				yr("array.includes(...)");
				break;
			}
		}
		return n;
	}, Array.__svelte_cleanup = () => {
		e.indexOf = n, e.lastIndexOf = r, e.includes = i;
	};
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/operations.js
var la, ua, da, fa;
function pa() {
	if (la === void 0) {
		la = window, ua = /Firefox/.test(navigator.userAgent);
		var e = Element.prototype, t = Node.prototype, n = Text.prototype;
		da = kn(t, "firstChild").get, fa = kn(t, "nextSibling").get, Nn(e) && (e.__click = void 0, e.__className = void 0, e.__attributes = null, e.__style = void 0, e.__e = void 0), Nn(n) && (n.__t = void 0), T && (e.__svelte_meta = null, ca());
	}
}
function z(e = "") {
	return document.createTextNode(e);
}
/* @__NO_SIDE_EFFECTS__ */
function ma(e) {
	return da.call(e);
}
/* @__NO_SIDE_EFFECTS__ */
function ha(e) {
	return fa.call(e);
}
function B(e, t) {
	if (!D) return /* @__PURE__ */ ma(e);
	var n = /* @__PURE__ */ ma(O);
	if (n === null) n = O.appendChild(z());
	else if (t && n.nodeType !== 3) {
		var r = z();
		return n?.before(r), k(r), r;
	}
	return t && ba(n), k(n), n;
}
function ga(e, t = !1) {
	if (!D) {
		var n = /* @__PURE__ */ ma(e);
		return n instanceof Comment && n.data === "" ? /* @__PURE__ */ ha(n) : n;
	}
	if (t) {
		if (O?.nodeType !== 3) {
			var r = z();
			return O?.before(r), k(r), r;
		}
		ba(O);
	}
	return O;
}
function V(e, t = 1, n = !1) {
	let r = D ? O : e;
	for (var i; t--;) i = r, r = /* @__PURE__ */ ha(r);
	if (!D) return r;
	if (n) {
		if (r?.nodeType !== 3) {
			var a = z();
			return r === null ? i?.after(a) : r.before(a), k(a), a;
		}
		ba(r);
	}
	return k(r), r;
}
function _a(e) {
	e.textContent = "";
}
function va() {
	return !Ar || vi !== null ? !1 : (q.f & Vn) !== 0;
}
function ya(e, t, n) {
	let r = n ? { is: n } : void 0;
	return document.createElementNS(t ?? "http://www.w3.org/1999/xhtml", e, r);
}
function ba(e) {
	if (e.nodeValue.length < 65536) return;
	let t = e.nextSibling;
	for (; t !== null && t.nodeType === 3;) t.remove(), e.nodeValue += t.nodeValue, t = e.nextSibling;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/bindings/shared.js
function xa(e) {
	var t = W, n = q;
	K(null), Ka(null);
	try {
		return e();
	} finally {
		K(t), Ka(n);
	}
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/effects.js
function Sa(e, t) {
	var n = t.last;
	n === null ? t.last = t.first = e : (n.next = e, e.prev = n, t.last = e);
}
function Ca(e, t) {
	var n = q;
	if (T) for (; n !== null && n.f & 131072;) n = n.parent;
	n !== null && n.f & 8192 && (e |= zn);
	var r = {
		ctx: M,
		deps: null,
		nodes: null,
		f: e | Ln | 512,
		first: null,
		fn: t,
		last: null,
		next: null,
		parent: n,
		b: n && n.b,
		prev: null,
		teardown: null,
		wv: 0,
		ac: null
	};
	T && (r.component_function = Hr), P?.register_created_effect(r);
	var i = r;
	if (e & 4) di === null ? gi.ensure().schedule(r) : di.push(r);
	else if (t !== null) {
		try {
			ao(r);
		} catch (e) {
			throw U(r), e;
		}
		i.deps === null && i.teardown === null && i.nodes === null && i.first === i.last && !(i.f & 524288) && (i = i.first, e & 16 && e & 65536 && i !== null && (i.f |= Un));
	}
	if (i !== null && (i.parent = n, n !== null && Sa(i, n), W !== null && W.f & 2 && !(e & 64))) {
		var a = W;
		(a.effects ??= []).push(i);
	}
	return r;
}
function wa() {
	return W !== null && !G;
}
function Ta(e) {
	let t = Ca(8, null);
	return N(t, E), t.teardown = e, t;
}
function Ea(e) {
	return Ca(4 | Gn, e);
}
function Da(e) {
	gi.ensure();
	let t = Ca(64 | Wn, e);
	return (e = {}) => new Promise((n) => {
		e.outro ? La(t, () => {
			U(t), n(void 0);
		}) : (U(t), n(void 0));
	});
}
function Oa(e) {
	return Ca(Yn | Wn, e);
}
function ka(e, t = 0) {
	return Ca(8 | t, e);
}
function Aa(e, t = [], n = [], r = []) {
	ki(r, t, n, (t) => {
		Ca(8, () => e(...t.map(Q)));
	});
}
function ja(e, t = 0) {
	var n = Ca(16 | t, e);
	return T && (n.dev_stack = Br), n;
}
function H(e) {
	return Ca(32 | Wn, e);
}
function Ma(e) {
	var t = e.teardown;
	if (t !== null) {
		let e = Wa, n = W;
		Ga(!0), K(null);
		try {
			t.call(null);
		} finally {
			Ga(e), K(n);
		}
	}
}
function Na(e, t = !1) {
	var n = e.first;
	for (e.first = e.last = null; n !== null;) {
		let e = n.ac;
		e !== null && xa(() => {
			e.abort(er);
		});
		var r = n.next;
		n.f & 64 ? n.parent = null : U(n, t), n = r;
	}
}
function Pa(e) {
	for (var t = e.first; t !== null;) {
		var n = t.next;
		t.f & 32 || U(t), t = n;
	}
}
function U(e, t = !0) {
	var n = !1;
	(t || e.f & 262144) && e.nodes !== null && e.nodes.end !== null && (Fa(e.nodes.start, e.nodes.end), n = !0), N(e, Hn), Na(e, t && !n), io(e, 0);
	var r = e.nodes && e.nodes.t;
	if (r !== null) for (let e of r) e.stop();
	Ma(e), e.f ^= Hn, e.f |= Bn;
	var i = e.parent;
	i !== null && i.first !== null && Ia(e), T && (e.component_function = null), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null;
}
function Fa(e, t) {
	for (; e !== null;) {
		var n = e === t ? null : /* @__PURE__ */ ha(e);
		e.remove(), e = n;
	}
}
function Ia(e) {
	var t = e.parent, n = e.prev, r = e.next;
	n !== null && (n.next = r), r !== null && (r.prev = n), t !== null && (t.first === e && (t.first = r), t.last === e && (t.last = n));
}
function La(e, t, n = !0) {
	var r = [];
	Ra(e, r, !0);
	var i = () => {
		n && U(e), t && t();
	}, a = r.length;
	if (a > 0) {
		var o = () => --a || i();
		for (var s of r) s.out(o);
	} else i();
}
function Ra(e, t, n) {
	if (!(e.f & 8192)) {
		e.f ^= zn;
		var r = e.nodes && e.nodes.t;
		if (r !== null) for (let e of r) (e.is_global || n) && t.push(e);
		for (var i = e.first; i !== null;) {
			var a = i.next;
			if (!(i.f & 64)) {
				var o = (i.f & 65536) != 0 || (i.f & 32) != 0 && (e.f & 16) != 0;
				Ra(i, t, o ? n : !1);
			}
			i = a;
		}
	}
}
function za(e) {
	Ba(e, !0);
}
function Ba(e, t) {
	if (e.f & 8192) {
		e.f ^= zn, e.f & 1024 || (N(e, Ln), gi.ensure().schedule(e));
		for (var n = e.first; n !== null;) {
			var r = n.next, i = (n.f & 65536) != 0 || (n.f & 32) != 0;
			Ba(n, i ? t : !1), n = r;
		}
		var a = e.nodes && e.nodes.t;
		if (a !== null) for (let e of a) (e.is_global || t) && e.in();
	}
}
function Va(e, t) {
	if (e.nodes) for (var n = e.nodes.start, r = e.nodes.end; n !== null;) {
		var i = n === r ? null : /* @__PURE__ */ ha(n);
		t.append(n), n = i;
	}
}
//#endregion
//#region node_modules/svelte/src/internal/client/legacy.js
var Ha = null, Ua = !1, Wa = !1;
function Ga(e) {
	Wa = e;
}
var W = null, G = !1;
function K(e) {
	W = e;
}
var q = null;
function Ka(e) {
	q = e;
}
var J = null;
function qa(e) {
	W !== null && (!Ar || W.f & 2) && (J === null ? J = [e] : J.push(e));
}
var Y = null, X = 0, Z = null;
function Ja(e) {
	Z = e;
}
var Ya = 1, Xa = 0, Za = Xa;
function Qa(e) {
	Za = e;
}
function $a() {
	return ++Ya;
}
function eo(e) {
	var t = e.f;
	if (t & 2048) return !0;
	if (t & 2 && (e.f &= ~qn), t & 4096) {
		for (var n = e.deps, r = n.length, i = 0; i < r; i++) {
			var a = n[i];
			if (eo(a) && Hi(a), a.wv > e.wv) return !0;
		}
		t & 512 && F === null && N(e, E);
	}
	return !1;
}
function to(e, t, n = !0) {
	var r = e.reactions;
	if (r !== null && !(!Ar && J !== null && En.call(J, e))) for (var i = 0; i < r.length; i++) {
		var a = r[i];
		a.f & 2 ? to(a, t, !1) : t === a && (n ? N(a, Ln) : a.f & 1024 && N(a, Rn), Si(a));
	}
}
function no(e) {
	var t = Y, n = X, r = Z, i = W, a = J, o = M, s = G, c = Za, l = e.f;
	Y = null, X = 0, Z = null, W = l & 96 ? null : e, J = null, zr(e.ctx), G = !1, Za = ++Xa, e.ac !== null && (xa(() => {
		e.ac.abort(er);
	}), e.ac = null);
	try {
		e.f |= Jn;
		var u = e.fn, d = u();
		e.f |= Vn;
		var f = e.deps, p = P?.is_fork;
		if (Y !== null) {
			var m;
			if (p || io(e, X), f !== null && X > 0) for (f.length = X + Y.length, m = 0; m < Y.length; m++) f[X + m] = Y[m];
			else e.deps = f = Y;
			if (wa() && e.f & 512) for (m = X; m < f.length; m++) (f[m].reactions ??= []).push(e);
		} else !p && f !== null && X < f.length && (io(e, X), f.length = X);
		if (Kr() && Z !== null && !G && f !== null && !(e.f & 6146)) for (m = 0; m < Z.length; m++) to(Z[m], e);
		if (i !== null && i !== e) {
			if (Xa++, i.deps !== null) for (let e = 0; e < n; e += 1) i.deps[e].rv = Xa;
			if (t !== null) for (let e of t) e.rv = Xa;
			Z !== null && (r === null ? r = Z : r.push(...Z));
		}
		return e.f & 8388608 && (e.f ^= Xn), d;
	} catch (e) {
		return Zr(e);
	} finally {
		e.f ^= Jn, Y = t, X = n, Z = r, W = i, J = a, zr(o), G = s, Za = c;
	}
}
function ro(e, t) {
	let n = t.reactions;
	if (n !== null) {
		var r = Tn.call(n, e);
		if (r !== -1) {
			var i = n.length - 1;
			i === 0 ? n = t.reactions = null : (n[r] = n[i], n.pop());
		}
	}
	if (n === null && t.f & 2 && (Y === null || !En.call(Y, t))) {
		var a = t;
		a.f & 512 && (a.f ^= 512, a.f &= ~qn), a.v !== w && ni(a), Ui(a), io(a, 0);
	}
}
function io(e, t) {
	var n = e.deps;
	if (n !== null) for (var r = t; r < n.length; r++) ro(e, n[r]);
}
function ao(e) {
	var t = e.f;
	if (!(t & 16384)) {
		N(e, E);
		var n = q, r = Ua;
		if (q = e, Ua = !0, T) {
			var i = Hr;
			Ur(e.component_function);
			var a = Br;
			Vr(e.dev_stack ?? Br);
		}
		try {
			t & 16777232 ? Pa(e) : Na(e), Ma(e);
			var o = no(e);
			if (e.teardown = typeof o == "function" ? o : null, e.wv = Ya, T && Mr && e.f & 2048 && e.deps !== null) for (var s of e.deps) s.set_during_effect &&= (s.wv = $a(), !1);
		} finally {
			Ua = r, q = n, T && (Ur(i), Vr(a));
		}
	}
}
function Q(e) {
	var t = (e.f & 2) != 0;
	if (Ha?.add(e), W !== null && !G && !(q !== null && q.f & 16384) && (J === null || !En.call(J, e))) {
		var n = W.deps;
		if (W.f & 2097152) e.rv < Xa && (e.rv = Xa, Y === null && n !== null && n[X] === e ? X++ : Y === null ? Y = [e] : Y.push(e));
		else {
			(W.deps ??= []).push(e);
			var r = e.reactions;
			r === null ? e.reactions = [W] : En.call(r, W) || r.push(W);
		}
	}
	if (T) {
		if (!G && I && !I.warned && !(I.effect.f & 2097152) && !I.effect_deps.has(e)) {
			I.warned = !0, mr(e.label);
			var i = Ir("traced at");
			i && console.warn(i);
		}
		if (Pi.delete(e), Mr && !G && Nr !== null && W !== null && Nr.reaction === W) {
			if (e.trace) e.trace();
			else if (i = Ir("traced at"), i) {
				var a = Nr.entries.get(e);
				a === void 0 && (a = { traces: [] }, Nr.entries.set(e, a));
				var o = a.traces[a.traces.length - 1];
				i.stack !== o?.stack && a.traces.push(i);
			}
		}
	}
	if (Wa && Ki.has(e)) return Ki.get(e);
	if (t) {
		var s = e;
		if (Wa) {
			var c = s.v;
			return (!(s.f & 1024) && s.reactions !== null || so(s)) && (c = Vi(s)), Ki.set(s, c), c;
		}
		var l = (s.f & 512) == 0 && !G && W !== null && (Ua || (W.f & 512) != 0), u = (s.f & Vn) === 0;
		eo(s) && (l && (s.f |= 512), Hi(s)), l && !u && (Wi(s), oo(s));
	}
	if (F?.has(e)) return F.get(e);
	if (e.f & 8388608) throw e.v;
	return e.v;
}
function oo(e) {
	if (e.f |= 512, e.deps !== null) for (let t of e.deps) (t.reactions ??= []).push(e), t.f & 2 && !(t.f & 512) && (Wi(t), oo(t));
}
function so(e) {
	if (e.v === w) return !0;
	if (e.deps === null) return !1;
	for (let t of e.deps) if (Ki.has(t) || t.f & 2 && so(t)) return !0;
	return !1;
}
function co(e) {
	var t = G;
	try {
		return G = !0, e();
	} finally {
		G = t;
	}
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/events.js
var lo = Symbol("events"), uo = /* @__PURE__ */ new Set(), fo = /* @__PURE__ */ new Set();
function po(e, t, n) {
	(t[lo] ??= {})[e] = n;
}
function mo(e) {
	for (var t = 0; t < e.length; t++) uo.add(e[t]);
	for (var n of fo) n(e);
}
var ho = null;
function go(e) {
	var t = this, n = t.ownerDocument, r = e.type, i = e.composedPath?.() || [], a = i[0] || e.target;
	ho = e;
	var o = 0, s = ho === e && e[lo];
	if (s) {
		var c = i.indexOf(s);
		if (c !== -1 && (t === document || t === window)) {
			e[lo] = t;
			return;
		}
		var l = i.indexOf(t);
		if (l === -1) return;
		c <= l && (o = c);
	}
	if (a = i[o] || e.target, a !== t) {
		On(e, "currentTarget", {
			configurable: !0,
			get() {
				return a || n;
			}
		});
		var u = W, d = q;
		K(null), Ka(null);
		try {
			for (var f, p = []; a !== null;) {
				var m = a.assignedSlot || a.parentNode || a.host || null;
				try {
					var h = a[lo]?.[r];
					h != null && (!a.disabled || e.target === a) && h.call(a, e);
				} catch (e) {
					f ? p.push(e) : f = e;
				}
				if (e.cancelBubble || m === t || m === null) break;
				a = m;
			}
			if (f) {
				for (let e of p) queueMicrotask(() => {
					throw e;
				});
				throw f;
			}
		} finally {
			e[lo] = t, delete e.currentTarget, K(u), Ka(d);
		}
	}
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/reconciler.js
var _o = globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", { createHTML: (e) => e });
function vo(e) {
	return _o?.createHTML(e) ?? e;
}
function yo(e) {
	var t = ya("template");
	return t.innerHTML = vo(e.replaceAll("<!>", "<!---->")), t.content;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/template.js
function bo(e, t) {
	var n = q;
	n.nodes === null && (n.nodes = {
		start: e,
		end: t,
		a: null,
		t: null
	});
}
/* @__NO_SIDE_EFFECTS__ */
function xo(e, t) {
	var n = (t & 1) != 0, r = (t & 2) != 0, i, a = !e.startsWith("<!>");
	return () => {
		if (D) return bo(O, null), O;
		i === void 0 && (i = yo(a ? e : "<!>" + e), n || (i = /* @__PURE__ */ ma(i)));
		var t = r || ua ? document.importNode(i, !0) : i.cloneNode(!0);
		if (n) {
			var o = /* @__PURE__ */ ma(t), s = t.lastChild;
			bo(o, s);
		} else bo(t, t);
		return t;
	};
}
function So() {
	if (D) return bo(O, null), O;
	var e = document.createDocumentFragment(), t = document.createComment(""), n = z();
	return e.append(t, n), bo(t, n), e;
}
function Co(e, t) {
	if (D) {
		var n = q;
		(!(n.f & 32768) || n.nodes.end === null) && (n.nodes.end = O), Cr();
		return;
	}
	e !== null && e.before(t);
}
[.../* @__PURE__ */ "allowfullscreen.async.autofocus.autoplay.checked.controls.default.disabled.formnovalidate.indeterminate.inert.ismap.loop.multiple.muted.nomodule.novalidate.open.playsinline.readonly.required.reversed.seamless.selected.webkitdirectory.defer.disablepictureinpicture.disableremoteplayback".split(".")];
var wo = ["touchstart", "touchmove"];
function To(e) {
	return wo.includes(e);
}
function $(e, t) {
	var n = t == null ? "" : typeof t == "object" ? `${t}` : t;
	n !== (e.__t ??= e.nodeValue) && (e.__t = n, e.nodeValue = `${n}`);
}
function Eo(e, t) {
	return Oo(e, t);
}
var Do = /* @__PURE__ */ new Map();
function Oo(e, { target: t, anchor: n, props: r = {}, events: i, context: a, intro: o = !0, transformError: s }) {
	pa();
	var c = void 0, l = Da(() => {
		var o = n ?? t.appendChild(z());
		Di(o, { pending: () => {} }, (t) => {
			Wr({});
			var n = M;
			if (a && (n.c = a), i && (r.$$events = i), D && bo(t, null), c = e(t, r) || {}, D && (q.nodes.end = O, O === null || O.nodeType !== 8 || O.data !== "]")) throw _r(), xn;
			Gr();
		}, s);
		var l = /* @__PURE__ */ new Set(), u = (e) => {
			for (var n = 0; n < e.length; n++) {
				var r = e[n];
				if (!l.has(r)) {
					l.add(r);
					var i = To(r);
					for (let e of [t, document]) {
						var a = Do.get(e);
						a === void 0 && (a = /* @__PURE__ */ new Map(), Do.set(e, a));
						var o = a.get(r);
						o === void 0 ? (e.addEventListener(r, go, { passive: i }), a.set(r, 1)) : a.set(r, o + 1);
					}
				}
			}
		};
		return u(Dn(uo)), fo.add(u), () => {
			for (var e of l) for (let n of [t, document]) {
				var r = Do.get(n), i = r.get(e);
				--i == 0 ? (n.removeEventListener(e, go), r.delete(e), r.size === 0 && Do.delete(n)) : r.set(e, i);
			}
			fo.delete(u), o !== n && o.parentNode?.removeChild(o);
		};
	});
	return ko.set(c, l), c;
}
var ko = /* @__PURE__ */ new WeakMap();
function Ao(e, t) {
	let n = ko.get(e);
	return n ? (ko.delete(e), n(t)) : (T && (Zn in e ? br() : vr()), Promise.resolve());
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/branches.js
var jo = class {
	anchor;
	#e = /* @__PURE__ */ new Map();
	#t = /* @__PURE__ */ new Map();
	#n = /* @__PURE__ */ new Map();
	#r = /* @__PURE__ */ new Set();
	#i = !0;
	constructor(e, t = !0) {
		this.anchor = e, this.#i = t;
	}
	#a = (e) => {
		if (this.#e.has(e)) {
			var t = this.#e.get(e), n = this.#t.get(t);
			if (n) za(n), this.#r.delete(t);
			else {
				var r = this.#n.get(t);
				r && (this.#t.set(t, r.effect), this.#n.delete(t), T && (r.fragment.lastChild[$n] = this.anchor), r.fragment.lastChild.remove(), this.anchor.before(r.fragment), n = r.effect);
			}
			for (let [t, n] of this.#e) {
				if (this.#e.delete(t), t === e) break;
				let r = this.#n.get(n);
				r && (U(r.effect), this.#n.delete(n));
			}
			for (let [e, r] of this.#t) {
				if (e === t || this.#r.has(e)) continue;
				let i = () => {
					if (Array.from(this.#e.values()).includes(e)) {
						var t = document.createDocumentFragment();
						Va(r, t), t.append(z()), this.#n.set(e, {
							effect: r,
							fragment: t
						});
					} else U(r);
					this.#r.delete(e), this.#t.delete(e);
				};
				this.#i || !n ? (this.#r.add(e), La(r, i, !1)) : i();
			}
		}
	};
	#o = (e) => {
		this.#e.delete(e);
		let t = Array.from(this.#e.values());
		for (let [e, n] of this.#n) t.includes(e) || (U(n.effect), this.#n.delete(e));
	};
	ensure(e, t) {
		var n = P, r = va();
		if (t && !this.#t.has(e) && !this.#n.has(e)) if (r) {
			var i = document.createDocumentFragment(), a = z();
			i.append(a), this.#n.set(e, {
				effect: H(() => t(a)),
				fragment: i
			});
		} else this.#t.set(e, H(() => t(this.anchor)));
		if (this.#e.set(n, e), r) {
			for (let [t, r] of this.#t) t === e ? n.unskip_effect(r) : n.skip_effect(r);
			for (let [t, r] of this.#n) t === e ? n.unskip_effect(r.effect) : n.skip_effect(r.effect);
			n.oncommit(this.#a), n.ondiscard(this.#o);
		} else D && (this.anchor = O), this.#a(n);
	}
};
//#endregion
//#region node_modules/svelte/src/index-client.js
if (T) {
	function e(e) {
		if (!(e in globalThis)) {
			let t;
			Object.defineProperty(globalThis, e, {
				configurable: !0,
				get: () => {
					if (t !== void 0) return t;
					sr(e);
				},
				set: (e) => {
					t = e;
				}
			});
		}
	}
	e("$state"), e("$effect"), e("$derived"), e("$inspect"), e("$props"), e("$bindable");
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/if.js
function Mo(e, t, n = !1) {
	var r;
	D && (r = O, Cr());
	var i = new jo(e), a = n ? Un : 0;
	function o(e, t) {
		if (D) {
			var n = Er(r);
			if (e !== parseInt(n.substring(1))) {
				var a = Tr();
				k(a), i.anchor = a, Sr(!1), i.ensure(e, t), Sr(!0);
				return;
			}
		}
		i.ensure(e, t);
	}
	ja(() => {
		var e = !1;
		t((t, n = 0) => {
			e = !0, o(n, t);
		}), e || o(-1, null);
	}, a);
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/each.js
function No(e, t, n) {
	for (var r = [], i = t.length, a, o = t.length, s = 0; s < i; s++) {
		let n = t[s];
		La(n, () => {
			if (a) {
				if (a.pending.delete(n), a.done.add(n), a.pending.size === 0) {
					var t = e.outrogroups;
					Po(e, Dn(a.done)), t.delete(a), t.size === 0 && (e.outrogroups = null);
				}
			} else --o;
		}, !1);
	}
	if (o === 0) {
		var c = r.length === 0 && n !== null;
		if (c) {
			var l = n, u = l.parentNode;
			_a(u), u.append(l), e.items.clear();
		}
		Po(e, t, !c);
	} else a = {
		pending: new Set(t),
		done: /* @__PURE__ */ new Set()
	}, (e.outrogroups ??= /* @__PURE__ */ new Set()).add(a);
}
function Po(e, t, n = !0) {
	var r;
	if (e.pending.size > 0) {
		r = /* @__PURE__ */ new Set();
		for (let t of e.pending.values()) for (let n of t) r.add(e.items.get(n).e);
	}
	for (var i = 0; i < t.length; i++) {
		var a = t[i];
		r?.has(a) ? (a.f |= Kn, Va(a, document.createDocumentFragment())) : U(t[i], n);
	}
}
var Fo;
function Io(e, t, n, r, i, a = null) {
	var o = e, s = /* @__PURE__ */ new Map();
	if (t & 4) {
		var c = e;
		o = D ? k(/* @__PURE__ */ ma(c)) : c.appendChild(z());
	}
	D && Cr();
	var l = null, u = /* @__PURE__ */ Ri(() => {
		var e = n();
		return wn(e) ? e : e == null ? [] : Dn(e);
	});
	T && j(u, "{#each ...}");
	var d, f = /* @__PURE__ */ new Map(), p = !0;
	function m(e) {
		g.effect.f & 16384 || (g.pending.delete(e), g.fallback = l, Ro(g, d, o, t, r), l !== null && (d.length === 0 ? l.f & 33554432 ? (l.f ^= Kn, Bo(l, null, o)) : za(l) : La(l, () => {
			l = null;
		})));
	}
	function h(e) {
		g.pending.delete(e);
	}
	var g = {
		effect: ja(() => {
			d = Q(u);
			var e = d.length;
			let c = !1;
			D && Er(o) === "[!" != (e === 0) && (o = Tr(), k(o), Sr(!1), c = !0);
			for (var g = /* @__PURE__ */ new Set(), _ = P, v = va(), y = 0; y < e; y += 1) {
				D && O.nodeType === 8 && O.data === "]" && (o = O, c = !0, Sr(!1));
				var b = d[y], x = r(b, y);
				if (T) {
					var ee = r(b, y);
					x !== ee && ar(String(y), String(x), String(ee));
				}
				var S = p ? null : s.get(x);
				S ? (S.v && Qi(S.v, b), S.i && Qi(S.i, y), v && _.unskip_effect(S.e)) : (S = zo(s, p ? o : Fo ??= z(), b, x, y, i, t, n), p || (S.e.f |= Kn), s.set(x, S)), g.add(x);
			}
			if (e === 0 && a && !l && (p ? l = H(() => a(o)) : (l = H(() => a(Fo ??= z())), l.f |= Kn)), e > g.size && (T ? Ho(d, r) : ir("", "", "")), D && e > 0 && k(Tr()), !p) if (f.set(_, g), v) {
				for (let [e, t] of s) g.has(e) || _.skip_effect(t.e);
				_.oncommit(m), _.ondiscard(h);
			} else m(_);
			c && Sr(!0), Q(u);
		}),
		flags: t,
		items: s,
		pending: f,
		outrogroups: null,
		fallback: l
	};
	p = !1, D && (o = O);
}
function Lo(e) {
	for (; e !== null && !(e.f & 32);) e = e.next;
	return e;
}
function Ro(e, t, n, r, i) {
	var a = (r & 8) != 0, o = t.length, s = e.items, c = Lo(e.effect.first), l, u = null, d, f = [], p = [], m, h, g, _;
	if (a) for (_ = 0; _ < o; _ += 1) m = t[_], h = i(m, _), g = s.get(h).e, g.f & 33554432 || (g.nodes?.a?.measure(), (d ??= /* @__PURE__ */ new Set()).add(g));
	for (_ = 0; _ < o; _ += 1) {
		if (m = t[_], h = i(m, _), g = s.get(h).e, e.outrogroups !== null) for (let t of e.outrogroups) t.pending.delete(g), t.done.delete(g);
		if (g.f & 8192 && (za(g), a && (g.nodes?.a?.unfix(), (d ??= /* @__PURE__ */ new Set()).delete(g))), g.f & 33554432) if (g.f ^= Kn, g === c) Bo(g, null, n);
		else {
			var v = u ? u.next : c;
			g === e.effect.last && (e.effect.last = g.prev), g.prev && (g.prev.next = g.next), g.next && (g.next.prev = g.prev), Vo(e, u, g), Vo(e, g, v), Bo(g, v, n), u = g, f = [], p = [], c = Lo(u.next);
			continue;
		}
		if (g !== c) {
			if (l !== void 0 && l.has(g)) {
				if (f.length < p.length) {
					var y = p[0], b;
					u = y.prev;
					var x = f[0], ee = f[f.length - 1];
					for (b = 0; b < f.length; b += 1) Bo(f[b], y, n);
					for (b = 0; b < p.length; b += 1) l.delete(p[b]);
					Vo(e, x.prev, ee.next), Vo(e, u, x), Vo(e, ee, y), c = y, u = ee, --_, f = [], p = [];
				} else l.delete(g), Bo(g, c, n), Vo(e, g.prev, g.next), Vo(e, g, u === null ? e.effect.first : u.next), Vo(e, u, g), u = g;
				continue;
			}
			for (f = [], p = []; c !== null && c !== g;) (l ??= /* @__PURE__ */ new Set()).add(c), p.push(c), c = Lo(c.next);
			if (c === null) continue;
		}
		g.f & 33554432 || f.push(g), u = g, c = Lo(g.next);
	}
	if (e.outrogroups !== null) {
		for (let t of e.outrogroups) t.pending.size === 0 && (Po(e, Dn(t.done)), e.outrogroups?.delete(t));
		e.outrogroups.size === 0 && (e.outrogroups = null);
	}
	if (c !== null || l !== void 0) {
		var S = [];
		if (l !== void 0) for (g of l) g.f & 8192 || S.push(g);
		for (; c !== null;) !(c.f & 8192) && c !== e.fallback && S.push(c), c = Lo(c.next);
		var te = S.length;
		if (te > 0) {
			var ne = r & 4 && o === 0 ? n : null;
			if (a) {
				for (_ = 0; _ < te; _ += 1) S[_].nodes?.a?.measure();
				for (_ = 0; _ < te; _ += 1) S[_].nodes?.a?.fix();
			}
			No(e, S, ne);
		}
	}
	a && Yr(() => {
		if (d !== void 0) for (g of d) g.nodes?.a?.apply();
	});
}
function zo(e, t, n, r, i, a, o, s) {
	var c = o & 1 ? o & 16 ? Xi(n) : /* @__PURE__ */ Zi(n, !1, !1) : null, l = o & 2 ? Xi(i) : null;
	return T && c && (c.trace = () => {
		s()[l?.v ?? i];
	}), {
		v: c,
		i: l,
		e: H(() => (a(t, c ?? n, l ?? i, s), () => {
			e.delete(r);
		}))
	};
}
function Bo(e, t, n) {
	if (e.nodes) for (var r = e.nodes.start, i = e.nodes.end, a = t && !(t.f & 33554432) ? t.nodes.start : n; r !== null;) {
		var o = /* @__PURE__ */ ha(r);
		if (a.before(r), r === i) return;
		r = o;
	}
}
function Vo(e, t, n) {
	t === null ? e.effect.first = n : t.next = n, n === null ? e.effect.last = t : n.prev = t;
}
function Ho(e, t) {
	let n = /* @__PURE__ */ new Map(), r = e.length;
	for (let i = 0; i < r; i++) {
		let r = t(e[i], i);
		if (n.has(r)) {
			let e = String(n.get(r)), t = String(i), a = String(r);
			a.startsWith("[object ") && (a = null), ir(e, t, a);
		}
		n.set(r, i);
	}
}
//#endregion
//#region node_modules/svelte/src/internal/shared/attributes.js
var Uo = [..." 	\n\r\f\xA0\v﻿"];
function Wo(e, t, n) {
	var r = e == null ? "" : "" + e;
	if (t && (r = r ? r + " " + t : t), n) {
		for (var i of Object.keys(n)) if (n[i]) r = r ? r + " " + i : i;
		else if (r.length) for (var a = i.length, o = 0; (o = r.indexOf(i, o)) >= 0;) {
			var s = o + a;
			(o === 0 || Uo.includes(r[o - 1])) && (s === r.length || Uo.includes(r[s])) ? r = (o === 0 ? "" : r.substring(0, o)) + r.substring(s + 1) : o = s;
		}
	}
	return r === "" ? null : r;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/class.js
function Go(e, t, n, r, i, a) {
	var o = e.__className;
	if (D || o !== n || o === void 0) {
		var s = Wo(n, r, a);
		(!D || s !== e.getAttribute("class")) && (s == null ? e.removeAttribute("class") : t ? e.className = s : e.setAttribute("class", s)), e.__className = n;
	} else if (a && i !== a) for (var c in a) {
		var l = !!a[c];
		(i == null || l !== !!i[c]) && e.classList.toggle(c, l);
	}
	return a;
}
var Ko = [
	"forEach",
	"isDisjointFrom",
	"isSubsetOf",
	"isSupersetOf"
], qo = [
	"difference",
	"intersection",
	"symmetricDifference",
	"union"
], Jo = !1, Yo = class e extends Set {
	#e = /* @__PURE__ */ new Map();
	#t = /* @__PURE__ */ L(0);
	#n = /* @__PURE__ */ L(0);
	#r = Za || -1;
	constructor(e) {
		if (super(), T && (e = new Set(e), j(this.#t, "SvelteSet version"), j(this.#n, "SvelteSet.size")), e) {
			for (var t of e) super.add(t);
			this.#n.v = super.size;
		}
		Jo || this.#a();
	}
	#i(e) {
		return Za === this.#r ? /* @__PURE__ */ L(e) : Xi(e);
	}
	#a() {
		Jo = !0;
		var t = e.prototype, n = Set.prototype;
		for (let e of Ko) t[e] = function(...t) {
			return Q(this.#t), n[e].apply(this, t);
		};
		for (let r of qo) t[r] = function(...t) {
			return Q(this.#t), new e(n[r].apply(this, t));
		};
	}
	has(e) {
		var t = super.has(e), n = this.#e, r = n.get(e);
		if (r === void 0) {
			if (!t) return Q(this.#t), !1;
			r = this.#i(!0), T && j(r, `SvelteSet has(${Fr(e)})`), n.set(e, r);
		}
		return Q(r), t;
	}
	add(e) {
		return super.has(e) || (super.add(e), R(this.#n, super.size), ea(this.#t)), this;
	}
	delete(e) {
		var t = super.delete(e), n = this.#e, r = n.get(e);
		return r !== void 0 && (n.delete(e), R(r, !1)), t && (R(this.#n, super.size), ea(this.#t)), t;
	}
	clear() {
		if (super.size !== 0) {
			super.clear();
			var e = this.#e;
			for (var t of e.values()) R(t, !1);
			e.clear(), R(this.#n, 0), ea(this.#t);
		}
	}
	keys() {
		return this.values();
	}
	values() {
		return Q(this.#t), super.values();
	}
	entries() {
		return Q(this.#t), super.entries();
	}
	[Symbol.iterator]() {
		return this.keys();
	}
	get size() {
		return Q(this.#n);
	}
}, Xo = /* @__PURE__ */ xo("<tr><td> </td><td class=\"num\"> </td><td class=\"num\"> </td></tr>"), Zo = /* @__PURE__ */ xo("<tr><td class=\"pp-child-label\"> </td><td class=\"num\"> </td><td class=\"num\"> </td></tr>"), Qo = /* @__PURE__ */ xo("<tr class=\"pp-group-header\"><td><i></i> </td><td class=\"num\"> </td><td class=\"num\"> </td></tr> <!>", 1), $o = /* @__PURE__ */ xo("<section class=\"pp-gpu-timing\"><style>.pp-gpu-timing table {\n			border-collapse: collapse;\n			width: 100%;\n		}\n		.pp-gpu-timing th,\n		.pp-gpu-timing td {\n			padding: 1px 6px;\n			line-height: 1.3;\n		}\n		.pp-gpu-timing th {\n			text-align: left;\n		}\n		.pp-gpu-timing .num {\n			text-align: right;\n			font-variant-numeric: tabular-nums;\n			white-space: nowrap;\n		}\n		.pp-gpu-timing .pp-child-label {\n			padding-left: 1.5em;\n		}\n		.pp-gpu-timing .pp-group-header td:first-child {\n			cursor: pointer;\n			user-select: none;\n		}\n		.pp-gpu-timing .pp-arrow {\n			font-size: 0.65em;\n			display: inline-block;\n			transition: transform 0.1s;\n			margin-right: 0.25em;\n		}\n		.pp-gpu-timing .pp-arrow.pp-open {\n			transform: rotate(90deg);\n		}</style> <p> </p> <table><thead><tr><th>Target</th><th class=\"num\">GPU ms</th><th class=\"num\">CPU ms</th></tr></thead><tbody><!><tr><th>Total</th><th class=\"num\"> </th><th class=\"num\"> </th></tr></tbody></table> <table><tbody><tr><td>Tokens rendered</td><td class=\"num\"> </td></tr><tr><td>Void mesh draw batches</td><td class=\"num\"> </td></tr></tbody></table></section>");
function es(e, t) {
	Wr(t, !0);
	let n = new Yo();
	function r(e) {
		n.has(e) ? n.delete(e) : n.add(e);
	}
	var i = $o(), a = V(B(i), 2), o = B(a);
	A(a);
	var s = V(a, 2), c = V(B(s)), l = B(c);
	Io(l, 17, () => t.state.groups, (e) => e.label, (e, t) => {
		var i = So(), a = ga(i), o = (e) => {
			let n = /* @__PURE__ */ Li(() => Q(t).rows[0]);
			var r = So(), i = ga(r), a = (e) => {
				var t = Xo(), r = B(t), i = B(r, !0);
				A(r);
				var a = V(r), o = B(a, !0);
				A(a);
				var s = V(a), c = B(s, !0);
				A(s), A(t), Aa(() => {
					$(i, Q(n).label), $(o, Q(n).gpuMs), $(c, Q(n).cpuMs);
				}), Co(e, t);
			};
			Mo(i, (e) => {
				Q(n) && e(a);
			}), Co(e, r);
		}, s = (e) => {
			let i = /* @__PURE__ */ Li(() => n.has(Q(t).label));
			var a = Qo(), o = ga(a), s = B(o), c = B(s);
			let l;
			var u = V(c);
			A(s);
			var d = V(s), f = B(d, !0);
			A(d);
			var p = V(d), m = B(p, !0);
			A(p), A(o);
			var h = V(o, 2), g = (e) => {
				var n = So();
				Io(ga(n), 17, () => Q(t).rows, (e) => e.label, (e, t) => {
					var n = Zo(), r = B(n), i = B(r, !0);
					A(r);
					var a = V(r), o = B(a, !0);
					A(a);
					var s = V(a), c = B(s, !0);
					A(s), A(n), Aa(() => {
						$(i, Q(t).label), $(o, Q(t).gpuMs), $(c, Q(t).cpuMs);
					}), Co(e, n);
				}), Co(e, n);
			};
			Mo(h, (e) => {
				Q(i) && e(g);
			}), Aa(() => {
				l = Go(c, 1, "fa-solid fa-chevron-right pp-arrow", null, l, { "pp-open": Q(i) }), $(u, ` ${Q(t).label ?? ""}`), $(f, Q(t).subtotalGpuMs), $(m, Q(t).subtotalCpuMs);
			}), po("click", o, () => r(Q(t).label)), Co(e, a);
		};
		Mo(a, (e) => {
			Q(t).isSingle ? e(o) : e(s, -1);
		}), Co(e, i);
	});
	var u = V(l), d = V(B(u)), f = B(d, !0);
	A(d);
	var p = V(d), m = B(p, !0);
	A(p), A(u), A(c), A(s);
	var h = V(s, 2), g = B(h), _ = B(g), v = V(B(_)), y = B(v, !0);
	A(v), A(_);
	var b = V(_), x = V(B(b)), ee = B(x, !0);
	A(x), A(b), A(g), A(h), A(i), Aa(() => {
		$(o, `Rolling average across ${t.state.rollingWindow ?? ""} frames.`), $(f, t.state.totalGpuMs), $(m, t.state.totalCpuMs), $(y, t.state.tokenCount), $(ee, t.state.voidMeshBatchCount);
	}), Co(e, i), Gr();
}
mo(["click"]);
//#endregion
//#region src/apps/SvelteApplicationMixin.svelte.ts
function ts(e) {
	class t extends e {
		#e = /* @__PURE__ */ L(ra({}));
		get $state() {
			return Q(this.#e);
		}
		set $state(e) {
			R(this.#e, e, !0);
		}
		#t = null;
		async _renderHTML(e) {
			return e;
		}
		_replaceHTML(e, t, n) {
			Object.assign(this.$state, e.data), n.isFirstRender && (this.#t = Eo(this.root, {
				target: t,
				props: { state: this.$state }
			}));
		}
		_onClose(e) {
			super._onClose(e), this.#t !== null && (Ao(this.#t), this.#t = null);
		}
	}
	return t;
}
//#endregion
//#region src/hacks/gpuTimingDebug.ts
function ns(e, t) {
	return {
		label: e,
		samples: Array(t).fill(0),
		head: 0
	};
}
function rs(e, t) {
	let n = e.samples.length;
	e.samples[e.head] = t, e.head = (e.head + 1) % n;
}
function is(e) {
	return e.samples.reduce((e, t) => e + t, 0) / e.samples.length;
}
var as = class extends ts(foundry.applications.api.ApplicationV2) {
	static DEFAULT_OPTIONS = {
		id: "performance-overlay",
		window: {
			title: "Performance Overlay",
			icon: "fa-solid fa-gauge-high"
		},
		position: { width: 420 }
	};
	root = es;
	#e = null;
	setData(e, t, n, r, i, a) {
		Object.assign(this.$state, {
			groups: e,
			totalGpuMs: t,
			totalCpuMs: n,
			rollingWindow: r,
			tokenCount: i,
			voidMeshBatchCount: a
		}), this.rendered || this.render(!0);
	}
	setOnClose(e) {
		this.#e = e;
	}
	_onClose(e) {
		super._onClose(e), this.#e?.();
	}
	async _prepareContext(e) {
		let t = this.$state;
		return { data: {
			groups: t.groups ?? [],
			totalGpuMs: t.totalGpuMs ?? "0.000",
			totalCpuMs: t.totalCpuMs ?? "0.000",
			rollingWindow: t.rollingWindow ?? 60,
			tokenCount: t.tokenCount ?? 0,
			voidMeshBatchCount: t.voidMeshBatchCount ?? 0
		} };
	}
};
function os(e) {
	return "getContainer" in e;
}
function ss(e) {
	return "kind" in e && e.kind === "primaryRuns";
}
function cs() {
	let e = canvas.interface;
	return [
		{
			label: "PrimaryCanvasGroup",
			getContainer: () => canvas.primary
		},
		{
			label: "CanvasVisibility",
			getContainer: () => canvas.visibility
		},
		{
			label: "Canvas Effects",
			children: [
				{
					label: "CanvasBackgroundAlterationEffects",
					getContainer: () => canvas.effects.background
				},
				{
					label: "CanvasIlluminationEffects",
					getContainer: () => canvas.effects.illumination
				},
				{
					label: "CanvasColorationEffects",
					getContainer: () => canvas.effects.coloration
				},
				{
					label: "CanvasDarknessEffects",
					getContainer: () => canvas.effects.darkness
				}
			]
		},
		{
			label: "Interface Layer",
			children: [
				{
					label: "GridLayer",
					getContainer: () => e.grid
				},
				{
					label: "RegionLayer",
					getContainer: () => e.regions
				},
				{
					label: "TokenLayer",
					getContainer: () => e.tokens
				},
				{
					label: "TilesLayer",
					getContainer: () => e.tiles
				},
				{
					label: "TemplatesLayer",
					getContainer: () => e.templates
				},
				{
					label: "DrawingsLayer",
					getContainer: () => e.drawings
				},
				{
					label: "WallsLayer",
					getContainer: () => e.walls
				},
				{
					label: "NotesLayer",
					getContainer: () => e.notes
				},
				{
					label: "SoundsLayer",
					getContainer: () => e.sounds
				},
				{
					label: "LightingLayer",
					getContainer: () => e.lighting
				},
				{
					label: "ControlsLayer",
					getContainer: () => e.controls
				}
			]
		}
	];
}
function ls() {
	return [{
		kind: "primaryRuns",
		getPrimary: () => canvas.primary
	}];
}
function us(e) {
	let t = e.getExtension("EXT_disjoint_timer_query_webgl2");
	if (t) return {
		TIME_ELAPSED_EXT: t.TIME_ELAPSED_EXT,
		GPU_DISJOINT_EXT: t.GPU_DISJOINT_EXT,
		QUERY_RESULT_AVAILABLE: e.QUERY_RESULT_AVAILABLE,
		QUERY_RESULT: e.QUERY_RESULT,
		createQuery: () => e.createQuery(),
		deleteQuery: (t) => e.deleteQuery(t),
		beginQuery: (t, n) => e.beginQuery(t, n),
		endQuery: (t) => e.endQuery(t),
		getQueryParameter: (t, n) => e.getQueryParameter(t, n)
	};
	let n = e.getExtension("EXT_disjoint_timer_query");
	return n ? {
		TIME_ELAPSED_EXT: n.TIME_ELAPSED_EXT,
		GPU_DISJOINT_EXT: n.GPU_DISJOINT_EXT,
		QUERY_RESULT_AVAILABLE: n.QUERY_RESULT_AVAILABLE_EXT,
		QUERY_RESULT: n.QUERY_RESULT_EXT,
		createQuery: () => n.createQueryEXT(),
		deleteQuery: (e) => n.deleteQueryEXT(e),
		beginQuery: (e, t) => n.beginQueryEXT(e, t),
		endQuery: (e) => n.endQueryEXT(e),
		getQueryParameter: (e, t) => n.getQueryObjectEXT(e, t)
	} : null;
}
var ds = class {
	#e = null;
	#t = null;
	#n = !1;
	#r = /* @__PURE__ */ new Map();
	#i = /* @__PURE__ */ new Map();
	#a = /* @__PURE__ */ new Map();
	#o = {
		framePass: !1,
		currentLabel: null,
		currentPluginName: null,
		currentQuery: null,
		currentCpuT0: 0,
		pluginNameCounts: /* @__PURE__ */ new Map(),
		queryPool: [],
		encounterOrderThisFrame: [],
		lastFrameEncounterOrder: []
	};
	#s = !1;
	#c = [];
	#l = null;
	#u = 60;
	#d = null;
	#f = 0;
	#p;
	constructor(e) {
		this.#p = e ?? cs;
	}
	start() {
		if (this.#n) {
			console.warn("[PrimePerformance] GPU profiler is already running.");
			return;
		}
		let e = canvas?.app?.renderer;
		if (!e) {
			console.error("[PrimePerformance] No canvas renderer found. Open a scene first.");
			return;
		}
		let t = e.gl, n = us(t);
		if (!n) {
			console.error("[PrimePerformance] Neither EXT_disjoint_timer_query_webgl2 nor EXT_disjoint_timer_query is available in this browser/context.");
			return;
		}
		this.#t = t, this.#e = n, this.#u = game.settings.get("core", "maxFPS") || this.#u, this.#n = !0, this.#s = !1, this.#m(), this.#k(), this.#w();
	}
	stop() {
		this.#n && (this.#n = !1, this.#s = !1, this.#C(), this.#T(), this.#c = [], this.#A(), console.info("[PrimePerformance] GPU profiler stopped."));
	}
	#m() {
		let e = this.#p();
		for (let t of e) {
			if (ss(t)) {
				this.#g(t);
				continue;
			}
			let e = os(t) ? [t] : t.children;
			for (let t of e) this.#h(t);
		}
	}
	#h(e) {
		let t = e.getContainer();
		if (!t) {
			console.warn(`[PrimePerformance] Layer not found: ${e.label}`);
			return;
		}
		if (this.#r.has(t)) return;
		let n = this.#e;
		if (!n) return;
		let r = ns(e.label, this.#u), i = ns(e.label, this.#u), a = [], o = t.render.bind(t);
		t.render = (t) => {
			if (!this.isActive) {
				o(t);
				return;
			}
			if (this.queryActive) {
				o(t);
				return;
			}
			let r = a.pop() ?? n.createQuery();
			if (!r) {
				o(t);
				return;
			}
			n.beginQuery(n.TIME_ELAPSED_EXT, r), this.markQueryActive(!0);
			let s = performance.now();
			o(t);
			let c = (performance.now() - s) * 1e3;
			n.endQuery(n.TIME_ELAPSED_EXT), this.markQueryActive(!1), rs(i, c), this.enqueuePending({
				label: e.label,
				query: r
			});
		}, this.#r.set(t, {
			originalRender: o,
			gpuStats: r,
			cpuStats: i,
			queryPool: a
		});
	}
	#g(e) {
		let t = e.getPrimary();
		if (!t) {
			console.warn("[PrimePerformance] canvas.primary not found.");
			return;
		}
		if (this.#e && !this.#a.has(t)) {
			let e = t.render.bind(t);
			t.render = (n) => {
				if (!this.isActive) {
					e(n);
					return;
				}
				this.#_(t), this.#v(), e(n), this.#y();
			}, this.#a.set(t, e);
		}
	}
	#_(e) {
		let t = new Set(e.children);
		for (let [n, r] of this.#a) n !== e && (t.has(n) || (n.render = r, this.#a.delete(n)));
		for (let e of t) {
			if (this.#a.has(e)) continue;
			let t = e.render.bind(e);
			e.render = (n) => {
				this.#b(e, n, t);
			}, this.#a.set(e, t);
		}
	}
	#v() {
		let e = this.#o;
		e.framePass = !0, e.currentLabel = null, e.currentPluginName = null, e.currentQuery = null, e.currentCpuT0 = 0, e.pluginNameCounts.clear(), e.encounterOrderThisFrame = [];
	}
	#y() {
		let e = this.#o;
		this.#S(), e.framePass = !1, e.lastFrameEncounterOrder = e.encounterOrderThisFrame;
	}
	#b(e, t, n) {
		let r = this.#o;
		if (!r.framePass || !this.isActive) {
			n(t);
			return;
		}
		let i = e.pluginName ?? null;
		(i == null || i !== r.currentPluginName) && (this.#S(), this.#x(e, i)), n(t);
	}
	#x(e, t) {
		let n = this.#o, r = this.#e;
		if (!r) return;
		let i;
		if (t === null) i = e.name ?? e.constructor.name;
		else {
			let e = (n.pluginNameCounts.get(t) ?? 0) + 1;
			n.pluginNameCounts.set(t, e), i = e === 1 ? t : `${t} #${e}`;
		}
		let a = this.#i.get(i);
		a || (a = {
			gpuStats: ns(i, this.#u),
			cpuStats: ns(i, this.#u),
			queryPool: [],
			activeQuery: null,
			cpuT0: 0
		}, this.#i.set(i, a)), n.encounterOrderThisFrame.push(i);
		let o = n.queryPool.pop() ?? a.queryPool.pop() ?? r.createQuery();
		if (!o) {
			n.currentLabel = i, n.currentPluginName = t, n.currentQuery = null;
			return;
		}
		r.beginQuery(r.TIME_ELAPSED_EXT, o), this.markQueryActive(!0), n.currentLabel = i, n.currentPluginName = t, n.currentQuery = o, n.currentCpuT0 = performance.now();
	}
	#S() {
		let e = this.#o, t = this.#e;
		if (!t || e.currentLabel === null) return;
		let n = e.currentLabel, r = e.currentQuery, i = (performance.now() - e.currentCpuT0) * 1e3;
		if (e.currentLabel = null, e.currentPluginName = null, e.currentQuery = null, r !== null) {
			t.endQuery(t.TIME_ELAPSED_EXT), this.markQueryActive(!1);
			let e = this.#i.get(n);
			e && rs(e.cpuStats, i), this.enqueuePending({
				label: n,
				query: r
			});
		}
	}
	#C() {
		for (let [e, { originalRender: t }] of this.#r) e.render = t;
		this.#r.clear();
		for (let [e, t] of this.#a) e.render = t;
		this.#a.clear(), this.#i.clear();
		let e = this.#o;
		e.framePass = !1, e.currentLabel = null, e.currentPluginName = null, e.currentQuery = null, e.pluginNameCounts.clear(), e.encounterOrderThisFrame = [], e.lastFrameEncounterOrder = [];
		for (let t of e.queryPool) this.#e?.deleteQuery(t);
		e.queryPool = [];
	}
	#w() {
		let e = () => {
			this.#n && (this.#E(), this.#l = requestAnimationFrame(e));
		};
		this.#l = requestAnimationFrame(e);
	}
	#T() {
		this.#l !== null && (cancelAnimationFrame(this.#l), this.#l = null);
	}
	#E() {
		let e = this.#t, t = this.#e;
		if (!e || !t) return;
		let n = [];
		for (let r of this.#c) {
			if (e.getParameter(t.GPU_DISJOINT_EXT)) {
				this.#D(r.label, r.query);
				continue;
			}
			let i;
			try {
				i = t.getQueryParameter(r.query, t.QUERY_RESULT_AVAILABLE);
			} catch (e) {
				console.error(`[PrimePerformance] getQueryParameter threw on label='${r.label}' — query was never properly begun. Dropping.`, e), this.#e?.deleteQuery(r.query);
				continue;
			}
			if (!i) {
				n.push(r);
				continue;
			}
			let a = t.getQueryParameter(r.query, t.QUERY_RESULT) / 1e3, o = this.#O(r.label);
			o && rs(o.gpuStats, a), this.#D(r.label, r.query);
		}
		this.#c = n, this.#M();
	}
	#D(e, t) {
		let n = this.#i.get(e);
		if (n) {
			n.queryPool.push(t);
			return;
		}
		for (let [, n] of this.#r) if (n.gpuStats.label === e) {
			n.queryPool.push(t);
			return;
		}
		this.#e?.deleteQuery(t);
	}
	#O(e) {
		let t = this.#i.get(e);
		if (t) return t;
		for (let [, t] of this.#r) if (t.gpuStats.label === e) return t;
		return null;
	}
	#k() {
		this.#d || (this.#d = new as(), this.#d.setOnClose(() => this.stop()));
	}
	#A() {
		this.#d?.close(), this.#d = null;
	}
	#j() {
		let e = this.#p(), t = [], n = 0, r = 0;
		for (let i of e) {
			if (ss(i)) {
				let e = this.#o.lastFrameEncounterOrder, i = [];
				for (let t of e) {
					let e = this.#i.get(t);
					if (!e) continue;
					let a = is(e.gpuStats) / 1e3, o = is(e.cpuStats) / 1e3;
					n += a, r += o, i.push({
						label: t,
						gpuMs: a.toFixed(3),
						cpuMs: o.toFixed(3)
					});
				}
				let a = 0, o = 0;
				for (let e of i) a += parseFloat(e.gpuMs), o += parseFloat(e.cpuMs);
				t.push({
					label: "PrimaryCanvasGroup children",
					isSingle: !1,
					rows: i,
					subtotalGpuMs: a.toFixed(3),
					subtotalCpuMs: o.toFixed(3)
				});
				continue;
			}
			let e = os(i), a = e ? [i] : i.children, o = [];
			for (let e of a) {
				let t = this.#O(e.label);
				if (!t) continue;
				let i = is(t.gpuStats) / 1e3, a = is(t.cpuStats) / 1e3;
				n += i, r += a, o.push({
					label: e.label,
					gpuMs: i.toFixed(3),
					cpuMs: a.toFixed(3)
				});
			}
			let s = 0, c = 0;
			for (let e of o) s += parseFloat(e.gpuMs), c += parseFloat(e.cpuMs);
			t.push({
				label: i.label,
				isSingle: e,
				rows: o,
				subtotalGpuMs: s.toFixed(3),
				subtotalCpuMs: c.toFixed(3)
			});
		}
		return {
			groups: t,
			totalGpuMs: n.toFixed(3),
			totalCpuMs: r.toFixed(3)
		};
	}
	#M() {
		if (!this.#d) return;
		let e = performance.now();
		if (e - this.#f < 250) return;
		this.#f = e;
		let { groups: t, totalGpuMs: n, totalCpuMs: r } = this.#j();
		this.#d.setData(t, n, r, this.#u, bt, xt);
	}
	get isActive() {
		return this.#n;
	}
	get queryActive() {
		return this.#s;
	}
	markQueryActive(e) {
		this.#s = e;
	}
	enqueuePending(e) {
		this.#c.push(e);
	}
	getPlainTextSnapshot() {
		if (!this.#n) return null;
		let { groups: e, totalGpuMs: t, totalCpuMs: n } = this.#j(), r = ["| Target | GPU ms | CPU ms |", "|---|---|---|"];
		for (let t of e) if (t.isSingle) {
			let e = t.rows[0];
			r.push(`| **${e.label}** | ${e.gpuMs} | ${e.cpuMs} |`);
		} else {
			r.push(`| **${t.label}** | ${t.subtotalGpuMs} | ${t.subtotalCpuMs} |`);
			for (let e of t.rows) r.push(`| &nbsp;&nbsp;${e.label} | ${e.gpuMs} | ${e.cpuMs} |`);
		}
		return r.push(`| **Total** | ${t} | ${n} |`), r.join("\n");
	}
}, fs = null;
function ps() {
	Hooks.once("canvasReady", () => {
		fs = new ds();
	});
}
function ms() {
	fs?.stop(), fs = new ds(), fs.start();
}
function hs() {
	fs?.stop();
}
function gs() {
	return fs?.getPlainTextSnapshot() ?? (ui.notifications?.warn("Performance overlay is not active."), null);
}
function _s() {
	fs?.stop(), fs = new ds(ls), fs.start();
}
//#endregion
//#region src/windowApi.ts
var vs = {
	controlIconCaching: {
		enable: vn,
		disable: yn
	},
	overlay: {
		open: ms,
		close: hs,
		snapshot: gs,
		primaryChildren: _s
	},
	effectsCaching: {
		enable: ie,
		disable: ae
	},
	tokenBarsCaching: {
		enable: Ht,
		disable: Ut
	},
	generalizedOooRendering: {
		enable: Mt,
		disable: Nt
	},
	meshGeometryFitting: { toggleDebug: Ke },
	wallSpriteCaching: {
		enable: on,
		disable: sn
	}
};
function ys() {
	window.PrimePerformance = vs;
}
//#endregion
//#region src/hacks/shaders/radialGradientShadow.frag
var bs = "precision mediump float;\n\nvarying vec2 vTextureCoord;\n\nuniform float innerRadius;  \nuniform float outerRadius;  \nuniform vec3 shadowColor;   \nuniform float peakAlpha;    \n\nvoid main(void) {\n	vec2 offset = (vTextureCoord - 0.5) * (outerRadius * 2.0);\n	float dist = length(offset);\n\n	if (dist >= outerRadius) {\n		gl_FragColor = vec4(0.0);\n		return;\n	}\n\n	float alpha;\n	if (dist <= innerRadius) {\n		alpha = peakAlpha;\n	} else {\n		float t = (dist - innerRadius) / (outerRadius - innerRadius);\n		alpha = peakAlpha * ((1.0 - pow(t, 0.6)) * 0.5 + exp(-3.5 * t * t) * 0.5);\n	}\n\n	gl_FragColor = vec4(shadowColor * alpha, alpha);\n}", xs = class extends foundry.canvas.rendering.shaders.AbstractBaseShader {
	static vertexShader = "\n		precision mediump float;\n		attribute vec2 aVertexPosition;\n		varying vec2 vTextureCoord;\n		uniform mat3 projectionMatrix;\n		uniform mat3 translationMatrix;\n		void main(void) {\n			vTextureCoord = aVertexPosition;\n			gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n		}\n	";
	static fragmentShader = bs;
	static defaultUniforms = {
		innerRadius: 0,
		outerRadius: 1,
		shadowColor: [
			0,
			0,
			0
		],
		peakAlpha: .2
	};
};
function Ss(e, t, n, r, i, a) {
	let o = (i >> 16 & 255) / 255, s = (i >> 8 & 255) / 255, c = (i & 255) / 255, l = new foundry.canvas.containers.QuadMesh(xs);
	return l.shader.uniforms.innerRadius = n, l.shader.uniforms.outerRadius = r, l.shader.uniforms.shadowColor = [
		o,
		s,
		c
	], l.shader.uniforms.peakAlpha = a, l.blendMode = PIXI.BLEND_MODES.NORMAL, l.position.set(e - r, t - r), l.scale.set(r * 2, r * 2), l.clear = () => {}, l;
}
function Cs(t, n) {
	C(e.ControlIconCaching) || n(), t.cacheAsBitmap = !1, n(), t.cacheAsBitmapResolution = v(), t.cacheAsBitmap = !0, ln.add(t);
}
function ws(e, ...t) {
	Cs(this, () => {
		this.removeChildren(), e(...t), this.removeChild(this.shadow);
		let n = this.radius + 8, r = this.radius + 8, i = this.radius + 8, a = i + 40;
		this.shadow = this.addChildAt(Ss(n, r, i, a, this.style.shadowColor, .25), 0), game.release.generation >= 14 && (this.x = -this.radius, this.y = -this.radius);
	});
}
var Ts = !1;
function Es() {
	Ts || typeof game.system?.canvas?.MapLocationControlIcon == "function" && (Ts = !0, libWrapper.register(n, "game.system.canvas.MapLocationControlIcon.prototype.renderMarker", ws, "WRAPPER"));
}
function Ds() {
	!C(e.DnD5eOptimizations) || !r.hasCanvas || Es();
}
//#endregion
//#region src/hacks/emberMeshViewportCulling.ts
function Os() {
	let e = canvas?.stage, t = canvas?.app?.renderer?.screen;
	if (!e || !t) return null;
	let n = e.worldTransform, r = e.scale.x || 1, i = e.scale.y || 1;
	return {
		x: -n.tx / r,
		y: -n.ty / i,
		width: t.width / r,
		height: t.height / i
	};
}
function ks(e, t) {
	return e.x < t.x + t.width && e.x + e.width > t.x && e.y < t.y + t.height && e.y + e.height > t.y;
}
function As(e, t) {
	let n = this._canvasBounds;
	if (n && n.width > 0 && n.height > 0) {
		let e = Os();
		if (e && !ks(n, e)) return;
	}
	e(t);
}
function js() {
	game.modules.get("ember")?.active || C(e.EmberShaderOptimizations) && (globalThis.ember?.api?.canvas?.EmberGeometryMesh)?.prototype?._render && libWrapper.register(n, "ember.api.canvas.EmberGeometryMesh.prototype._render", As, "MIXED");
}
//#endregion
//#region src/hacks/pixi3DPatch.ts
var Ms = class {
	glTexture;
	target;
	constructor(e, t) {
		this.glTexture = e, this.target = t;
	}
}, Ns = !1;
function Ps() {
	Ns || (Ns = !0, Ls(), console.log("[PrimePerformance] 3D texture monkey-patches applied"));
}
function Fs(e) {
	if (!e) return 0;
	let t = e.findLastIndex((e) => !!e);
	return t === -1 ? 0 : t + 1;
}
var Is = /* @__PURE__ */ new WeakMap();
function Ls() {
	let e = PIXI.ShaderSystem, t = e.prototype.syncUniformGroup;
	e.prototype.syncUniformGroup = function(e, n) {
		let r = this.gl, i = Is.get(this) ?? [];
		for (let e of i) r.activeTexture(r.TEXTURE0 + e), r.bindTexture(r.TEXTURE_3D, null);
		Is.delete(this);
		let a = [];
		if (e?.uniforms) for (let t of Object.keys(e.uniforms)) {
			let n = e.uniforms[t];
			n instanceof Ms && (a.push({
				key: t,
				val: n
			}), delete e.uniforms[t]);
		}
		t.call(this, e, n);
		for (let { key: t, val: n } of a) e.uniforms[t] = n;
		if (a.length === 0) return;
		let o = this.renderer?.CONTEXT_UID, s = (o ? this.shader?.program?.glPrograms?.[o] : void 0)?.program;
		if (!s) {
			console.warn("[Prime Performance] No WebGLProgram found for 3D textures");
			return;
		}
		let c = this.renderer?.texture?.boundTextures, l = Fs(c), u = [];
		for (let { key: e, val: t } of a) {
			let n = l++;
			u.push(n), r.activeTexture(r.TEXTURE0 + n), r.bindTexture(r.TEXTURE_2D, null), r.bindTexture(t.target, t.glTexture);
			let i = r.getUniformLocation(s, e);
			i ? r.uniform1i(i, n) : console.warn("[pixi-patch] getUniformLocation returned null for", e);
		}
		Is.set(this, u);
	};
}
//#endregion
//#region src/utils/shaderTextureGenerator.ts
var Rs = /* @__PURE__ */ new WeakMap(), zs = /* @__PURE__ */ new Map(), Bs = /* @__PURE__ */ new Map(), Vs = "#version 300 es\nin vec2 aVertexPosition;\nout vec2 vTextureCoord;\nvoid main(void) {\n	vTextureCoord = aVertexPosition * 0.5 + 0.5;\n	gl_Position = vec4(aVertexPosition, 0.0, 1.0);\n}\n", Hs = class e {
	specs;
	textures = {};
	resolveReady;
	rejectReady;
	ready;
	constructor(e) {
		this.specs = e, this.ready = new Promise((e, t) => {
			this.resolveReady = e, this.rejectReady = t;
		});
	}
	generate(t) {
		try {
			let n = e.fullscreenQuadGeometry();
			for (let e of Object.keys(this.specs)) {
				let r = this.specs[e], i = zs.get(r.fragment);
				if (i) {
					this.textures[e] = i;
					continue;
				}
				let a = PIXI.RenderTexture.create({
					width: r.width,
					height: r.height,
					format: r.format,
					wrapMode: r.wrapMode ?? PIXI.WRAP_MODES.REPEAT,
					scaleMode: r.scaleMode ?? PIXI.SCALE_MODES.LINEAR,
					mipmap: PIXI.MIPMAP_MODES.OFF,
					resolution: 1
				}), o = PIXI.Program.from(Vs, r.fragment), s = new PIXI.Shader(o, {}), c = new PIXI.Mesh(n, s);
				t.render(c, {
					renderTexture: a,
					clear: !0
				}), s.destroy?.(), c.destroy(), zs.set(r.fragment, a), this.textures[e] = a;
			}
			n.destroy(), this.resolveReady();
		} catch (e) {
			throw this.rejectReady(e), e;
		}
	}
	getTexture(e) {
		let t = this.textures[e];
		if (!t) throw Error(`[ShaderTextureGenerator] getTexture("${String(e)}") called before generation completed (await generator.ready first).`);
		return t;
	}
	static fullscreenQuadGeometry() {
		return new PIXI.Geometry().addAttribute("aVertexPosition", [
			-1,
			-1,
			1,
			-1,
			1,
			1,
			-1,
			1
		], 2).addIndex([
			0,
			1,
			2,
			0,
			2,
			3
		]);
	}
}, Us = class {
	specs;
	textures = {};
	resolveReady;
	rejectReady;
	ready;
	constructor(e) {
		this.specs = e, this.ready = new Promise((e, t) => {
			this.resolveReady = e, this.rejectReady = t;
		});
	}
	generate(e) {
		try {
			let t = e.gl;
			if (!t) throw Error("[ShaderTextureGenerator3D] renderer has no WebGL2 context");
			for (let e of Object.keys(this.specs)) {
				let n = this.specs[e], r = Bs.get(n.fragment);
				if (r) {
					this.textures[e] = r;
					continue;
				}
				let i = t.getParameter(t.VIEWPORT), a = t.getParameter(t.SCISSOR_TEST);
				a && t.disable(t.SCISSOR_TEST);
				let o = n.generator(t, n);
				t.viewport(i[0], i[1], i[2], i[3]), a && t.enable(t.SCISSOR_TEST), Bs.set(n.fragment, o), this.textures[e] = o;
			}
			this.resolveReady();
		} catch (e) {
			throw this.rejectReady(e), e;
		}
	}
	getTexture(e) {
		let t = this.textures[e];
		if (!t) throw Error(`[ShaderTextureGenerator3D] getTexture("${String(e)}") called before generation completed (await generator.ready first).`);
		return t;
	}
}, Ws = class {
	generator;
	generator3D;
	replacements;
	source;
	shaderClass;
	bindings = /* @__PURE__ */ new Map();
	textures3D = /* @__PURE__ */ new Set();
	appliedKeys = /* @__PURE__ */ new Set();
	hasApplied = !1;
	constructor(e, t, n, r, i) {
		this.generator = e, this.generator3D = i, this.replacements = t, this.shaderClass = n, this.source = r;
	}
	setSource(e) {
		return this.source = e, this.appliedKeys = /* @__PURE__ */ new Set(), this.hasApplied = !1, this;
	}
	apply(...e) {
		if (!this.source) throw Error("[ShaderPatcher] apply() called before source was set — call setContext() first.");
		let t = this.getOrCreateRecord(), n;
		n = e.length > 0 ? e : Object.keys(this.replacements).filter((e) => {
			let t = this.replacements[e];
			return t?.regex != null && t.autoApply !== !1;
		});
		let r = this.source;
		for (let e of n) {
			let n = this.replacements[e];
			if (!n) {
				console.warn(`[ShaderPatcher] unknown replacement key "${String(e)}" — skipping.`);
				continue;
			}
			if (t.applied[e] === !0) {
				this.recordBindings(n), this.appliedKeys.add(e);
				continue;
			}
			if (!n.regex) {
				r = n.optimizedShader, t.applied[e] = !0, this.recordBindings(n), this.appliedKeys.add(e);
				continue;
			}
			if (!n.regex.test(r)) {
				t.applied[e] = !1;
				continue;
			}
			r = r.replace(n.regex, n.optimizedShader), t.applied[e] = !0, this.recordBindings(n), this.appliedKeys.add(e);
		}
		return this.hasApplied = !0, n.length > 0 && this.appliedKeys.size === 0 && console.warn(`[ShaderPatcher] no replacements matched for ${this.shaderClass?.name ?? "(unknown class)"}.`), /^\s*#version\s+300\s+es\b/.test(r) && (r = r.replace(/\btexture2D\s*\(/g, "texture(")), r;
	}
	patchUniforms(e, t) {
		if (!this.hasApplied) throw Error("[ShaderPatcher] patchUniforms() called before apply().");
		for (let [n, r] of this.bindings) this.textures3D.has(r) ? this.generator3D && (e[n] = new Ms(this.generator3D.getTexture(r), t?.TEXTURE_3D ?? 32879)) : e[n] = this.generator.getTexture(r);
	}
	get textureCount() {
		return this.bindings.size;
	}
	get applied() {
		return [...this.appliedKeys];
	}
	recordBindings(e) {
		if (e.textures) for (let t of e.textures) {
			let n = e.samplerNames?.[t] ?? t;
			this.bindings.set(n, t);
		}
		if (e.textures3D) for (let t of e.textures3D) this.textures3D.add(t);
	}
	getOrCreateRecord() {
		let e = Rs.get(this.shaderClass);
		return e || (e = { applied: {} }, Rs.set(this.shaderClass, e)), e;
	}
}, Gs = "#version 300 es\n#define SHADER_NAME generate-noise\nprecision mediump float;\n\nin vec2 vTextureCoord;\nout vec4 fragColor;\n\nfloat random(in vec2 uv) {\n	uv = mod(uv, 1000.0);\n	return fract(dot(uv, vec2(5.23, 2.89) * fract((2.41 * uv.x + 2.27 * uv.y) * 251.19)) * 551.83);\n}\n\nvec3 mod289(in vec3 x) {\n	return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n\nvec4 mod289(in vec4 x) {\n	return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n\nvec4 permute(in vec4 x) {\n	return mod289(((x * 34.0) + 1.0) * x);\n}\n\nvec4 taylorInvSqrt(in vec4 r) {\n	return 1.79284291400159 - 0.85373472095314 * r;\n}\n\nvec3 fade(in vec3 t) {\n	return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);\n}\n\nconst float PERIOD = 16.0f;\n\nfloat tilingNoise(vec2 uv) {\n	uv *= PERIOD;\n\n	vec2 i = floor(uv);\n	vec2 f = fract(uv);\n\n	float a = random(mod(i + vec2(0.0f, 0.0f), PERIOD));\n	float b = random(mod(i + vec2(1.0f, 0.0f), PERIOD));\n	float c = random(mod(i + vec2(0.0f, 1.0f), PERIOD));\n	float d = random(mod(i + vec2(1.0f, 1.0f), PERIOD));\n	vec2 cb = f * f * (3.0f - 2.0f * f);\n\n	return mix(a, b, cb.x) + (c - a) * cb.y * (1.0f - cb.x) + (d - b) * cb.x * cb.y;\n}\n\nvoid main() {\n	float v = tilingNoise(vTextureCoord);\n	fragColor = vec4(v, 0.0f, 0.0f, 1.0f);\n}", Ks = "uniform sampler2D noiseTexture;\nfloat noise(in vec2 uv) {\n	vec4 color = texture2D(noiseTexture, uv * 0.0625);\n	return color.r;\n}", qs = { noise: {
	fragment: Gs,
	width: 128,
	height: 128,
	format: PIXI.FORMATS.RED,
	wrapMode: PIXI.WRAP_MODES.REPEAT,
	scaleMode: PIXI.SCALE_MODES.LINEAR
} }, Js = new Hs(qs), Ys = { noise: {
	textures: ["noise"],
	regex: /float noise\(in vec2 uv\)[\s\S]*?\}/,
	optimizedShader: Ks.trim(),
	samplerNames: { noise: "noiseTexture" }
} };
function Xs(e, t, n, r) {
	let i = t.apply();
	if (t.applied.length === 0) return n;
	e.defaultUniforms && r && t.patchUniforms(e.defaultUniforms, r);
	let a = e.prototype._preRender;
	return e.prototype._preRender = function(...e) {
		a?.call(this, ...e);
		let n = this.renderer?.gl ?? canvas.app?.renderer?.gl;
		t.patchUniforms(this.uniforms, n);
	}, i;
}
var Zs = [
	"GhostLightIlluminationShader",
	"GhostLightColorationShader",
	"FairyLightIlluminationShader",
	"FairyLightColorationShader",
	"BewitchingWaveIlluminationShader",
	"BewitchingWaveColorationShader",
	"FogColorationShader",
	"VortexIlluminationShader",
	"VortexColorationShader",
	"SmokePatchIlluminationShader",
	"SmokePatchColorationShader",
	"BlackHoleDarknessShader",
	"LightDomeColorationShader",
	"RoilingDarknessShader",
	"StarLightColorationShader",
	"FlameColorationShader",
	"MagicalGloomDarknessShader"
];
function Qs(e, t) {
	return new Ws(Js, Ys, e, t);
}
function $s() {
	for (let e of Zs) {
		let t = r.getShaderByName(e);
		if (!t) {
			console.warn(`[PrimePerformance] precomputedNoiseTextures: shader class not found: ${e}`);
			continue;
		}
		let i = t.fragmentShader, a = Qs(t, i), o = a.apply();
		a.patchUniforms(t.defaultUniforms), t.fragmentShader = o, libWrapper.register(n, `foundry.canvas.rendering.shaders.${e}.prototype.update`, function(e, ...t) {
			return this.uniforms.noiseTexture = Js.getTexture("noise"), e(...t);
		}, "WRAPPER");
	}
}
function ec() {
	for (let e of Zs) {
		let t = r.getShaderByName(e);
		if (!t) {
			console.warn(`[PrimePerformance] precomputedNoiseTextures: shader class not found: ${e}`);
			continue;
		}
		let i = `foundry.canvas.rendering.shaders.${e}`, a = Qs(t);
		libWrapper.register(n, `${i}.prototype.update`, function(e, ...t) {
			return a.patchUniforms(this.uniforms), e(...t);
		}, "WRAPPER"), libWrapper.register(n, `${i}._createFragmentShader`, function(e, ...t) {
			let n = e(...t);
			return a.setSource(n), a.apply("noise");
		}, "WRAPPER");
	}
}
function tc() {
	!C(e.PrecomputedNoiseTextures) || !r.hasCanvas || Hooks.once("canvasInit", () => {
		let e = canvas.app?.renderer;
		e && (Js.generate(e), r.generation >= 14 ? ec() : $s());
	});
}
//#endregion
//#region src/hacks/3d-textures/shaders/quad.vert
var nc = "#version 300 es\nin vec2 aVertexPosition;\nvoid main() {\n	gl_Position = vec4(aVertexPosition, 0.0, 1.0);\n}";
//#endregion
//#region src/hacks/3d-textures/generateAtlas3D.ts
function rc(e, t, n) {
	let r = e.createShader(t);
	if (e.shaderSource(r, n), e.compileShader(r), !e.getShaderParameter(r, e.COMPILE_STATUS)) {
		let t = e.getShaderInfoLog(r);
		throw e.deleteShader(r), Error(`Shader compile error: ${t}\n${n}`);
	}
	return r;
}
function ic(e, t) {
	let { width: n, height: r, depth: i, fragSrc: a, wrapR: o = e.CLAMP_TO_EDGE, label: s } = t, c = e.createTexture();
	e.bindTexture(e.TEXTURE_3D, c), e.texImage3D(e.TEXTURE_3D, 0, e.RGBA8, n, r, i, 0, e.RGBA, e.UNSIGNED_BYTE, null), e.texParameteri(e.TEXTURE_3D, e.TEXTURE_MIN_FILTER, e.LINEAR), e.texParameteri(e.TEXTURE_3D, e.TEXTURE_MAG_FILTER, e.LINEAR), e.texParameteri(e.TEXTURE_3D, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE), e.texParameteri(e.TEXTURE_3D, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE), e.texParameteri(e.TEXTURE_3D, e.TEXTURE_WRAP_R, o);
	let l = rc(e, e.VERTEX_SHADER, nc), u = rc(e, e.FRAGMENT_SHADER, a), d = e.createProgram();
	if (e.attachShader(d, l), e.attachShader(d, u), e.linkProgram(d), !e.getProgramParameter(d, e.LINK_STATUS)) throw Error(`Program link error: ${e.getProgramInfoLog(d)}`);
	e.useProgram(d);
	let f = e.getUniformLocation(d, "uSlice"), p = e.getAttribLocation(d, "aVertexPosition"), m = e.createBuffer();
	e.bindBuffer(e.ARRAY_BUFFER, m), e.bufferData(e.ARRAY_BUFFER, new Float32Array([
		-1,
		-1,
		1,
		-1,
		-1,
		1,
		-1,
		1,
		1,
		-1,
		1,
		1
	]), e.STATIC_DRAW), e.enableVertexAttribArray(p), e.vertexAttribPointer(p, 2, e.FLOAT, !1, 0, 0);
	let h = e.createFramebuffer();
	e.bindFramebuffer(e.FRAMEBUFFER, h), e.viewport(0, 0, n, r);
	for (let t = 0; t < i; t++) e.framebufferTextureLayer(e.FRAMEBUFFER, e.COLOR_ATTACHMENT0, c, 0, t), e.uniform1f(f, t), e.drawArrays(e.TRIANGLES, 0, 6);
	return e.bindFramebuffer(e.FRAMEBUFFER, null), e.deleteFramebuffer(h), e.deleteBuffer(m), e.deleteProgram(d), e.deleteShader(l), e.deleteShader(u), s && console.log(`[${s}] Generated 3D texture ${n}×${r}×${i} RGBA8 on GPU`), c;
}
//#endregion
//#region src/hacks/3d-textures/shaders/snoise3dAtlasGen.frag
var ac = "#version 300 es\nprecision mediump float;\nuniform float uSlice;\nout vec4 fragColor;\n\nvec3 mod289(in vec3 x) {\n	return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n\nvec4 mod289(in vec4 x) {\n	return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n\nvec4 permute(in vec4 x) {\n	return mod289(((x * 34.0) + 1.0) * x);\n}\n\nvec4 taylorInvSqrt(in vec4 r) {\n	return 1.79284291400159 - 0.85373472095314 * r;\n}\n\nvec3 fade(in vec3 t) {\n	return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);\n}\n\nfloat snoise(in vec3 P, in vec3 rep) {\n	vec3 Pi0 = mod(floor(P), rep);\n	vec3 Pi1 = mod(Pi0 + vec3(1.0), rep);\n	Pi0 = mod289(Pi0);\n	Pi1 = mod289(Pi1);\n	vec3 Pf0 = fract(P);\n	vec3 Pf1 = Pf0 - vec3(1.0);\n	vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);\n	vec4 iy = vec4(Pi0.yy, Pi1.yy);\n	vec4 iz0 = Pi0.zzzz;\n	vec4 iz1 = Pi1.zzzz;\n\n	vec4 ixy = permute(permute(ix) + iy);\n	vec4 ixy0 = permute(ixy + iz0);\n	vec4 ixy1 = permute(ixy + iz1);\n\n	vec4 gx0 = ixy0 * (1.0 / 7.0);\n	vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;\n	gx0 = fract(gx0);\n	vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);\n	vec4 sz0 = step(gz0, vec4(0.0));\n	gx0 -= sz0 * (step(0.0, gx0) - 0.5);\n	gy0 -= sz0 * (step(0.0, gy0) - 0.5);\n\n	vec4 gx1 = ixy1 * (1.0 / 7.0);\n	vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;\n	gx1 = fract(gx1);\n	vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);\n	vec4 sz1 = step(gz1, vec4(0.0));\n	gx1 -= sz1 * (step(0.0, gx1) - 0.5);\n	gy1 -= sz1 * (step(0.0, gy1) - 0.5);\n\n	vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);\n	vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);\n	vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);\n	vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);\n	vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);\n	vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);\n	vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);\n	vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);\n\n	vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));\n	g000 *= norm0.x;\n	g010 *= norm0.y;\n	g100 *= norm0.z;\n	g110 *= norm0.w;\n	vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));\n	g001 *= norm1.x;\n	g011 *= norm1.y;\n	g101 *= norm1.z;\n	g111 *= norm1.w;\n\n	float n000 = dot(g000, Pf0);\n	float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));\n	float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));\n	float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));\n	float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));\n	float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));\n	float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));\n	float n111 = dot(g111, Pf1);\n\n	vec3 fade_xyz = fade(Pf0);\n	vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);\n	vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);\n	float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);\n	return 2.2 * n_xyz;\n}\n\nfloat snoise(in vec3 v) {\n	const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);\n	const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);\n\n	vec3 i = floor(v + dot(v, C.yyy));\n	vec3 x0 = v - i + dot(i, C.xxx);\n	vec3 g = step(x0.yzx, x0.xyz);\n	vec3 l = 1.0 - g;\n	vec3 i1 = min(g.xyz, l.zxy);\n	vec3 i2 = max(g.xyz, l.zxy);\n	vec3 x1 = x0 - i1 + C.xxx;\n	vec3 x2 = x0 - i2 + 2.0 * C.xxx;\n	vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;\n	i = mod(i, 289.0);\n\n	vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));\n\n	float n_ = 1.0 / 7.0;\n	vec3 ns = n_ * D.wyz - D.xzx;\n	vec4 j = p - 49.0 * floor(p * ns.z * ns.z);\n	vec4 x_ = floor(j * ns.z);\n	vec4 y_ = floor(j - 7.0 * x_);\n	vec4 xx = x_ * ns.x + ns.yyyy;\n	vec4 yy = y_ * ns.x + ns.yyyy;\n	vec4 h = 1.0 - abs(xx) - abs(yy);\n	vec4 b0 = vec4(xx.xy, yy.xy);\n	vec4 b1 = vec4(xx.zw, yy.zw);\n	vec4 s0 = floor(b0) * 2.0 + 1.0;\n	vec4 s1 = floor(b1) * 2.0 + 1.0;\n	vec4 sh = -step(h, vec4(0.0));\n	vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;\n	vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;\n	vec3 p0 = vec3(a0.xy, h.x);\n	vec3 p1 = vec3(a0.zw, h.y);\n	vec3 p2 = vec3(a1.xy, h.z);\n	vec3 p3 = vec3(a1.zw, h.w);\n	vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));\n	p0 *= norm.x;\n	p1 *= norm.y;\n	p2 *= norm.z;\n	p3 *= norm.w;\n\n	vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);\n	m *= m;\n	return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));\n}\n\nfloat packSno(float v) {\n	return clamp(v / 4.4 + 0.5, 0.0, 1.0);\n}\nfloat packSnr(float v) {\n	return clamp(v / 2.0 + 0.5, 0.0, 1.0);\n}\n\nvoid main() {\n	\n	\n	\n	\n	\n	\n	\n	float x = (gl_FragCoord.x - 0.5) / 16.0;\n	float y = (gl_FragCoord.y - 0.5) / 16.0;\n	float z = uSlice;\n\n	\n	float pVal = snoise(vec3(x, y, z), vec3(10.0));\n	\n	float pDeriv = (snoise(vec3(x, y, z + 0.5), vec3(10.0)) - snoise(vec3(x, y, z - 0.5), vec3(10.0))) / 1.0;\n\n	\n	float sVal = snoise(vec3(x, y, z));\n	\n	float sDeriv = (snoise(vec3(x, y, z + 0.5)) - snoise(vec3(x, y, z - 0.5))) / 1.0;\n\n	fragColor = vec4(packSno(pVal), packSno(pDeriv), packSnr(sVal), packSnr(sDeriv));\n}", oc = "#version 300 es\nprecision mediump float;\nuniform float uSlice;\nout vec4 fragColor;\n\nconst float TWOPI = 6.283185307179586;\nconst float VOR_INNER = 512.0;\nconst float VOR_TILE = VOR_INNER + 2.0;    \nconst float VOR_CELLS = 64.0;\nconst float VOR_TOTAL = 64.0;\n\nfloat tilingRandom(vec2 uv) {\n	uv = mod(uv, VOR_CELLS);\n	float f = fract((2.41 * uv.x + 2.27 * uv.y) * 251.19);\n	return fract((5.23 * uv.x + 2.89 * uv.y) * f * 551.83);\n}\n\nvec3 voronoiTiling(vec2 uv, float t) {\n	vec2 uvi = floor(uv);\n	vec2 uvf = fract(uv);\n	float bestDist2 = 100.0;\n	vec2 bestUVR = vec2(0.0);\n	float bestDist = 10.0;\n\n	for (int oy = -1; oy <= 1; oy++) {\n		for (int ox = -1; ox <= 1; ox++) {\n			vec2 uvn = vec2(float(ox), float(oy));\n			float rnd = tilingRandom(uvi + uvn);\n			float r1 = 0.5 * sin(TWOPI * rnd + t) + 0.5;\n			float r2 = 0.5 * sin(TWOPI * r1 + t) + 0.5;\n			vec2 uvr = vec2(r2);\n			vec2 diff = uvn + uvr - uvf;\n			float dist2 = dot(diff, diff);\n			if (dist2 < bestDist2) {\n				bestDist2 = dist2;\n				bestUVR = uvr;\n				bestDist = sqrt(dist2);\n			}\n		}\n	}\n\n	return vec3(bestUVR, clamp(bestDist, 0.0, 1.0));\n}\n\nvoid main() {\n	\n	\n	\n	\n	vec2 uvCell = mod((gl_FragCoord.xy - 0.5) / VOR_INNER * VOR_CELLS, VOR_CELLS);\n\n	float t = (uSlice / VOR_TOTAL) * TWOPI;\n	vec3 result = voronoiTiling(uvCell, t);\n	fragColor = vec4(result, 1.0);\n}", sc = "#version 300 es\n#define SHADER_NAME generate-voronoi\nprecision mediump float;\n\nin vec2 vTextureCoord;\nout vec4 fragColor;\n\nfloat hashToFloat(in uint x) {\n	return float(x) * (1.0 / 4294967295.0);\n}\n\nuint mixHash32(in uint x) {\n	x ^= x >> 16;\n	x *= 0x85ebca6bU;\n	x ^= x >> 13;\n	x *= 0xc2b2ae35U;\n	x ^= x >> 16;\n	return x;\n}\n\nuint hashVec2_u(in uvec2 uv) {\n	uint h = uv.x * 0x9E3779B1u;\n	h ^= uv.y + 0x85ebca6bu;\n	return mixHash32(h);\n}\n\nfloat hashFloatFromVec2(in vec2 position) {\n	uvec2 uv = uvec2(floatBitsToUint(position.x), floatBitsToUint(position.y));\n	return hashToFloat(hashVec2_u(uv));\n}\n\nuint hashUInt(in uint x) {\n	return mixHash32(x);\n}\n\nfloat hashFloat(in float val) {\n	uint bits = floatBitsToUint(val);\n	return hashToFloat(hashUInt(bits));\n}\n\nvec2 hashVec2To2D(in vec2 position) {\n	uvec2 uv = uvec2(floatBitsToUint(position.x), floatBitsToUint(position.y));\n	uint h1 = hashVec2_u(uv);\n	uint h2 = mixHash32(h1 ^ 0xDEADBEEFu);\n	return vec2(hashToFloat(h1), hashToFloat(h2));\n}\n\nconst float PERIOD = 64.0f;\n\nvec3 voronoiPrecompute(in vec2 uv) {\n	vec2 p = floor(uv);\n	vec2 f = fract(uv);\n\n	float minDist = 8.0f;\n	vec2 val = vec2(0.0f);\n\n	for (int j = -2; j <= 2; j++) {\n		for (int i = -2; i <= 2; i++) {\n			vec2 id = vec2(float(i), float(j));\n			\n			vec2 point = hashVec2To2D(mod(p + id, PERIOD));\n			vec2 realPoint = id + point - f;\n\n			float d = dot(realPoint, realPoint);\n			if (d < minDist) {\n				minDist = d;\n				val = point;\n			}\n		}\n	}\n\n	\n	\n	return vec3(val, clamp(minDist, 0.0f, 1.0f));\n}\n\nvoid main() {\n	\n	vec3 result = voronoiPrecompute(vTextureCoord * PERIOD);\n	fragColor = vec4(result, 1.0f);\n}", cc = "#version 300 es\n#define SHADER_NAME generate-voronoi-power16\nprecision mediump float;\n\nin vec2 vTextureCoord;\nout vec4 fragColor;\n\nfloat hashToFloat(in uint x) {\n	return float(x) * (1.0 / 4294967295.0);\n}\n\nuint mixHash32(in uint x) {\n	x ^= x >> 16;\n	x *= 0x85ebca6bU;\n	x ^= x >> 13;\n	x *= 0xc2b2ae35U;\n	x ^= x >> 16;\n	return x;\n}\n\nuint hashVec2_u(in uvec2 uv) {\n	uint h = uv.x * 0x9E3779B1u;\n	h ^= uv.y + 0x85ebca6bu;\n	return mixHash32(h);\n}\n\nfloat hashFloatFromVec2(in vec2 position) {\n	uvec2 uv = uvec2(floatBitsToUint(position.x), floatBitsToUint(position.y));\n	return hashToFloat(hashVec2_u(uv));\n}\n\nuint hashUInt(in uint x) {\n	return mixHash32(x);\n}\n\nfloat hashFloat(in float val) {\n	uint bits = floatBitsToUint(val);\n	return hashToFloat(hashUInt(bits));\n}\n\nvec2 hashVec2To2D(in vec2 position) {\n	uvec2 uv = uvec2(floatBitsToUint(position.x), floatBitsToUint(position.y));\n	uint h1 = hashVec2_u(uv);\n	uint h2 = mixHash32(h1 ^ 0xDEADBEEFu);\n	return vec2(hashToFloat(h1), hashToFloat(h2));\n}\n\nfloat voronoiPower16(in vec2 point) {\n	vec2 cell = floor(point);\n	vec2 frac = fract(point);\n	float res = 0.0f;\n\n	for (int j = -1; j <= 1; j++) {\n		for (int i = -1; i <= 1; i++) {\n			vec2 neighbor = vec2(i, j);\n			vec2 r = neighbor - frac + hashVec2To2D(mod(cell + neighbor, 16.0f));\n			float dr = dot(r, r);\n			dr = dr * dr * dr * dr * dr * dr * dr * dr;\n			res += 1.0f / dr;\n		}\n	}\n	return pow(1.0f / res, 1.0f / 16.0f);\n}\n\nvoid main() {\n	const float PERIOD = 16.0f;\n	vec2 point = vTextureCoord * PERIOD;\n	float v = clamp(voronoiPower16(point), 0.0f, 1.0f);\n	fragColor = vec4(v, 0.0f, 0.0f, 1.0f);\n}", lc = "float fbm(in vec2 uv, in float smoothness) {\n	float s = exp2(-smoothness);\n	float f = 1.0;\n	float a = 1.0;\n	float t = 0.0;\n\n	t += a * noise(f * uv);\n	f *= 2.0;\n	a *= s;\n\n	t += a * noise(f * uv);\n	f *= 2.0;\n	a *= s;\n\n	t += a * noise(f * uv);\n\n	return t;\n}", uc = "uniform sampler2D noiseTexture;\nfloat fnoise(in vec2 coords) {\n	vec4 color = texture2D(noiseTexture, coords * 0.0625);\n	return color.r;\n}", dc = "const float TWOPI = 6.283185307179586;\nconst float INVPI = 0.3183098861837907;\nconst float INVTWOPI = 0.15915494309189535;\nconst float SQRT2 = 1.4142135623730951;\nconst float SQRT1_2 = 0.7071067811865476;\nconst float SQRT3 = 1.7320508075688772;\nconst float SQRT1_3 = 0.5773502691896257;\nconst vec3 BT709 = vec3(0.2126, 0.7152, 0.0722);\nfloat perceivedBrightness(in vec3 color) {\n	return sqrt(dot(BT709, color * color));\n}\nfloat perceivedBrightness(in vec4 color) {\n	return perceivedBrightness(color.rgb);\n}\nconst int octaves = 4;\nuniform vec3 colorBase;\nuniform vec3 colorStreaks;\nuniform vec3 colorArcLight;\nuniform vec3 colorGlow;\nuniform float time;\nuniform float patternSize;\nuniform float noiseAmount;\nuniform float streaksXAxisAmount;\nuniform float noiseResolution;\nuniform float edgeGlowStrength;\nuniform bool enableStreaks;\nuniform bool enableEdgeGlow;\nuniform bool enableAlphaStreaks;\nuniform highp vec4 meshDimensions;\nin vec2 vMeshUvs;\n\nfloat computeEdgeFalloff(in vec2 uv, in vec2 resolution, in float falloffPixels) {\n	float distToLeft = uv.x;\n	float distToRight = 1.0 - uv.x;\n	float distToTop = uv.y;\n	float distToBottom = 1.0 - uv.y;\n	float d = min(min(distToLeft, distToRight), min(distToTop, distToBottom));\n	float minRes = min(resolution.x, resolution.y);\n	float edgeWidth = falloffPixels / minRes;\n	return smoothstep(0.0, edgeWidth, d);\n}\n\nuniform mediump sampler3D snoiseAtlas3D;\nconst float SNO_PERIOD = 10.0;\n\nfloat snoUnpack(float p) {\n	return (p - 0.5) * 4.4;\n}\n\nfloat snrUnpack(float p) {\n	return (p - 0.5) * 2.0;\n}\n\nfloat snoise(in vec3 P, in vec3 rep) {\n	vec3 uvw = vec3(mod(P.xy, SNO_PERIOD) / SNO_PERIOD, mod(P.z, SNO_PERIOD) / SNO_PERIOD);\n	return snoUnpack(texture(snoiseAtlas3D, uvw).r);\n}\n\nfloat snoise(in vec3 v) {\n	vec3 uvw = vec3(mod(v.xy, SNO_PERIOD) / SNO_PERIOD, mod(v.z, SNO_PERIOD) / SNO_PERIOD);\n	return snrUnpack(texture(snoiseAtlas3D, uvw).b);\n}\nuniform sampler2D voronoiP16Texture;\nconst float VORONOI_POWER_16_PERIOD = 16.0;\nconst float VORONOI_POWER_16_PERIOD_FRAC = 1.0 / VORONOI_POWER_16_PERIOD;\n\nfloat voronoiPower16(in vec2 point) {\n	vec2 uv = mod(point, VORONOI_POWER_16_PERIOD) * VORONOI_POWER_16_PERIOD_FRAC;\n	return texture(voronoiP16Texture, uv).r;\n}\n\nuniform float arcLightningSpeedFactor;\nuniform float arcLightningTimeSliceModifier;\nuniform float arcLightningAmplitudeSliceModifier;\nuniform bool enableChromaticArcLightning;\nuniform bool enableArcLightningMotion;\nuniform bool enableArcLightning;\nuniform float arcLightningIntensity;\nuniform vec2 arcLightningResolution;\n\nconst float ARC_LIGHT_ITERS = 13.0;\n\nvec4 arcLightningEffect(in vec2 uv, in vec4 meshDimensions) {\n	float lum = 0.0;\n\n	vec4 accumulator = vec4(1.0, 2.0, 3.0, 0.0);\n	vec4 accumulatorRef = accumulator;\n\n	vec2 baseDimensions = vec2(meshDimensions.z, meshDimensions.w);\n	vec2 transformedDimensions = baseDimensions * arcLightningResolution;\n	vec2 offset = 0.5 * (baseDimensions - transformedDimensions);\n	vec2 localCoord = uv * transformedDimensions + offset;\n	vec2 uvTransformed = 0.2 * (localCoord - 0.5 * transformedDimensions) / transformedDimensions.y;\n\n	float amplitude = 0.25;\n	float timeFactor = time * arcLightningSpeedFactor;\n	float index = 0.0;\n	float motion = -0.8;\n	vec2 oBaseDimensions = baseDimensions;\n\n	if (!enableArcLightning) {\n		return vec4(uv, 0.0, 1.0);\n	} while (++index < ARC_LIGHT_ITERS) {\n		accumulator += (1.0 + cos(accumulatorRef + timeFactor)) / length((1.0 + index * dot(oBaseDimensions, oBaseDimensions)) * sin(1.5 * uvTransformed / (0.5 - dot(uvTransformed, uvTransformed)) - 9.0 * uvTransformed.yx + timeFactor));\n\n		timeFactor += arcLightningTimeSliceModifier;\n		amplitude += arcLightningAmplitudeSliceModifier;\n\n		\n		\n		\n		oBaseDimensions = cos(timeFactor - 7.0 * uvTransformed * amplitude) - 5.0 * uvTransformed;\n\n		if (enableArcLightningMotion) {\n			motion = 0.02 * timeFactor;\n		}\n\n		\n		\n		\n		\n		\n		uvTransformed *= mat2(cos(index + motion - vec4(0.0, 11.0, 33.0, 0.0)));\n		vec2 warpArg = 40.0 * dot(uvTransformed, uvTransformed) * cos(100.0 * uvTransformed.yx + timeFactor);\n		uvTransformed += clamp(warpArg, -1.0, 1.0) / 200.0 + 0.2 * amplitude * uvTransformed;\n	}\n\n	accumulator = 20.6 / (min(accumulator, 13.0) + 164.0 / accumulator) - dot(uvTransformed, uvTransformed) / 250.0;\n\n	if (arcLightningIntensity != 1.0) {\n		accumulator = pow(accumulator, vec4(1.0 / arcLightningIntensity));\n	}\n\n	lum = perceivedBrightness(accumulator.rgb);\n	return vec4(accumulator.rgb, lum);\n}\n\nvec4 _main() {\n    \n	vec4 arcColor = vec4(0.0);\n	if (enableArcLightning) {\n		arcColor = clamp(arcLightningEffect(vMeshUvs, meshDimensions), vec4(0.0), vec4(1.0));\n		arcColor.rgb = mix(vec3(0.0), vec3(arcColor.a) * colorArcLight, arcColor.a);\n	}\n    \n	vec2 uv = (vMeshUvs - 0.5) * vec2(meshDimensions.z, meshDimensions.w);\n	uv /= patternSize;\n\n    \n\n	float uvx = cos(vMeshUvs.x + time);\n	uvx *= uvx;\n	float uvoTri = 0.5 + 0.5 * smoothstep(0.0, 1.0, abs(uvx));\n	float bgNoise = snoise(vec3(uv * noiseResolution + (1.0 - uvoTri), time * 0.4));\n	vec3 baseColorNoisy = clamp(colorBase + bgNoise * noiseAmount, 0.0, 1.0);\n\n    \n\n	float streaks = 0.0;\n	if (enableStreaks) {\n		float _xc = uv.x * streaksXAxisAmount;\n		float n1 = voronoiPower16((vec2(uv.y, _xc) + 0.05 * time) * 5.22) * uvoTri;\n		float n2 = voronoiPower16((vec2(_xc, uv.y) - 0.05 * time) * 4.13) * uvoTri;\n		float _m = min(n1, n2 * 1.1);\n		streaks = _m * _m * sqrt(_m);\n	}\n	vec3 streakColor = mix(baseColorNoisy, colorStreaks, streaks);\n\n    \n\n	float arcWeight = enableArcLightning ? smoothstep(0.7, 0.9, arcColor.a) : 0.0;\n	vec3 composite = mix(streakColor, arcColor.rgb, arcWeight);\n\n    \n\n	float falloff = computeEdgeFalloff(vMeshUvs, meshDimensions.zw, 25.0);\n	float edgeFactor = 1.0 - falloff;\n	float glow = enableEdgeGlow ? edgeFactor * edgeFactor * edgeGlowStrength : 0.0;\n	composite = mix(composite, colorGlow, glow);\n\n    \n\n	float arcMinAlpha = arcColor.a * arcColor.a * arcColor.a * arcColor.a;\n	float alphaStreaks = mix(0.25, 1.0, smoothstep(0.0, 0.25, max(streaks, arcMinAlpha)));\n	float alpha = enableAlphaStreaks ? min(alphaStreaks, max(max(0.9, arcColor.a), max(streaks, glow))) * falloff * tintAlpha.a : max(max(0.9, arcColor.a), max(streaks, glow)) * falloff * tintAlpha.a;\n	return vec4(composite, alpha);\n}", fc = "vec2 voronoiCircles(in vec2 coord, in float freq, in float time, in float radiusScale) {\n	const int radius = 1;\n	vec2 point = coord * freq;\n	vec2 ipoint = floor(point);\n	vec2 fpoint = fract(point);\n	vec2 icenter = vec2(0.0f);\n	float md = 1e10f;\n	float mr = 1e10f;\n\n	for (int y = -radius; y <= radius; ++y) {\n		for (int x = -radius; x <= radius; ++x) {\n			vec2 offset = vec2(x, y);\n			vec2 c = voronoiCenter(offset, ipoint, time);\n			vec2 dv = c - fpoint;\n			float d = dot(dv, dv);\n			if (d < md) {\n				mr = md;\n				md = d;\n				icenter = offset;\n			} else if (d < mr) {\n				mr = d;\n			}\n		}\n	}\n\n	md = sqrt(md);\n	mr = sqrt(mr) * 0.5f * radiusScale * 0.28f;\n	if (md < mr)\n		return vec2(md / mr, voronoiValue(icenter + ipoint));\n	return vec2(0.0f, -2.0f);\n}", pc = "vec4 motesLayers(vec2 coord, float time) {\n	float mask = smoothstep(0.8f, 1.0f, fbmHash(coord * 5.0f + time * 0.1f, 1.0f));\n	if (verticalFade)\n		mask *= (vMeshCoord.y * vMeshCoord.y);\n	if (mask < (1.0f / 255.0f))\n		return vec4(0.0f);\n\n	vec4 color = vec4(0.0f);\n	color = max(color, motes(voronoiCircles(coord + vec2(6.518f), 6.050f, time * 0.6f + 8.513f, 1.0f)));\n	if (pass > 1.0f)\n		color = max(color, motes(voronoiCircles(coord + vec2(3.584f), 8.018f, time * 0.8f + 4.214f, 1.0f)));\n	if (pass > 2.0f)\n		color = max(color, motes(voronoiCircles(coord + vec2(0.493f), 9.987f, time + 2.321f, 1.0f)));\n	return color * mask;\n}", mc = "#define TYPE_RAIN    0\n#define TYPE_FOG     1\n#define TYPE_POLLEN  2\n#define octaves 2\n#define period 10\nuniform sampler2D pixelTexture;\nuniform float uEdgeBlendPx;\nuniform float uTime;\nuniform float uWindAngle;\nuniform float uWindCos;\nuniform float uWindSin;\nuniform float uWindSpeed;\n\nuniform float uRainRotation;\nuniform vec2 uRainResolution;\nuniform float uRainStrength;\nuniform float uRainOpacity;\nuniform vec3 uRainTint;\n\nuniform int uFogOctaves;\nuniform float uFogSlope;\nuniform float uFogRotation;\nuniform float uFogScale;\nuniform vec3 uFogTint;\n\nuniform float uPollenOpacity;\nuniform vec3 uPollenTint;\nuniform float uPollenCellWorldPx;\nuniform float uPollenDotRadiusPx;\nuniform float uPollenTwinkle;\nuniform float uPollenFlow;\nuniform float uPollenDrift;\nuniform float uPollenKnotScale;\n\nuniform float uPollenHazeOpacity;\nuniform float uPollenHazeScale;\nuniform float uPollenHazeSoftness;\n\nuniform int uCloudType;\nuniform vec3 uCloudTint;\nuniform float uCloudCoverage;\nuniform float uCloudShadowIntensity;\nuniform float uCloudScale;\nuniform float uCloudDetailScale;\nuniform float uCloudLacunarity;\nuniform float uCloudSoftness;\nuniform float uCloudContrast;\nuniform float uCloudAnisotropy;\nuniform float uCloudFlow;\nuniform float uCloudDrift;\nuniform float uCloudMaxAlpha;\nuniform float uCloudDepthScale;\nuniform float uCloudDepthAmount;\nuniform float uCloudSwirlScale;\nuniform float uCloudSwirlStrength;\nuniform float uCloudCoreGamma;\nuniform float uCloudEdgeDetailFade;\nuniform float uCloudCoreIntensity;\n\nuniform sampler2D cloudTexture;\nuniform float uCloudTexWorldSizePx;\nuniform float uCloudTexSwirlStrength;\nuniform float uCloudTexDriftMult;\nuniform float uCloudRainCreate;\nuniform float uCloudRainBoostCoverage;\nuniform float uCloudRainBoostIntensity;\n\nuniform float uDarknessLevel;\nuniform float uZoomLevel;\n\nuniform vec3 uMoonColor[6];\nuniform float uMoonWeight[6];\nuniform float uMoonRadiusScale[6];\nuniform float uMoonWeightSum;\nuniform float uMoteChance;\nuniform float uMoteAlpha;\nuniform float uMoteMinZoom;\nuniform float uMoteVisibleSec;\nuniform float uMoteFadeInSec;\nuniform float uMoteFadeOutSec;\nuniform float uMoteOffSec;\nuniform float uMoteHexEdgeFadePx;\nuniform float uMoteTimeScale;\nuniform float uMoteResolution;\n\nuniform highp vec2 uRegionOrigin;\nuniform highp float uHexSizePx;\nin vec2 vWorldPx;\nconst int EDGE_COUNT = 6;\nconst int NEIGHBOR_COUNT = EDGE_COUNT + 1;\nuint gPacked7[NEIGHBOR_COUNT];\nfloat perceivedBrightness(in vec3 color) {\n	return sqrt(dot(BT709, color * color));\n}\nfloat perceivedBrightness(in vec4 color) {\n	return perceivedBrightness(color.rgb);\n}\nfloat reversePerceivedBrightness(in vec3 color) {\n	return 1.0 - perceivedBrightness(color);\n}\nfloat reversePerceivedBrightness(in vec4 color) {\n	return 1.0 - perceivedBrightness(color.rgb);\n}\nfloat random(in vec2 uv) {\n	uv = mod(uv, 1000.0);\n	return fract(dot(uv, vec2(5.23, 2.89) * fract((2.41 * uv.x + 2.27 * uv.y) * 251.19)) * 551.83);\n}\nuniform mediump sampler3D voronoiAtlas3D;\n\nconst float VOR_INNER = 512.0;\nconst float VOR_TILE = VOR_INNER + 2.0;    \nconst float VOR_CELLS = 64.0;\nconst float VOR_TOTAL = 64.0;\nconst float VOR_PERIOD = 6.283185307179586; \n\nvec3 voronoi(in vec2 uv, in float t, in float zd) {\n	float tIdx = fract(t / VOR_PERIOD) * VOR_TOTAL;\n\n	vec2 macroCell = floor(uv / VOR_CELLS);\n	vec2 h = fract(sin(vec2(dot(macroCell, vec2(127.1, 311.7)), dot(macroCell, vec2(269.5, 183.3)))) * 43758.5453);\n	vec2 uvCell = mod(uv + floor(h * VOR_CELLS), VOR_CELLS);\n\n	\n	vec2 sampleUV = (uvCell / VOR_CELLS * VOR_INNER + 1.0) / VOR_TILE;\n	\n	float sampleW = (tIdx + 0.5) / VOR_TOTAL;\n\n	return texture(voronoiAtlas3D, vec3(sampleUV, sampleW)).rgb;\n}\nvec3 voronoi(vec2 vuv, float zd) {\n	return voronoi(vuv, 0.0, zd);\n}\nvec3 voronoi(vec3 vuv, float zd) {\n	return voronoi(vuv.xy, vuv.z, zd);\n}\n\nuint mixHash32(in uint x) {\n	x ^= x >> 16;\n	x *= 0x85ebca6bU;\n	x ^= x >> 13;\n	x *= 0xc2b2ae35U;\n	x ^= x >> 16;\n	return x;\n}\n\nuint hashUInt(in uint x) {\n	return mixHash32(x);\n}\n\nfloat hashToFloat(in uint x) {\n	return float(x) * (1.0 / 4294967295.0);\n}\n\nfloat hashFloat(in float val) {\n	uint bits = floatBitsToUint(val);\n	return hashToFloat(hashUInt(bits));\n}\n\nuint hashVec2_u(in uvec2 uv) {\n    \n	uint h = uv.x * 0x9E3779B1u; \n\n	h ^= uv.y + 0x85ebca6bu;\n	return mixHash32(h);\n}\n\nfloat hashFloatFromVec2(in vec2 position) {\n	uvec2 uv = uvec2(floatBitsToUint(position.x), floatBitsToUint(position.y));\n	return hashToFloat(hashVec2_u(uv));\n}\n\nvec2 hashVec2To2D(in vec2 position) {\n	uvec2 uv = uvec2(floatBitsToUint(position.x), floatBitsToUint(position.y));\n	uint h1 = hashVec2_u(uv);\n	uint h2 = mixHash32(h1 ^ 0xDEADBEEFu);\n	return vec2(hashToFloat(h1), hashToFloat(h2));\n}\n\nbool hashBool(in float val) {\n	return (hashFloat(val) > 0.5);\n}\n\nfloat valueNoise(in vec2 uv) {\n    \n	vec2 i = floor(uv);\n	vec2 f = fract(uv);\n\n    \n\n	f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);\n\n    \n\n	float c00 = hashFloatFromVec2(i);\n	float c10 = hashFloatFromVec2(i + vec2(1.0, 0.0));\n	float c01 = hashFloatFromVec2(i + vec2(0.0, 1.0));\n	float c11 = hashFloatFromVec2(i + vec2(1.0, 1.0));\n\n    \n\n	return mix(mix(c00, c10, f.x), mix(c01, c11, f.x), f.y);\n}\n\nfloat fbmHash(in vec2 uv, in float smoothness) {\n	float lacunarity = 2.0;\n	float gain = exp2(-smoothness);\n	float sum = 0.0;\n	float amp = 1.0;\n\n    \n\n	for (int i = 0; i < 5; i++) {\n		sum += amp * valueNoise(uv);\n		uv *= lacunarity;\n		amp *= gain;\n	}\n	return sum;\n}\nvec2 voronoiCenter(in vec2 local, in vec2 global, in float time) {\n	vec2 point = local + global;\n	return local + vec2(-0.5 +\n		(sin(time * hashVec2To2D(point) + 1.0) * 0.5 * 1.928) * 0.5 + 0.5);\n}\nfloat voronoiValue(in vec2 coord) {\n	return hashFloatFromVec2(coord);\n}\nvec2 voronoiCircles(in vec2 coord, in float freq, in float time, in float radiusScale) {\n	const int radius = 1;\n	vec2 point = coord * freq;\n	vec2 ipoint = floor(point);\n	vec2 fpoint = fract(point);\n	vec2 center = fpoint;\n	vec2 icenter = vec2(0.0);\n	float md = 1e10;\n	float mr = 1e10;\n\n    \n\n	for (int y = -radius; y <= radius; ++y) {\n		for (int x = -radius; x <= radius; ++x) {\n			vec2 offset = vec2(x, y);\n			vec2 c = voronoiCenter(offset, ipoint, time);\n			float d = dot(c - fpoint, c - fpoint);\n			if (d < md) {\n				md = d;\n				center = c;\n				icenter = offset;\n			}\n\n		}\n\n	}\n    \n	for (int y = -radius; y <= radius; ++y) {\n		for (int x = -radius; x <= radius; ++x) {\n			if ((x == 0) && (y == 0))\n				continue;\n			vec2 offset = icenter + vec2(x, y);\n			vec2 c = voronoiCenter(offset, ipoint, time);\n			float d = dot(c - fpoint, c - fpoint);\n			if (d < mr)\n				mr = d;\n		}\n\n	}\n	md = sqrt(md);\n	mr = sqrt(mr) * 0.5 * radiusScale * 0.28;\n	if (md < mr)\n		return vec2(md / mr, voronoiValue(icenter + ipoint));\n	return vec2(0.0, -2.0);\n}\n\nuniform mediump sampler3D snoiseAtlas3D;\nconst float SNO_PERIOD = 10.0;\n\nfloat snoUnpack(float p) {\n	return (p - 0.5) * 4.4;\n}\n\nfloat snrUnpack(float p) {\n	return (p - 0.5) * 2.0;\n}\n\nfloat snoise(in vec3 P, in vec3 rep) {\n	vec3 uvw = vec3(mod(P.xy, SNO_PERIOD) / SNO_PERIOD, mod(P.z, SNO_PERIOD) / SNO_PERIOD);\n	return snoUnpack(texture(snoiseAtlas3D, uvw).r);\n}\n\nfloat snoise(in vec3 v) {\n	vec3 uvw = vec3(mod(v.xy, SNO_PERIOD) / SNO_PERIOD, mod(v.z, SNO_PERIOD) / SNO_PERIOD);\n	return snrUnpack(texture(snoiseAtlas3D, uvw).b);\n}\n\nfloat fbm3(in vec3 uv, in float smoothness) {\n	float s = exp2(-smoothness);\n	float f = 1.0;\n	float a = 1.0;\n	float t = 0.0;\n	for (int i = 0; i < octaves; i++) {\n		t += a * snoise(f * uv, vec3(period));\n		f *= 2.0;\n		a *= s;\n	}\n	return t;\n}\nvec4 premul(in vec3 rgb, in float a) {\n	return vec4(rgb * a, a);\n}\nvec4 overPD(in vec4 underPM, in vec4 overPM) {\n	return overPM + underPM * (1.0 - overPM.a);\n}\nfloat saturate(in float x) {\n	return clamp(x, 0.0, 1.0);\n}\nuint packFromRGBA(in vec4 t) {\n	ivec4 b = ivec4(floor(t * 255.0 + 0.5));\n	return uint((b.r & 255)) | (uint(b.g & 255) << 8u) | (uint(b.b & 255) << 16u) | (uint(b.a & 255) << 24u);\n}\n\nuint bitExtract(in uint v, in int off, in int width) {\n	return (v >> uint(off)) & uint((1 << width) - 1);\n}\n/* -------------------------------------------- */\n\nint bitOffsetOfType(in int typeId) {\n	return (typeId == 0) ? 0 : (4 + 2 * (typeId - 1));\n}\n/* -------------------------------------------- */\n\nint bitWidthOfType(in int typeId) {\n	return (typeId == 0) ? 4 : 2;\n}\n/* -------------------------------------------- */\n\nfloat invMaxOfType(in int typeId) {\n	return (typeId == 0) ? (1.0 / 4.0) : (1.0 / 3.0);\n}\n/* -------------------------------------------- */\n\nfloat strengthNorm(in uint packed, in int typeId) {\n	int off = bitOffsetOfType(typeId);\n	int w = bitWidthOfType(typeId);\n	float vmax = 1.0 / invMaxOfType(typeId);\n	float v = float(bitExtract(packed, off, w));\n	return clamp(v / vmax, 0.0, 1.0);\n}\n/* -------------------------------------------- */\n\nbool hasAnyEffect(in uint packed) {\n	return packed != 0u;\n}\nvec2 rotFast(in vec2 p, in float a) {\n	float s = -sin(a);\n	float c = cos(a);\n	return vec2(c * p.x - s * p.y, s * p.x + c * p.y);\n}\n/* -------------------------------------------- */\n\nfloat gammaShape(in float v, in float k) {\n	float t = clamp((k + 1.0) * 0.5, 0.0001, 0.9999);\n	float g = mix(0.5, 2.0, t);\n	return pow(saturate(v), g);\n}\n/* -------------------------------------------- */\n\nvec2 windSpace(in vec2 wpx) {\n	return vec2(uWindCos * wpx.x + uWindSin * wpx.y, -uWindSin * wpx.x + uWindCos * wpx.y);\n}\n/* -------------------------------------------- */\n\nvec3 flowField(in vec2 wp, in float adv) {\n	float advH = adv * 0.5;\n	vec2 sA = wp * uCloudSwirlScale + vec2(31.1, 13.7);\n	vec2 sB = wp * uCloudSwirlScale + vec2(-27.2, -9.3);\n	float nA = fbm3(vec3(sA, advH), uCloudLacunarity) * 2.0 - 1.0;\n	float nB = fbm3(vec3(sB, advH), uCloudLacunarity) * 2.0 - 1.0;\n	return vec3(nA, nB, 0.0);\n}\n/* -------------------------------------------- */\n\nvoid cloudFields(in vec2 wpx, in float t, in float driftSpeed, in float advSpeed, in float coverageBoost, in float cutPush, in bool needDetail, out float mask, out float core, out float detail, out vec3 flowOut, out float advOut) {\n	vec2 wp = windSpace(wpx);\n	vec2 drift = vec2(driftSpeed * uCloudDrift * t, 0.0);\n	wp -= drift;\n	float adv = t * advSpeed * uCloudFlow;\n	advOut = adv;\n	vec2 anisotropy = vec2(1.0 / max(1.0 + uCloudAnisotropy * 4.0, 1.0), 1.0 + uCloudAnisotropy * 6.0);\n	vec2 p0 = wp * uCloudScale * anisotropy;\n	vec2 p1 = wp * (uCloudScale * uCloudDetailScale);\n	float b0 = fbm3(vec3(p0, adv), uCloudLacunarity) * 0.5 + 0.5;\n	float b1 = fbm3(vec3(p1, adv * 1.31), uCloudLacunarity) * 0.5 + 0.5;\n	float ridged = 1.0 - abs(2.0 * b1 - 1.0);\n	float base;\n	if (uCloudType == 1) {\n		base = clamp(mix(b0, (b0 * 0.7 + b1 * 0.3), 0.6), 0.0, 1.0);\n	} else if (uCloudType == 2) {\n		base = clamp(gammaShape(b0 * 0.9 + b1 * 0.1, -0.35), 0.0, 1.0);\n	} else if (uCloudType == 3) {\n		float warp = (b1 - 0.5) * 0.35;\n		vec2 pw = p0 + vec2(0.0, warp);\n		float gB = gammaShape(fbm3(vec3(pw, adv * 0.85), uCloudLacunarity) * 0.5 + 0.5, -0.2);\n		base = clamp(mix(gB, ridged, 0.4), 0.0, 1.0);\n	} else {\n		base = clamp(gammaShape(mix(b0, ridged, 0.55), 0.35), 0.0, 1.0);\n	}\n	float cov = saturate(uCloudCoverage + coverageBoost);\n	float soft = max(uCloudSoftness, 1e-3);\n	float shaped = gammaShape(base, uCloudContrast);\n	float cut = mix(0.85, 0.15, cov) - cutPush;\n	mask = smoothstep(cut - soft, cut + soft, shaped);\n	core = smoothstep(cut + soft * 0.25, 1.0, shaped);\n	if (needDetail) {\n		vec3 flow = flowField(wp, adv);\n		flowOut = flow;\n		vec2 wWarp = wp + flow.xy * uCloudSwirlStrength;\n		float d = fbm3(vec3(wWarp * (uCloudScale * uCloudDepthScale), adv * 1.17), uCloudLacunarity) * 0.5 + 0.5;\n		float edgeAtten = mix(1.0 - uCloudEdgeDetailFade, 1.0, core);\n		detail = saturate(d * edgeAtten);\n	} else {\n		flowOut = vec3(0.0);\n		detail = 1.0;\n	}\n}\n/* -------------------------------------------- */\n\nvec2 cloudTexUV(in vec2 wpx, in float t, in float driftSpeed, in vec3 cachedFlow) {\n	vec2 drift = vec2(uWindCos, uWindSin) * (driftSpeed * uCloudDrift * uCloudTexDriftMult * t);\n	vec2 q = wpx - drift;\n	if (uCloudTexSwirlStrength != 0.0) {\n		q += cachedFlow.xy * uCloudTexSwirlStrength;\n	}\n	return q / max(uCloudTexWorldSizePx, 1.0);\n}\n/* -------------------------------------------- */\n\nvec3 cloudTex(in vec2 wpx, in float t, in float driftSpeed, in vec3 cachedFlow) {\n	vec2 uv = cloudTexUV(wpx, t, driftSpeed, cachedFlow);\n	return texture(cloudTexture, uv).rgb;\n}\nfloat minInsidePxToHexEdge(in vec2 gridPoint, in ivec2 ij) {\n	vec2 c = offsetToPoint(ij);\n	float minPx = 1e9;\n	for (int k = 0; k < 6; ++k) {\n		ivec2 ijN = nTexel(ij, k);\n		vec2 pn = offsetToPoint(ijN);\n		vec2 d = pn - c;\n		float invL = inversesqrt(max(dot(d, d), 1e-8));\n		vec2 n = d * invL;\n		vec2 mid = 0.5 * (c + pn);\n		float inside = max(0.0, -dot(n, gridPoint - mid));\n		minPx = min(minPx, inside * uHexSizePx);\n	}\n	return minPx;\n}\n/* -------------------------------------------- */\n\nfloat hexEdgeRadiusScale(in vec2 gridPoint, in ivec2 ij) {\n	if (uMoteHexEdgeFadePx <= 0.0)\n		return 1.0;\n	float dpx = minInsidePxToHexEdge(gridPoint, ij);\n	return saturate(dpx / max(uMoteHexEdgeFadePx, 1e-3));\n}\n/* -------------------------------------------- */\n\nfloat motes(in vec2 value) {\n	if (value.y < -1.0)\n		return 0.0;\n	float alpha;\n	if (hashBool(value.y))\n		alpha = 1.0 / (value.x * value.x * 16.0) - 0.07;\n	else\n		alpha = 1.0 / (value.x * 8.0) - 0.15;\n	return saturate(alpha);\n}\n/* -------------------------------------------- */\n\nfloat motesLayers(in vec2 coord, in float time, in float weight, in float edgeScale) {\n	if (edgeScale <= 0.0)\n		return 0.0;\n	float alpha = 0.0;\n	alpha = max(alpha, motes(voronoiCircles(coord + vec2(6.518), 9.251, time * 0.6 * 0.5 + 8.513, max((2.0 * weight), 1.0) * edgeScale)));\n	if (weight > 0.3)\n		alpha = max(alpha, motes(voronoiCircles(coord + vec2(3.584), 12.125, time * 0.8 * 0.5 + 4.214, max((2.5 * weight), 1.0) * edgeScale)));\n	if (weight > 0.6)\n		alpha = max(alpha, motes(voronoiCircles(coord + vec2(0.493), 15.210, time * 0.5 + 2.321, max((3.0 * weight), 1.0) * edgeScale)));\n	return alpha;\n}\n/* -------------------------------------------- */\n\nbool lunarMoteCycleState(in ivec2 ij, out int moonIndex, out float moonWeight, out float radiusScale, out float life, out float spawn) {\n	moonIndex = -1;\n	moonWeight = 0.0;\n	radiusScale = 0.0;\n	life = 0.0;\n	spawn = 0.0;\n	if (uZoomLevel < uMoteMinZoom)\n		return false;\n	if (uMoonWeightSum <= 1e-6)\n		return false;\n	vec2 key = vec2(float(ij.x), float(ij.y));\n	int m = int(floor(random(key + vec2(11.4, 6.2)) * 6.0));\n	m = clamp(m, 0, 5);\n	float wMoon = uMoonWeight[m];\n	float rScale = uMoonRadiusScale[m];\n	if ((wMoon <= 0.0) || (rScale <= 0.0))\n		return false;\n	float fadeIn = max(uMoteFadeInSec, 1e-3);\n	float fadeOut = max(uMoteFadeOutSec, 1e-3);\n	float visible = max(uMoteVisibleSec, fadeIn + fadeOut + 1e-3);\n	float hold = max(visible - fadeIn - fadeOut, 0.0);\n	float off = max(uMoteOffSec, 0.0);\n	float tVisibleEnd = fadeIn + hold + fadeOut;\n	float periodSec = tVisibleEnd + off;\n	float phaseShift = random(key + vec2(40.0, 12.0));\n	float t = mod(uTime + phaseShift * periodSec, max(periodSec, 1e-3));\n	if (t >= tVisibleEnd)\n		return false;\n	float aIn = smoothstep(0.0, fadeIn, t);\n	float aOut = 1.0 - smoothstep(fadeIn + hold, tVisibleEnd, t);\n	float moteLife = aIn * aOut;\n	if (moteLife <= 0.0)\n		return false;\n	float cycleId = floor((uTime + phaseShift * periodSec) / max(periodSec, 1e-3));\n	cycleId = mod(cycleId, 1024.0);\n	float avgW = max(uMoonWeightSum * (1.0 / 6.0), 1e-6);\n	float pSpawn = saturate(uMoteChance * (wMoon / avgW));\n	float rSpawn = random(key + vec2(3.1, 9.7) + cycleId * vec2(1.0, 7.0));\n	float moteSpawn = smoothstep(rSpawn - 0.04, rSpawn + 0.04, pSpawn);\n	if (moteSpawn <= 0.0)\n		return false;\n	moonIndex = m;\n	moonWeight = wMoon;\n	radiusScale = rScale;\n	life = moteLife;\n	spawn = moteSpawn;\n	return true;\n}\n/* -------------------------------------------- */\n\nfloat pow075(in float r) {\n	r = max(r, 0.0);\n	float s = sqrt(r);\n	return s * sqrt(s);\n}\n/* -------------------------------------------- */\n\nfloat softFloor(in float x, in float floorV, in float k) {\n	return floorV + log(1.0 + exp(k * (x - floorV))) / k;\n}\n/* -------------------------------------------- */\n\nvoid fetchNeighborhoodPacked7(in ivec2 ij) {\n	gPacked7[0] = packFromRGBA(texelFetch(pixelTexture, ij, 0));\n	for (int k = 0; k < EDGE_COUNT; ++k) {\n		ivec2 ijNeighbor = nTexel(ij, k);\n		gPacked7[k + 1] = packFromRGBA(texelFetch(pixelTexture, ijNeighbor, 0));\n	}\n\n}\n/* -------------------------------------------- */\n\nvec3 blendedStrength(in vec2 gridPoint, in ivec2 ij) {\n	float sCenterRain = strengthNorm(gPacked7[0], TYPE_RAIN);\n	float sCenterFog = strengthNorm(gPacked7[0], TYPE_FOG);\n	float sCenterPollen = strengthNorm(gPacked7[0], TYPE_POLLEN);\n	uint c0 = gPacked7[0];\n	if (gPacked7[1] == c0 && gPacked7[2] == c0 && gPacked7[3] == c0 &&\n		gPacked7[4] == c0 && gPacked7[5] == c0 && gPacked7[6] == c0) {\n		return vec3(sCenterRain, sCenterFog, sCenterPollen);\n	}\n	float wSumR = 0.0, vSumR = 0.0, wSumF = 0.0, vSumF = 0.0, wSumP = 0.0, vSumP = 0.0;\n	float invEdgeBlend = 1.0 / max(uEdgeBlendPx, 1.0);\n	vec2 c = offsetToPoint(ij);\n	float minEmptyR = 1e9, wEmptyR = 0.0;\n	float minEmptyF = 1e9, wEmptyF = 0.0;\n	float minEmptyP = 1e9, wEmptyP = 0.0;\n	for (int k = 0; k < EDGE_COUNT; ++k) {\n		uint pN = gPacked7[k + 1];\n		float sNR = strengthNorm(pN, TYPE_RAIN);\n		float sNF = strengthNorm(pN, TYPE_FOG);\n		float sNP = strengthNorm(pN, TYPE_POLLEN);\n		ivec2 ijN = nTexel(ij, k);\n		vec2 pn = offsetToPoint(ijN);\n		vec2 d = pn - c;\n		float invL = inversesqrt(max(dot(d, d), 1e-8));\n		vec2 n = d * invL;\n		vec2 mid = 0.5 * (c + pn);\n		float inside = max(0.0, -dot(n, gridPoint - mid));\n		float dpx = inside * uHexSizePx;\n		float t = 1.0 - smoothstep(0.0, 1.0, dpx * invEdgeBlend);\n		if (sNR > 0.0) {\n			wSumR += t;\n			vSumR += t * sNR;\n		} else if ((sCenterRain > 0.0) && (dpx < minEmptyR)) {\n			minEmptyR = dpx;\n			wEmptyR = t;\n		}\n		if (sNF > 0.0) {\n			wSumF += t;\n			vSumF += t * sNF;\n		} else if ((sCenterFog > 0.0) && (dpx < minEmptyF)) {\n			minEmptyF = dpx;\n			wEmptyF = t;\n		}\n		if (sNP > 0.0) {\n			wSumP += t;\n			vSumP += t * sNP;\n		} else if ((sCenterPollen > 0.0) && (dpx < minEmptyP)) {\n			minEmptyP = dpx;\n			wEmptyP = t;\n		}\n\n	}\n	if (sCenterRain > 0.0)\n		wSumR += wEmptyR;\n	if (sCenterFog > 0.0)\n		wSumF += wEmptyF;\n	if (sCenterPollen > 0.0)\n		wSumP += wEmptyP;\n	float sRain = (sCenterRain + vSumR) / (1.0 + wSumR);\n	float sFog = (sCenterFog + vSumF) / (1.0 + wSumF);\n	float sPollen = (sCenterPollen + vSumP) / (1.0 + wSumP);\n	return vec3(sRain, sFog, sPollen);\n}\n/* -------------------------------------------- */\n\nfloat computeRain(in vec2 uv, in float t, in float sRain) {\n	vec2 ruv = rotFast(uv + 0.5, uRainRotation) - 0.5;\n	ruv.y -= t * 1.232458;\n	vec2 st = ruv * uRainResolution;\n	vec3 d2 = voronoi(vec3(st - t * 1.0109, t * 1.2), 10.0);\n	float df = perceivedBrightness(d2);\n	float edge = 1.0 - smoothstep(0.3, 1.0, d2.z);\n	float core = 1.0 - smoothstep(-df * uRainStrength * sRain, df * uRainStrength * sRain + 0.001, edge);\n	return core;\n}\n/* -------------------------------------------- */\n\nfloat computeFog(in vec2 wpx, in float t, in float k) {\n	vec3 coord = vec3(wpx * uFogScale, t * 0.15);\n	float fbmv = fbm3(coord, 1.5);\n	float c = 0.4 + (k - 0.23) * 0.6;\n	float v1 = saturate((fbmv + 2.0) * 0.25);\n	float threshold = 1.0 - c;\n	float fg = (v1 - threshold) / (1.0 - threshold);\n	return saturate(smoothstep(0.0, 1.0, fg));\n}\n/* -------------------------------------------- */\n\nfloat pollenKnots(in vec2 wp, in float adv) {\n	float b = fbm3(vec3(wp * uPollenKnotScale, adv), 1.85) * 0.5 + 0.5;\n	float ridged = 1.0 - abs(2.0 * b - 1.0);\n	return smoothstep(0.55, 0.92, ridged);\n}\n/* -------------------------------------------- */\n\nvec4 pollenPM(in vec2 wpx, in float t, in float sPol) {\n	if ((sPol < 0.02) || (uPollenOpacity < 0.01))\n		return vec4(0.0);\n	vec2 q = windSpace(wpx);\n	float advPx = max(uWindSpeed, 0.0) * uPollenDrift * t;\n	float cellPx = max(uPollenCellWorldPx, 4.0);\n	vec2 cq = (q - vec2(advPx, 0.0)) / cellPx;\n	vec2 base = floor(cq);\n	vec2 f = fract(cq);\n	vec2 dxc = dFdx(cq), dyc = dFdy(cq);\n	float pxCell = max(length(dxc), length(dyc));\n	float dotCell = uPollenDotRadiusPx / cellPx;\n	float sigma = max(dotCell, pxCell * 0.60);\n	float invS2 = 0.5 / (sigma * sigma);\n	float energyK = (dotCell * dotCell) / (sigma * sigma);\n	float swirl = sin((q.x + q.y * 0.23) * 0.012 + t * 0.6) * (0.18 * uPollenTwinkle);\n	float acc = 0.0;\n	for (int j = -1; j < 1; ++j) {\n		for (int i = -1; i < 1; ++i) {\n			vec2 cell = base + vec2(float(i), float(j));\n			vec2 rnd = vec2(random(cell), random(cell + 17.7));\n			vec2 p0 = rnd;\n			vec2 p = p0 + vec2(advPx / cellPx, swirl);\n			vec2 d = f - p;\n			d -= round(d);\n			float r2 = dot(d, d);\n			acc += exp(-r2 * invS2) * energyK;\n		}\n\n	}\n	float ratio = sigma / max(dotCell, 1e-6);\n	float approxCells = 3.14159 * ratio * ratio;\n	float neighborGain = max(1.0, approxCells / 9.0);\n	neighborGain = min(neighborGain, 3.0);\n	float knots = fbm3(vec3(q * uPollenKnotScale, t * 0.08), 1.0) * 0.5 + 0.5;\n	float knotBoost = mix(0.75, 1.35, smoothstep(0.35, 0.85, knots));\n	acc = (acc / 9.0) * knotBoost * sPol * neighborGain;\n	acc = smoothstep(0.02, 0.65, acc);\n	acc = clamp(acc, 0.0, 1.0);\n	float a = acc * uPollenOpacity;\n	a = clamp(a, 0.0, 1.0);\n	vec3 tint = clamp(uPollenTint, 0.0, 1.0);\n	return vec4(tint * a, a);\n}\n/* -------------------------------------------- */\n\nvec4 pollenHazePM(in vec2 wpx, in float t, in float sPol) {\n	if (sPol < 0.02 || uPollenHazeOpacity < 0.01)\n		return vec4(0.0);\n	vec2 wp = windSpace(wpx);\n	float drift = max(uWindSpeed, 0.0) * (uPollenDrift * 0.5) * t;\n	vec2 p = wp - vec2(drift, 0.0);\n	float adv = t * max(uWindSpeed, 0.0) * (uPollenFlow * 0.7);\n	float n = fbm3(vec3(p * uPollenHazeScale, adv), 1.5) * 0.5 + 0.5;\n	float k = pollenKnots(p, adv);\n	float shaped = smoothstep(0.5 - uPollenHazeSoftness, 0.5 + uPollenHazeSoftness, n);\n	float a = shaped * mix(0.75, 1.25, k) * sPol * uPollenHazeOpacity;\n	vec3 tint = mix(vec3(1.0), clamp(uPollenTint, 0.0, 1.0), 0.6);\n	return vec4(tint * a, a);\n}\n/* -------------------------------------------- */\n/*  Lunar Motes                                 */\n/* -------------------------------------------- */\n\nvec3 boostHighlights(in vec3 c, in float amount) {\n	vec3 w = c * c;\n	return c * (1.0 + amount * w);\n}\n/* -------------------------------------------- */\n\nvec4 lunarMotePM(in vec2 gridPoint, in ivec2 ij, in vec2 centerGrid) {\n	int m;\n	float wMoon;\n	float radiusScale;\n	float life;\n	float spawn;\n	if (!lunarMoteCycleState(ij, m, wMoon, radiusScale, life, spawn))\n		return vec4(0.0);\n	vec2 moteWorld = uRegionOrigin + centerGrid * max(uHexSizePx, 1.0);\n	float intensity = saturate(radiusScale);\n	float hexInR = 0.5 * uHexSizePx;\n	float rMin = 0.5 * hexInR;\n	float rMaxHex = hexInR + max(uMoteHexEdgeFadePx, 0.0);\n	float revealR = mix(rMin, rMaxHex, intensity);\n	float d = length(vWorldPx - moteWorld);\n	const float REVEAL_FEATHER_PX = 3.0;\n	float reveal = smoothstep(revealR + REVEAL_FEATHER_PX, revealR - REVEAL_FEATHER_PX, d);\n	if (reveal <= 0.0)\n		return vec4(0.0);\n	float invRef = 2.0 / max(uHexSizePx, 1.0);\n	float s = (6.0 * max(uMoteResolution, 1e-3)) * invRef;\n	vec2 coord = (vWorldPx - uRegionOrigin) * s;\n	float tM = uTime * max(uMoteTimeScale, 0.0);\n	vec3 moon = clamp(uMoonColor[m], 0.0, 1.0);\n	float edgeScale = hexEdgeRadiusScale(gridPoint, ij);\n	float alpha = motesLayers(coord, tM, wMoon, edgeScale);\n	vec3 color = mix(moon, vec3(1.0), alpha * alpha * alpha * alpha * alpha * 0.33);\n	float a = pow(alpha, 0.85) * reveal * life * uMoteAlpha * spawn;\n	if (a <= 0.0)\n		return vec4(0.0);\n	return premul(mix(color, boostHighlights(moon, 0.5), smoothstep(0.4, 0.6, uDarknessLevel)), saturate(a));\n}\n/* -------------------------------------------- */\n\nvec4 drawGrid(in vec2 gridPoint) {\n	ivec2 ij = pointToOffset(gridPoint);\n	vec2 centerGrid = offsetToPoint(ij);\n	fetchNeighborhoodPacked7(ij);\n	vec3 sRFP = blendedStrength(gridPoint, ij);\n	float sRain = sRFP.x;\n	float sFog = sRFP.y;\n	float sPollen = sRFP.z;\n\n    \n\n	vec4 acc = lunarMotePM(gridPoint, ij, centerGrid);\n\n    \n\n	if (sRain > 0.04) {\n		float r = computeRain(vWorldPx, uTime, sRain);\n		float rG = pow075(r);\n		float aR = saturate(uRainOpacity * rG * sRain);\n		vec3 cR = mix(uRainTint, vec3(1.0), 0.35 * rG);\n		acc = overPD(acc, premul(cR, aR));\n		acc = overPD(acc, premul(vec3(1.0), 0.18 * rG * sRain));\n	}\n    \n	if (sFog > 0.0) {\n		float f = computeFog(vWorldPx, uTime * 0.5, mix(0.33, 1.0, sFog));\n		float fG = pow(max(f, 0.0), 0.8);\n		float aF = saturate(fG * sFog);\n		vec3 cF = mix(uFogTint, vec3(1.0), 0.25 * fG);\n		acc = overPD(acc, premul(cF, aF));\n		acc = overPD(acc, premul(vec3(1.0), 0.16 * fG * sFog));\n	}\n    \n	if (sPollen > 0.0) {\n		vec4 hPM = pollenHazePM(vWorldPx, uTime, sPollen);\n		if (hPM.a > 0.0)\n			acc = overPD(acc, hPM);\n	}\n    \n	if (sPollen > 0.0) {\n		vec4 pPM = pollenPM(vWorldPx, uTime, sPollen);\n		if (pPM.a > 0.0) {\n			acc = overPD(acc, pPM);\n			acc = overPD(acc, premul(vec3(1.0), 0.08 * pPM.a));\n		}\n\n	}\n    \n	float z = clamp(uZoomLevel, 0.0, 1.0);\n	float haze = 1.0 - smoothstep(0.05, 0.40, z);\n	haze = haze * haze;\n	float aH = haze * (1.0 - uDarknessLevel) * 0.30;\n	if (aH > 0.0)\n		acc = overPD(acc, premul(vec3(0.4, 0.65, 1.0), aH));\n\n    \n\n	if (uCloudType == 0)\n		return acc;\n	float cloudDriftSpeed = uWindSpeed;\n	float cloudAdvSpeed = max(uWindSpeed, 0.0);\n	float zVis = 1.0 - smoothstep(0.20, 0.40, clamp(uZoomLevel, 0.06, 1.0));\n	float mask;\n	float core;\n	float detail;\n	vec3 cloudFlow;\n	float cloudAdv;\n	cloudFields(vWorldPx, uTime, cloudDriftSpeed, cloudAdvSpeed, uCloudRainBoostCoverage * sRain, uCloudRainCreate * sRain, zVis > 0.0, mask, core, detail, cloudFlow, cloudAdv);\n	float day = 1.0 - uDarknessLevel;\n	float baseI = saturate(uCloudShadowIntensity + uCloudRainBoostIntensity * sRain);\n	float aShadow = saturate(mask * baseI * day);\n	if (aShadow > 0.0) {\n		vec3 cS = clamp(uCloudTint, 0.0, 1.0);\n		acc = overPD(acc, premul(cS, aShadow));\n	}\n	if (zVis > 0.0) {\n		float vol = mix(1.0, detail, saturate(uCloudDepthAmount));\n		float puff = pow(saturate(core), max(uCloudCoreGamma, 0.01));\n		float aAlb = saturate(mask * uCloudCoreIntensity * (0.55 + 0.45 * puff) * vol) * zVis * 2.0;\n		if (aAlb > 0.0) {\n			vec3 colCloud = cloudTex(vWorldPx, uTime, cloudDriftSpeed, cloudFlow);\n			float pbc = perceivedBrightness(colCloud) * 0.25;\n			pbc = pbc * pbc * pbc * pbc;\n			float rI = softFloor(saturate(1.0 - sRain * (1.0 - pbc)), 0.25, 16.0);\n			vec3 cA = mix(colCloud * 0.85 * rI, colCloud * rI * 1.1, saturate(0.5 * (detail + puff)));\n			acc = overPD(acc, premul(cA, smoothstep(0.0, 0.60, aAlb) * uCloudMaxAlpha));\n		}\n\n	}\n	return acc;\n}\nvec4 _main() {\n	return drawGrid(vGridCoord);\n}", hc = "uniform mediump sampler3D snoiseAtlas3D;\nconst float SNO_PERIOD = 10.0;\n\nfloat snoUnpack(float p) {\n	return (p - 0.5) * 4.4;\n}\n\nfloat snrUnpack(float p) {\n	return (p - 0.5) * 2.0;\n}\n\nfloat snoise(in vec3 P, in vec3 rep) {\n	vec3 uvw = vec3(mod(P.xy, SNO_PERIOD) / SNO_PERIOD, mod(P.z, SNO_PERIOD) / SNO_PERIOD);\n	return snoUnpack(texture(snoiseAtlas3D, uvw).r);\n}\n\nfloat snoise(in vec3 v) {\n	vec3 uvw = vec3(mod(v.xy, SNO_PERIOD) / SNO_PERIOD, mod(v.z, SNO_PERIOD) / SNO_PERIOD);\n	return snrUnpack(texture(snoiseAtlas3D, uvw).b);\n}", gc = "uniform bool enableRotation;\nuniform bool enableVignette;\nuniform bool enableReducer;\nuniform vec2 reducerPosition;\nuniform vec2 rotationAnchor;\nuniform float reducerPower;\nuniform float reducerFactor;\nuniform float vignetteSmoothMin;\nuniform float vignetteSmoothMax;\nuniform float rotationSpeed;\nuniform float time;\nuniform float resolution;\nuniform float density;\nuniform float intensity;\nuniform float glow;\nuniform vec2 frameTexelSize;\nuniform vec3 textureTint;\nuniform vec3 vignetteTint;\nuniform highp vec4 meshDimensions;\nuniform highp mat3 textureMatrix;\nvarying vec2 vMeshUvs;\n\nconst float PI = 3.141592653589793;\nconst float TWOPI = 6.283185307179586;\nconst float INVPI = 0.3183098861837907;\nconst float INVTWOPI = 0.15915494309189535;\nconst float SQRT2 = 1.4142135623730951;\nconst float SQRT1_2 = 0.7071067811865476;\nconst float SQRT3 = 1.7320508075688772;\nconst float SQRT1_3 = 0.5773502691896257;\nconst vec3 BT709 = vec3(0.2126, 0.7152, 0.0722);\n\nfloat perceivedBrightness(in vec3 color) {\n	return sqrt(dot(BT709, color * color));\n}\nfloat perceivedBrightness(in vec4 color) {\n	return perceivedBrightness(color.rgb);\n}\n\nuint mixHash32(in uint x) {\n	x ^= x >> 16;\n	x *= 0x85ebca6bU;\n	x ^= x >> 13;\n	x *= 0xc2b2ae35U;\n	x ^= x >> 16;\n	return x;\n}\n\nfloat hashToFloat(in uint x) {\n	return float(x) * (1.0 / 4294967295.0);\n}\n\nuint hashVec2_u(in uvec2 uv) {\n    \n	uint h = uv.x * 0x9E3779B1u; \n\n	h ^= uv.y + 0x85ebca6bu;\n	return mixHash32(h);\n}\n\nfloat hashFloatFromVec2(in vec2 position) {\n	uvec2 uv = uvec2(floatBitsToUint(position.x), floatBitsToUint(position.y));\n	return hashToFloat(hashVec2_u(uv));\n}\n\nconst int MAX_OFFS = 1;\n\nvec3 starLayer(in vec2 uv) {\n	vec3 acc = vec3(0.0);\n	vec2 cellUV = fract(uv);\n	vec2 cellId = floor(uv);\n\n	for (int y = -MAX_OFFS; y <= MAX_OFFS; ++y) {\n		for (int x = -MAX_OFFS; x <= MAX_OFFS; ++x) {\n			vec2 offset = vec2(x, y);\n			float n = hashFloatFromVec2(cellId + offset);\n\n            \n			if (fract(n * 17.0) > density)\n				continue;\n			float raw = fract(n);\n			float radius = mix(0.1, 3.0, raw);\n			vec2 starPos = cellUV - offset - vec2(n, fract(n * 34.0)) + 0.5;\n\n			\n			\n			\n			float distSq = dot(starPos, starPos);\n			float maxDist = 0.2 * radius;\n			if (distSq > maxDist * maxDist)\n				continue;\n\n			float twkAmp = mix(0.6, 1.4, fract(n * 91.0));\n			float twkFreq = mix(1.0, 3.0, fract(n * 133.0));\n			float twinkle = 1.0 - abs(sin(n * time * twkFreq)) * twkAmp;\n			float flare = mix(0.15, 0.9, fract(n * 47.0)) * twinkle * 0.5;\n\n			\n			float dist = sqrt(distSq);\n			float b = glow * radius / max(dist, 1e-6);\n			float rays = max(0.0, 0.5 - abs(starPos.x * starPos.y * 1000.0));\n			b += rays * flare;\n			b *= 1.0 - smoothstep(0.0, maxDist, dist);\n\n			vec3 baseColor = sin(vec3(0.2, 0.3, 0.9) * fract(n * 2345.2) * TWOPI) * 0.25 + 0.75;\n			baseColor += (fract(n * 811.0) - 0.5) * 0.05;\n			baseColor *= vec3(1.0, 0.59, 0.9 + raw * 0.2);\n			float intensityVal = mix(0.4, 1.2, sqrt(raw));\n			float sizeComp = 1.0 / radius;\n			acc += b * baseColor * intensityVal * sizeComp * (0.3 + 0.7 * twinkle);\n		}\n\n	}\n	return acc;\n}\n\nvec2 aspectCorrect(in vec2 uv) {\n	float ratio = meshDimensions.w / meshDimensions.z;\n	vec2 scale = vec2(min(1.0, 1.0 / ratio), min(1.0, ratio));\n	return (uv - 0.5) * scale + 0.5;\n}\n\nvec2 rotate2D(in vec2 p, in vec2 anchor, in float angle) {\n	float s = sin(angle);\n	float c = cos(angle);\n	p -= anchor;\n	p = vec2(c * p.x - s * p.y, s * p.x + c * p.y);\n	return p + anchor;\n}\n\n/*  Main Program                                */\n/* -------------------------------------------- */\nvec4 _main() {\n	vec2 uv = fract(vMeshUvs * resolution);\n	vec2 margin = frameTexelSize * 0.75;\n	uv = uv * (1.0 - 2.0 * margin) + margin;\n	vec2 atlasUV = (textureMatrix * vec3(uv, 1.0)).xy;\n	vec4 tex = texture2D(sampler, atlasUV);\n	tex.rgb *= textureTint;\n	vec3 starfieldColor = vec3(0.0);\n	vec2 starfieldUv = aspectCorrect(vMeshUvs);\n	vec3 whiteTint = vec3(1.0);\n	float angle = rotationSpeed * time;\n	starfieldUv = mix(starfieldUv, rotate2D(starfieldUv, aspectCorrect(rotationAnchor), angle), float(enableRotation));\n	vec2 vignetteUv = aspectCorrect(vMeshUvs) - 0.5;\n	float dist = length(vignetteUv) * 2.0;\n	float vFactor = 1.0 - smoothstep(vignetteSmoothMin, vignetteSmoothMax, dist);\n	float vignette = mix(1.0, vFactor, float(enableVignette));\n	vec3 starTint = mix(vignetteTint, whiteTint, vignette);\n	float fade0 = 1.0 - smoothstep(0.1, 1.0, 0.50);\n	starfieldColor += starLayer(starfieldUv * 30.0) * fade0;\n	float fade1 = 1.0 - smoothstep(0.1, 1.0, 0.60);\n	starfieldColor += starLayer(starfieldUv * 40.0 + 11.33) * fade1;\n	float fade2 = 1.0 - smoothstep(0.1, 1.0, 0.70);\n	starfieldColor += starLayer(starfieldUv * 50.0 + 33.48) * fade2;\n	vec2 redPos = aspectCorrect(reducerPosition);\n	float redDist = distance(starfieldUv, redPos);\n	float reduceFactor = mix(1.0, (1.0 - reducerFactor) + reducerFactor * smoothstep(0.0, reducerPower, redDist), float(enableReducer));\n	starfieldColor *= reduceFactor;\n	tex.rgb = mix(tex.rgb * 0.5, tex.rgb, perceivedBrightness(starfieldColor) * 2.0);\n	tex.rgb *= starTint;\n	tex.rgb += starfieldColor * starTint * intensity;\n	return tex * tintAlpha;\n}", _c = "float fbm(in vec2 uv) {\n	uv += time * 0.03;\n	uv *= 2.0;\n	float r = fnoise(uv + time * 0.03);\n	uv *= 3.0;\n	r += fnoise(uv + time * 0.03) * 0.1;\n	return r;\n}", vc = "uniform sampler2D voronoiTexture;\nvec3 voronoi(in vec2 uv, out float intensity) {\n        \n	float periodFrac = 0.015625; \n	vec4 voronoiData = texture2D(voronoiTexture, uv * periodFrac);\n\n	vec2 val = vec2(voronoiData.r, voronoiData.g);\n	float minDist = voronoiData.b;\n\n	float vs = cos(fbm(val * 50.0 + time * 0.5, 1.0));\n	val += (vs * 0.1);\n\n	vec3 col1 = vec3(pow(1.0 - minDist, 5.0) * val.x, 0.0, 0.0);\n	vec3 col2 = vec3(0.0, 0.0, pow(1.0 - minDist, 5.0) * val.y);\n	vec3 result = mix(col1, col2, -0.3 + (vs + 1.0 * 0.5));\n	intensity = mix(result.r, result.b, clamp(-0.3 + (vs + 1.0 * 0.5), 0.0, 1.0));\n	return result;\n}", yc = "uniform mediump sampler3D voronoiAtlas3D;\n\nconst float VOR_INNER = 512.0;\nconst float VOR_TILE = VOR_INNER + 2.0;    \nconst float VOR_CELLS = 64.0;\nconst float VOR_TOTAL = 64.0;\nconst float VOR_PERIOD = 6.283185307179586; \n\nvec3 voronoi(in vec2 uv, in float t, in float zd) {\n	float tIdx = fract(t / VOR_PERIOD) * VOR_TOTAL;\n\n	vec2 macroCell = floor(uv / VOR_CELLS);\n	vec2 h = fract(sin(vec2(dot(macroCell, vec2(127.1, 311.7)), dot(macroCell, vec2(269.5, 183.3)))) * 43758.5453);\n	vec2 uvCell = mod(uv + floor(h * VOR_CELLS), VOR_CELLS);\n\n	\n	vec2 sampleUV = (uvCell / VOR_CELLS * VOR_INNER + 1.0) / VOR_TILE;\n	\n	float sampleW = (tIdx + 0.5) / VOR_TOTAL;\n\n	return texture(voronoiAtlas3D, vec3(sampleUV, sampleW)).rgb;\n}", bc = "uniform sampler2D voronoiP16Texture;\nconst float VORONOI_POWER_16_PERIOD = 16.0;\nconst float VORONOI_POWER_16_PERIOD_FRAC = 1.0 / VORONOI_POWER_16_PERIOD;\n\nfloat voronoiPower16(in vec2 point) {\n	vec2 uv = mod(point, VORONOI_POWER_16_PERIOD) * VORONOI_POWER_16_PERIOD_FRAC;\n	return texture(voronoiP16Texture, uv).r;\n}", xc = {
	voronoi: {
		fragment: sc,
		width: 1024,
		height: 1024,
		format: PIXI.FORMATS.RGB,
		wrapMode: PIXI.WRAP_MODES.REPEAT,
		scaleMode: PIXI.SCALE_MODES.LINEAR
	},
	voronoiPower16: {
		fragment: cc,
		width: 512,
		height: 512,
		format: PIXI.FORMATS.RED,
		wrapMode: PIXI.WRAP_MODES.REPEAT,
		scaleMode: PIXI.SCALE_MODES.LINEAR
	}
}, Sc = {
	...qs,
	...xc
}, Cc = {
	snoiseAtlas3D: {
		fragment: ac,
		width: 160,
		height: 160,
		depth: 10,
		format: PIXI.FORMATS.RGBA,
		wrapMode: PIXI.WRAP_MODES.CLAMP,
		wrapModeR: PIXI.WRAP_MODES.CLAMP,
		scaleMode: PIXI.SCALE_MODES.LINEAR,
		generator: (e, t) => ic(e, {
			width: t.width,
			height: t.height,
			depth: t.depth,
			fragSrc: t.fragment,
			label: "snoise-3d"
		})
	},
	voronoiAtlas3D: {
		fragment: oc,
		width: 514,
		height: 514,
		depth: 64,
		format: PIXI.FORMATS.RGBA,
		wrapMode: PIXI.WRAP_MODES.CLAMP,
		wrapModeR: PIXI.WRAP_MODES.REPEAT,
		scaleMode: PIXI.SCALE_MODES.LINEAR,
		generator: (e, t) => ic(e, {
			width: t.width,
			height: t.height,
			depth: t.depth,
			fragSrc: t.fragment,
			wrapR: e.REPEAT,
			label: "voronoi-3d"
		})
	}
}, wc = new Hs(Sc), Tc = new Us(Cc), Ec = /float fnoise\(in vec2 coords\)[\s\S]*?\}/, Dc = /float snoise\(in vec3 P(, in vec3 rep)?\)[\s\S]*?\}/, Oc = /vec3 voronoi\(in vec2 uv, out float intensity\)[\s\S]*?return result;\s*}/, kc = /vec3 voronoi\(in vec2 uv, in float t, in float zd\)[\s\S]*?return vor;\s*\}/, Ac = /float voronoiPower16\(in vec2 point\)[\s\S]*?return pow\(1.0 \/ res, 1.0 \/ 16.0\);\s*}/, jc = /vec4 motesLayers\(vec2 coord, float time\)[\s\S]*?return color \* mask;\s*\}/, Mc = /vec2 voronoiCircles\(in vec2 coord, in float freq, in float time, in float radiusScale\)[\s\S]*?return vec2\(0\.0, -2\.0\);\s*\}/, Nc = /float fbm\(in vec2 uv, in float smoothness\)[\s\S]*?return \w;\s*\}/, Pc = /float fbm\(in vec2 uv\)[\s\S]*?return r;\s*\}/, Fc = {
	...Ys,
	fnoise: {
		textures: ["noise"],
		regex: Ec,
		optimizedShader: uc.trim(),
		samplerNames: { noise: "noiseTexture" }
	},
	snoise: {
		textures: ["snoiseAtlas3D"],
		textures3D: ["snoiseAtlas3D"],
		regex: Dc,
		optimizedShader: hc.trim(),
		samplerNames: { snoiseAtlas3D: "snoiseAtlas3D" }
	},
	voronoi: {
		textures: ["voronoi"],
		regex: Oc,
		optimizedShader: vc.trim(),
		samplerNames: { voronoi: "voronoiTexture" }
	},
	voronoiRw: {
		textures: ["voronoiAtlas3D"],
		textures3D: ["voronoiAtlas3D"],
		regex: kc,
		optimizedShader: yc.trim(),
		samplerNames: { voronoiAtlas3D: "voronoiAtlas3D" }
	},
	voronoiPower16: {
		textures: ["voronoiPower16"],
		regex: Ac,
		optimizedShader: bc.trim(),
		samplerNames: { voronoiPower16: "voronoiP16Texture" }
	},
	motesVoronoiCircles: {
		regex: Mc,
		optimizedShader: fc.trim()
	},
	motesLayers: {
		regex: jc,
		optimizedShader: pc.trim()
	},
	magicalPlatform: {
		textures: [
			"noise",
			"snoiseAtlas3D",
			"voronoiPower16"
		],
		optimizedShader: dc,
		samplerNames: {
			noise: "noiseTexture",
			snoiseAtlas3D: "snoiseAtlas3D",
			voronoiPower16: "voronoiP16Texture"
		}
	},
	regionWeather: {
		textures: ["snoiseAtlas3D", "voronoiAtlas3D"],
		optimizedShader: mc,
		samplerNames: {
			snoiseAtlas3D: "snoiseAtlas3D",
			voronoiAtlas3D: "voronoiAtlas3D"
		}
	},
	starfield: { optimizedShader: gc },
	fbm3: {
		regex: Nc,
		optimizedShader: lc.trim(),
		autoApply: !1
	},
	fbm2VF: {
		regex: Pc,
		optimizedShader: _c.trim(),
		autoApply: !1
	}
};
function Ic(e, t) {
	return new Ws(wc, Fc, e, t, Tc);
}
function Lc(e) {
	wc.generate(e), Tc.generate(e);
}
//#endregion
//#region src/hacks/emberNoiseHacks.ts
var Rc = /* @__PURE__ */ new WeakSet(), zc = /float noise\(in vec2 uv\)[\s\S]*?\}/;
function Bc() {
	let e = globalThis.ember?.api?.canvas?.shaders?.KaleidoscopeSamplerShader;
	if (!e) return;
	let t = e._fragmentShader, n = Ic(e, t), r = n.apply();
	n.setSource(r), r = n.apply("fbm3"), n.applied.length > 0 && (e._fragmentShader = r, Xs(e, n, t));
}
function Vc(e) {
	if (!e) return;
	let t = "_fragmentShader" in e ? "_fragmentShader" : "fragmentShader", n = e[t];
	e[t] = Xs(e, Ic(e, n), n);
}
function Hc() {
	let e = [
		"AquaticFilter",
		"BubblingWaterSamplerShader",
		"ColorBloomShader",
		"DistortionSamplerShader",
		"FogGeometryShader",
		"ForceFieldShader",
		"OceanSamplerShader",
		"TreeCanopySamplerShader"
	], t = globalThis.ember?.api?.canvas?.shaders ?? {};
	for (let n of e) Vc(t[n]);
}
function Uc() {
	let e = globalThis.ember?.api?.canvas?.shaders?.MagicalPlatformShader;
	if (!e) return;
	let t = e._fragmentShader, n = Ic(e, t), r = n.apply("magicalPlatform");
	n.applied.length > 0 && (e._fragmentShader = r, Xs(e, n, t));
}
function Wc() {
	let e = globalThis.ember?.scenes?.cosmos?.sprites?.VoidRepeating?.shader;
	if (!e) return;
	let t = e._fragmentShader, n = Ic(e, t), r = n.apply("starfield");
	n.applied.length > 0 && (e._fragmentShader = r, Xs(e, n, t));
}
function Gc() {
	let e = globalThis.ember?.api?.canvas?.QuadLightSource?._layers?.coloration?.defaultShader;
	if (!e || Rc.has(e)) return;
	Rc.add(e), e.reservedTextureUnits = 4;
	let t = e._batchFragmentShader;
	if (zc.test(t)) {
		let n = (1 / 12).toFixed(4);
		e._batchFragmentShader = t.replace(zc, `uniform sampler2D noiseTexture;\nfloat noise(in vec2 uv) {\n\tvec4 color = texture2D(noiseTexture, uv * ${n});\n\treturn color.r;\n}`);
	}
	let n = e.batchDefaultUniforms;
	e.batchDefaultUniforms = function(e) {
		let t = n.call(this, e);
		return t.noiseTexture = e + 3, t;
	};
	let r = e._preRenderBatch;
	e._preRenderBatch = function(e) {
		r && r.call(this, e);
		let t = wc.getTexture("noise"), n = e._shader?.uniforms;
		t && n && e.renderer.texture.bind(t, n.noiseTexture);
	};
}
function Kc() {
	let e = globalThis.ember?.api?.canvas?.weather?.EmberRegionWeatherManager;
	if (!e) return;
	let t = e.prototype, n = t._createFullscreenQuadMesh;
	t._createFullscreenQuadMesh = function(e) {
		let { shaderClass: t } = e;
		if (t.name !== "EmberRegionWeatherShader" || Rc.has(t)) return n.call(this, e);
		Rc.add(t);
		let r = t._fragmentShader, i = Ic(t, r), a = i.apply("regionWeather");
		i.applied.length > 0 && (t._fragmentShader = a, Xs(t, i, r));
		let o = n.call(this, e), s = canvas.app?.ticker;
		if (o?.shader && s) {
			let e = o.shader.uniforms, t = () => {
				let t = e.uWindAngle ?? 0;
				e.uWindCos = Math.cos(t), e.uWindSin = Math.sin(t);
			};
			t(), s.add(t), o.once?.("destroyed", () => s.remove(t));
		}
		return o;
	};
}
function qc() {
	let e = globalThis.ember?.api?.canvas?.weather?.EmberWorldWeatherManager;
	if (!e) return;
	let t = e.prototype, n = t._createFullscreenQuadMesh;
	t._createFullscreenQuadMesh = function(e) {
		let { shaderClass: t } = e;
		if (t.name !== "EmberWorldWeatherShader" || Rc.has(t)) return n.call(this, e);
		Rc.add(t);
		let r = t._createFragmentShader;
		return t._createFragmentShader = function() {
			let e = r.call(this);
			return Xs(t, Ic(t, e), e);
		}, n.call(this, e);
	};
}
function Jc() {
	let e = CONFIG.Canvas.visibilityFilter;
	if (!e) return;
	let t = e.fragmentShader;
	typeof t == "function" && (e.fragmentShader = function(n) {
		return Ic(e, t.call(this, n)).apply("fbm2VF", "fnoise");
	});
}
function Yc() {
	let e = globalThis.ember?.api?.canvas?.shaders?.PollenGlitterGeometryShader;
	if (!e) return;
	let t = e._fragmentShader;
	e._fragmentShader = Xs(e, Ic(e, t), t);
}
function Xc() {
	let t = game.modules.get("ember");
	t?.active && (!C(e.EmberShaderOptimizations) || !r.hasCanvas || (t.version && foundry.utils.isNewerVersion(t.version, "0.5.0") && Hooks.once("ready", () => {
		ui.notifications?.warn(`${n}.settings.${e.EmberShaderOptimizations}.emberVersionWarning`, {
			permanent: !0,
			localize: !0
		});
	}), Ps(), Hooks.once("canvasInit", () => {
		let e = canvas.app?.renderer;
		if (!e) {
			console.error("[PrimePerformance] emberNoiseHacks: no renderer on canvasInit");
			return;
		}
		Lc(e), Bc(), Hc(), Uc(), Wc(), Gc(), Kc(), qc(), Yc(), Jc();
	})));
}
//#endregion
//#region src/hacks/index.ts
Hooks.once("setup", () => {
	ys(), bn(), Ds(), jt(), re(), Vt(), rt(), tc(), Xc(), js(), f(), g(), ps(), cn();
});
//#endregion

//# sourceMappingURL=fvtt-perf-optim.js.map