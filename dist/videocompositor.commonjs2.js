module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

	function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var _sourcesVideosourceJs = __webpack_require__(1);

	var _sourcesVideosourceJs2 = _interopRequireDefault(_sourcesVideosourceJs);

	var _sourcesImagesourceJs = __webpack_require__(3);

	var _sourcesImagesourceJs2 = _interopRequireDefault(_sourcesImagesourceJs);

	var _sourcesCanvassourceJs = __webpack_require__(4);

	var _sourcesCanvassourceJs2 = _interopRequireDefault(_sourcesCanvassourceJs);

	var _combinationsJs = __webpack_require__(5);

	var updateables = [];
	var previousTime = undefined;
	var mediaSourceMapping = new Map();
	mediaSourceMapping.set("video", _sourcesVideosourceJs2["default"]).set("image", _sourcesImagesourceJs2["default"]).set("canvas", _sourcesCanvassourceJs2["default"]);

	function registerUpdateable(updateable) {
	    updateables.push(updateable);
	}
	function update(time) {
	    if (previousTime === undefined) previousTime = time;
	    var dt = (time - previousTime) / 1000;
	    for (var i = 0; i < updateables.length; i++) {
	        updateables[i].update(dt);
	    }
	    previousTime = time;
	    requestAnimationFrame(update);
	}
	update();

	var VideoCompositor = (function () {
	    function VideoCompositor(canvas) {
	        _classCallCheck(this, VideoCompositor);

	        this._canvas = canvas;
	        this._ctx = this._canvas.getContext("webgl");
	        this._playing = false;
	        this._mediaSources = new Map();
	        this._mediaSourcePreloadNumber = 2; // define how many mediaSources to preload. This is influenced by the number of simultanous AJAX requests available.
	        this._playlist = undefined;
	        this._eventMappings = new Map();
	        this._effectShaderPrograms = new Map();
	        this._transitionShaderPrograms = new Map();
	        this._mediaSourceListeners = new Map();

	        //Setup the default shader effect
	        var defaultEffectShader = VideoCompositor.createEffectShaderProgram(this._ctx);
	        this._effectShaderPrograms.set("default", defaultEffectShader);

	        this._currentTime = 0;
	        this.duration = 0;
	        registerUpdateable(this);
	    }

	    _createClass(VideoCompositor, [{
	        key: "play",
	        value: function play() {
	            this._playing = true;
	            var playEvent = new CustomEvent("play", { detail: { data: this._currentTime, instance: this } });
	            this._canvas.dispatchEvent(playEvent);
	        }
	    }, {
	        key: "pause",
	        value: function pause() {
	            this._playing = false;
	            this._mediaSources.forEach(function (mediaSource) {
	                mediaSource.pause();
	            });
	            var pauseEvent = new CustomEvent("pause", { detail: { data: this._currentTime, instance: this } });
	            this._canvas.dispatchEvent(pauseEvent);
	        }
	    }, {
	        key: "addEventListener",
	        value: function addEventListener(type, func) {
	            //Pass through any event listeners through to the underlying canvas rendering element
	            //Catch any events and handle with a custom events dispatcher so things
	            if (this._eventMappings.has(type)) {
	                this._eventMappings.get(type).push(func);
	            } else {
	                this._eventMappings.set(type, [func]);
	            }
	            this._canvas.addEventListener(type, this._dispatchEvents, false);
	        }
	    }, {
	        key: "registerMediaSourceListener",
	        value: function registerMediaSourceListener(mediaSourceID, mediaSourceListener) {
	            if (this._mediaSourceListeners.has(mediaSourceID)) {
	                this._mediaSourceListeners.get(mediaSourceID).push(mediaSourceListener);
	            } else {
	                this._mediaSourceListeners.set(mediaSourceID, [mediaSourceListener]);
	            }
	        }
	    }, {
	        key: "_dispatchEvents",
	        value: function _dispatchEvents(evt) {
	            //Catch events and pass them on, mangling the detail property so it looks nice in the API
	            for (var i = 0; i < evt.detail.instance._eventMappings.get(evt.type).length; i++) {
	                evt.detail.instance._eventMappings.get(evt.type)[i](evt.detail.data);
	            }
	        }
	    }, {
	        key: "_getPlaylistPlayingStatusAtTime",
	        value: function _getPlaylistPlayingStatusAtTime(playlist, playhead) {
	            var toPlay = [];
	            var currentlyPlaying = [];
	            var finishedPlaying = [];

	            //itterate tracks
	            for (var i = 0; i < playlist.tracks.length; i++) {
	                var track = playlist.tracks[i];
	                for (var j = 0; j < track.length; j++) {
	                    var segment = track[j];
	                    var segmentEnd = segment.start + segment.duration;

	                    if (playhead > segmentEnd) {
	                        finishedPlaying.push(segment);
	                        continue;
	                    }
	                    if (playhead > segment.start && playhead < segmentEnd) {
	                        currentlyPlaying.push(segment);
	                        continue;
	                    }
	                    if (playhead <= segment.start) {
	                        toPlay.push(segment);
	                        continue;
	                    }
	                }
	            }

	            return [toPlay, currentlyPlaying, finishedPlaying];
	        }
	    }, {
	        key: "_sortMediaSourcesByStartTime",
	        value: function _sortMediaSourcesByStartTime(mediaSources) {
	            mediaSources.sort(function (a, b) {
	                return a.start - b.start;
	            });
	            return mediaSources;
	        }
	    }, {
	        key: "_getEffectShaderProgramForMediaSource",
	        value: function _getEffectShaderProgramForMediaSource(mediaSourceID) {
	            var effects = this._playlist.effects;
	            var defaultEffectShader = this._effectShaderPrograms.get("default");

	            if (effects === undefined) {
	                //No effects defined so just use default shader
	                return defaultEffectShader;
	            }

	            var _iteratorNormalCompletion = true;
	            var _didIteratorError = false;
	            var _iteratorError = undefined;

	            try {
	                for (var _iterator = Object.keys(effects)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	                    var effectKey = _step.value;

	                    var effect = effects[effectKey];
	                    if (effect.inputs.indexOf(mediaSourceID) > -1) {
	                        //Found effect for mediaSourceID
	                        //Check if program for effect is compiled.
	                        if (this._effectShaderPrograms.has(effect.effect.id)) {
	                            return this._effectShaderPrograms.get(effect.effect.id);
	                        } else {
	                            var effectShader = VideoCompositor.createEffectShaderProgram(this._ctx, effect);
	                            this._effectShaderPrograms.set(effect.effect.id, effectShader);
	                            return effectShader;
	                        }
	                    }
	                }
	            } catch (err) {
	                _didIteratorError = true;
	                _iteratorError = err;
	            } finally {
	                try {
	                    if (!_iteratorNormalCompletion && _iterator["return"]) {
	                        _iterator["return"]();
	                    }
	                } finally {
	                    if (_didIteratorError) {
	                        throw _iteratorError;
	                    }
	                }
	            }

	            //if wer get top this point no suitable effect shader was found so just return the default
	            return defaultEffectShader;
	        }
	    }, {
	        key: "_loadMediaSource",
	        value: function _loadMediaSource(mediaSourceReference, onReadyCallback) {
	            if (onReadyCallback === undefined) onReadyCallback = function () {};
	            var mediaSourceListeners = [];
	            if (this._mediaSourceListeners.has(mediaSourceReference.id)) {
	                mediaSourceListeners = this._mediaSourceListeners.get(mediaSourceReference.id);
	            }

	            switch (mediaSourceReference.type) {
	                case "video":
	                    var video = new _sourcesVideosourceJs2["default"](mediaSourceReference, this._ctx);
	                    video.onready = onReadyCallback;
	                    video.mediaSourceListeners = mediaSourceListeners;
	                    video.load();
	                    this._mediaSources.set(mediaSourceReference.id, video);
	                    break;
	                case "image":
	                    var image = new _sourcesImagesourceJs2["default"](mediaSourceReference, this._ctx);
	                    image.onready = onReadyCallback;
	                    image.mediaSourceListeners = mediaSourceListeners;
	                    image.load();
	                    this._mediaSources.set(mediaSourceReference.id, image);
	                    break;
	                case "canvas":
	                    var canvas = new _sourcesCanvassourceJs2["default"](mediaSourceReference, this._ctx);
	                    canvas.onready = onReadyCallback;
	                    canvas.mediaSourceListeners = mediaSourceListeners;
	                    canvas.load();
	                    this._mediaSources.set(mediaSourceReference.id, canvas);
	                    break;
	                default:
	                    throw { "error": 5, "msg": "mediaSourceReference " + mediaSourceReference.id + " has unrecognized type " + mediaSourceReference.type, toString: function toString() {
	                            return this.msg;
	                        } };
	            }
	        }
	    }, {
	        key: "_calculateTransitions",
	        value: function _calculateTransitions(currentlyPlaying, currentTime) {
	            //console.log(currentlyPlaying);

	            var maxInputs = currentlyPlaying.length;
	            //console.log(combinations);
	            //console.log(combinations(currentlyPlaying));
	        }
	    }, {
	        key: "update",
	        value: function update(dt) {
	            if (this._playlist === undefined || this._playing === false) return;

	            var _getPlaylistPlayingStatusAtTime2 = this._getPlaylistPlayingStatusAtTime(this._playlist, this._currentTime);

	            var _getPlaylistPlayingStatusAtTime22 = _slicedToArray(_getPlaylistPlayingStatusAtTime2, 3);

	            var toPlay = _getPlaylistPlayingStatusAtTime22[0];
	            var currentlyPlaying = _getPlaylistPlayingStatusAtTime22[1];
	            var finishedPlaying = _getPlaylistPlayingStatusAtTime22[2];

	            toPlay = this._sortMediaSourcesByStartTime(toPlay);

	            //Check if we've finished playing and then stop
	            if (toPlay.length === 0 && currentlyPlaying.length === 0) {
	                this.pause();
	                var endedEvent = new CustomEvent("ended", { detail: { data: this.currentTime, instance: this } });
	                this.currentTime = 0;
	                this._canvas.dispatchEvent(endedEvent);
	                return;
	            }

	            //Preload mediaSources
	            for (var i = 0; i < this._mediaSourcePreloadNumber; i++) {
	                if (i === toPlay.length) break;
	                if (this._mediaSources.has(toPlay[i].id) === false) {
	                    this._loadMediaSource(toPlay[i]);
	                }
	            }

	            //Clean-up any mediaSources which have already been played
	            for (var i = 0; i < finishedPlaying.length; i++) {
	                var mediaSourceReference = finishedPlaying[i];
	                if (this._mediaSources.has(mediaSourceReference.id)) {
	                    var mediaSource = this._mediaSources.get(mediaSourceReference.id);
	                    mediaSource.destroy();
	                    this._mediaSources["delete"](mediaSourceReference.id);
	                }
	            }

	            //Make sure all mediaSources are ready to play
	            var ready = true;
	            for (var i = 0; i < currentlyPlaying.length; i++) {
	                var mediaSourceID = currentlyPlaying[i].id;
	                //check that currently playing mediaSource exists
	                if (!this._mediaSources.has(mediaSourceID)) {
	                    //if not load it
	                    this._loadMediaSource(currentlyPlaying[i]);
	                    ready = false;
	                    continue;
	                }
	                if (!this._mediaSources.get(mediaSourceID).isReady()) ready = false;
	            }
	            //if all the sources aren't ready, exit function before rendering or advancing clock.
	            if (ready === false) {
	                return;
	            }

	            //Play mediaSources on the currently playing queue.
	            currentlyPlaying.reverse(); //reverse the currently playing queue so track 0 renders last

	            this._calculateTransitions(currentlyPlaying, this._currentTime);

	            for (var i = 0; i < currentlyPlaying.length; i++) {
	                var mediaSourceID = currentlyPlaying[i].id;
	                var mediaSource = this._mediaSources.get(mediaSourceID);
	                mediaSource.play();

	                var effectShaderProgram = this._getEffectShaderProgramForMediaSource(mediaSourceID);
	                mediaSource.render(effectShaderProgram);
	                //this._ctx.drawImage(mediaSource.render(), 0, 0, w, h);
	            }
	            this._currentTime += dt;
	        }
	    }, {
	        key: "currentTime",
	        set: function set(currentTime) {
	            console.log("Seeking to", currentTime);
	            if (this._playlist === undefined) {
	                return;
	            }

	            var _getPlaylistPlayingStatusAtTime3 = this._getPlaylistPlayingStatusAtTime(this._playlist, currentTime);

	            var _getPlaylistPlayingStatusAtTime32 = _slicedToArray(_getPlaylistPlayingStatusAtTime3, 3);

	            var toPlay = _getPlaylistPlayingStatusAtTime32[0];
	            var currentlyPlaying = _getPlaylistPlayingStatusAtTime32[1];
	            var finishedPlaying = _getPlaylistPlayingStatusAtTime32[2];

	            //clean-up any currently playing mediaSources
	            this._mediaSources.forEach(function (mediaSource) {
	                mediaSource.destroy();
	            });
	            this._mediaSources.clear();

	            //Load mediaSources
	            for (var i = 0; i < currentlyPlaying.length; i++) {
	                var mediaSourceID = currentlyPlaying[i].id;
	                //If the media source isn't loaded then we start loading it.
	                if (this._mediaSources.has(mediaSourceID) === false) {

	                    this._loadMediaSource(currentlyPlaying[i], function (mediaSource) {
	                        //let mediaSource = _this._mediaSources.get(mediaSourceID);
	                        mediaSource.seek(currentTime);
	                    });
	                } else {
	                    //If the mediaSource is loaded then we seek to the proper bit
	                    this._mediaSources.get(mediaSourceID).seek(currentTime);
	                }
	            }

	            this._currentTime = currentTime;
	            var seekEvent = new CustomEvent("seek", { detail: { data: currentTime, instance: this } });
	            this._canvas.dispatchEvent(seekEvent);
	        },
	        get: function get() {
	            return this._currentTime;
	        }
	    }, {
	        key: "playlist",
	        set: function set(playlist) {
	            VideoCompositor.validatePlaylist(playlist);
	            this.duration = VideoCompositor.calculatePlaylistDuration(playlist);
	            this._playlist = playlist;
	            //clean-up any currently playing mediaSources
	            this._mediaSources.forEach(function (mediaSource) {
	                mediaSource.destroy();
	            });
	            this._mediaSources.clear();
	        }
	    }], [{
	        key: "calculateTrackDuration",
	        value: function calculateTrackDuration(track) {
	            var maxPlayheadPosition = 0;
	            for (var j = 0; j < track.length; j++) {
	                var playheadPosition = track[j].start + track[j].duration;
	                if (playheadPosition > maxPlayheadPosition) {
	                    maxPlayheadPosition = playheadPosition;
	                }
	            }
	            return maxPlayheadPosition;
	        }
	    }, {
	        key: "calculatePlaylistDuration",
	        value: function calculatePlaylistDuration(playlist) {
	            var maxTrackDuration = 0;

	            for (var i = 0; i < playlist.tracks.length; i++) {
	                var track = playlist.tracks[i];
	                var trackDuration = VideoCompositor.calculateTrackDuration(track);
	                if (trackDuration > maxTrackDuration) {
	                    maxTrackDuration = trackDuration;
	                }
	            }

	            return maxTrackDuration;
	        }
	    }, {
	        key: "validatePlaylist",
	        value: function validatePlaylist(playlist) {
	            /*     
	            This function validates a passed playlist, making sure it matches a 
	            number of properties a playlist must have to be OK.
	             * Error 1. MediaSourceReferences have a unique ID        
	            * Error 2. The playlist media sources have all the expected properties.
	            * Error 3. MediaSourceReferences in single track are sequential.
	            * Error 4. MediaSourceReferences in single track don't overlap
	            */

	            //Error 1. MediaSourceReferences have a unique ID
	            var IDs = new Map();
	            for (var i = 0; i < playlist.tracks.length; i++) {
	                var track = playlist.tracks[i];
	                for (var j = 0; j < track.length; j++) {
	                    var MediaSourceReference = track[j];
	                    if (IDs.has(MediaSourceReference.id)) {
	                        throw { "error": 1, "msg": "MediaSourceReference " + MediaSourceReference.id + " in track " + i + " has a duplicate ID.", toString: function toString() {
	                                return this.msg;
	                            } };
	                    } else {
	                        IDs.set(MediaSourceReference.id, true);
	                    }
	                }
	            }

	            //Error 2. The playlist MediaSourceReferences have all the expected properties.
	            for (var i = 0; i < playlist.tracks.length; i++) {
	                var track = playlist.tracks[i];
	                for (var j = 0; j < track.length; j++) {
	                    var MediaSourceReference = track[j];
	                    if (MediaSourceReference.id === undefined) throw { "error": 2, "msg": "MediaSourceReference " + MediaSourceReference.id + " in track " + i + " is missing a id property", toString: function toString() {
	                            return this.msg;
	                        } };
	                    if (MediaSourceReference.start === undefined) throw { "error": 2, "msg": "MediaSourceReference " + MediaSourceReference.id + " in track " + i + " is missing a start property", toString: function toString() {
	                            return this.msg;
	                        } };
	                    if (MediaSourceReference.duration === undefined) throw { "error": 2, "msg": "MediaSourceReference " + MediaSourceReference.id + " in track " + i + " is missing a duration property", toString: function toString() {
	                            return this.msg;
	                        } };
	                    if (MediaSourceReference.type === undefined) throw { "error": 2, "msg": "MediaSourceReference " + MediaSourceReference.id + " in track " + i + " is missing a type property", toString: function toString() {
	                            return this.msg;
	                        } };
	                    if (MediaSourceReference.src !== undefined && MediaSourceReference.element !== undefined) throw { "error": 2, "msg": "MediaSourceReference " + MediaSourceReference.id + " in track " + i + " has both a src and element, it must have one or the other", toString: function toString() {
	                            return this.msg;
	                        } };
	                    if (MediaSourceReference.src === undefined && MediaSourceReference.element === undefined) throw { "error": 2, "msg": "MediaSourceReference " + MediaSourceReference.id + " in track " + i + " has neither a src or an element, it must have one or the other", toString: function toString() {
	                            return this.msg;
	                        } };
	                }
	            }

	            // Error 3. MediaSourceReferences in single track are sequential.
	            for (var i = 0; i < playlist.tracks.length; i++) {
	                var track = playlist.tracks[i];
	                var time = 0;
	                for (var j = 0; j < track.length; j++) {
	                    var MediaSourceReference = track[j];
	                    if (MediaSourceReference.start < time) {
	                        throw { "error": 3, "msg": "MediaSourceReferences " + MediaSourceReference.id + " in track " + i + " starts before previous MediaSourceReference", toString: function toString() {
	                                return this.msg;
	                            } };
	                    }
	                    time = MediaSourceReference.start;
	                }
	            }

	            //Error 4. MediaSourceReferences in single track don't overlap
	            for (var i = 0; i < playlist.tracks.length; i++) {
	                var track = playlist.tracks[i];
	                var previousMediaSourceReference = undefined;
	                for (var j = 0; j < track.length; j++) {
	                    var MediaSourceReference = track[j];
	                    if (previousMediaSourceReference === undefined) {
	                        previousMediaSourceReference = MediaSourceReference;
	                        continue;
	                    }
	                    var previousEnd = previousMediaSourceReference.start + previousMediaSourceReference.duration;
	                    var currentStart = MediaSourceReference.start;
	                    if (previousEnd > currentStart) {
	                        throw { "error": 4, "msg": "Track MediaSourceReferences overlap. MediaSourceReference " + previousMediaSourceReference.id + " in track " + i + " finishes after MediaSourceReference " + MediaSourceReference.id + " starts.", toString: function toString() {
	                                return this.msg;
	                            } };
	                    }
	                }
	            }
	        }
	    }, {
	        key: "createEffectShaderProgram",
	        value: function createEffectShaderProgram(gl, effect) {
	            var vertexShaderSource = "            attribute vec2 a_position;            attribute vec2 a_texCoord;            varying vec2 v_texCoord;                        void main() {                gl_Position = vec4(2.0*a_position-1.0, 0.0, 1.0);                v_texCoord = a_texCoord;            }";

	            var fragmentShaderSource = "            precision mediump float;            uniform sampler2D u_image;            varying vec2 v_texCoord;            void main(){                gl_FragColor = texture2D(u_image, v_texCoord)*vec4(1.0,1.0,1.0,1.0);            }";

	            if (effect !== undefined) {
	                if (effect.effect.fragmentShader !== undefined) fragmentShaderSource = effect.effect.fragmentShader;
	                if (effect.effect.vertexShader !== undefined) vertexShaderSource = effect.effect.vertexShader;
	            }

	            var program = VideoCompositor.createShaderProgram(gl, vertexShaderSource, fragmentShaderSource);
	            return program;
	        }
	    }, {
	        key: "createShaderProgram",
	        value: function createShaderProgram(gl, vertexShaderSource, fragmentShaderSource) {
	            var vertexShader = VideoCompositor.compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
	            var fragmentShader = VideoCompositor.compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
	            var program = gl.createProgram();

	            gl.attachShader(program, vertexShader);
	            gl.attachShader(program, fragmentShader);
	            gl.linkProgram(program);

	            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
	                throw { "error": 4, "msg": "Can't link shader program for track", toString: function toString() {
	                        return this.msg;
	                    } };
	            }
	            return program;
	        }
	    }, {
	        key: "compileShader",
	        value: function compileShader(gl, shaderSource, shaderType) {
	            var shader = gl.createShader(shaderType);
	            gl.shaderSource(shader, shaderSource);
	            gl.compileShader(shader);
	            var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	            if (!success) {
	                throw "could not compile shader:" + gl.getShaderInfoLog(shader);
	            }
	            return shader;
	        }
	    }, {
	        key: "renderPlaylist",
	        value: function renderPlaylist(playlist, canvas, currentTime) {
	            var ctx = canvas.getContext("2d");
	            var w = canvas.width;
	            var h = canvas.height;
	            var trackHeight = h / playlist.tracks.length;
	            var playlistDuration = VideoCompositor.calculatePlaylistDuration(playlist);
	            var pixelsPerSecond = w / playlistDuration;
	            var mediaSourceStyle = {
	                "video": "#a5a",
	                "image": "#5aa",
	                "canvas": "#aa5"
	            };

	            ctx.clearRect(0, 0, w, h);
	            ctx.fillStyle = "#999";
	            for (var i = 0; i < playlist.tracks.length; i++) {
	                var track = playlist.tracks[i];
	                for (var j = 0; j < track.length; j++) {
	                    var mediaSource = track[j];
	                    var msW = mediaSource.duration * pixelsPerSecond;
	                    var msH = trackHeight;
	                    var msX = mediaSource.start * pixelsPerSecond;
	                    var msY = trackHeight * i;
	                    ctx.fillStyle = mediaSourceStyle[mediaSource.type];
	                    ctx.fillRect(msX, msY, msW, msH);
	                    ctx.fill();
	                }
	            }

	            if (currentTime !== undefined) {
	                ctx.fillStyle = "#000";
	                ctx.fillRect(currentTime * pixelsPerSecond, 0, 1, h);
	            }
	        }
	    }]);

	    return VideoCompositor;
	})();

	VideoCompositor.Effects = {
	    "MONOCHROME": {
	        "id": "monochrome-filter",
	        "fragmentShader": "                    precision mediump float;                    uniform sampler2D u_image;                    varying vec2 v_texCoord;                    void main(){                        vec4 pixel = texture2D(u_image, v_texCoord);                        float avg = (pixel[0]*0.2125 + pixel[1]*0.7154 + pixel[2]*0.0721)/3.0;                        pixel = vec4(avg*1.5, avg*1.5, avg*1.5, pixel[3]);                        gl_FragColor = pixel;                    }"
	    },
	    "SEPIA": {
	        "id": "sepia-filter",
	        "fragmentShader": "                    precision mediump float;                    uniform sampler2D u_image;                    varying vec2 v_texCoord;                    void main(){                        vec4 pixel = texture2D(u_image, v_texCoord);                        float avg = (pixel[0]*0.2125 + pixel[1]*0.7154 + pixel[2]*0.0721)/3.0;                        pixel = vec4(avg*2.0, avg*1.6, avg, pixel[3]);                        gl_FragColor = pixel;                    }"
	    },
	    "BITCRUNCH": {
	        "id": "bitcrunch-filter",
	        "fragmentShader": "                    precision mediump float;                    uniform sampler2D u_image;                    varying vec2 v_texCoord;                    void main(){                        vec4 pixel = texture2D(u_image, v_texCoord);                        pixel = floor(pixel*vec4(8.0,8.0,8.0,8.0));                        pixel = pixel/vec4(8.0,8.0,8.0,8.0);                        gl_FragColor = pixel*vec4(1.0,1.0,1.0,1.0);                    }"
	    },
	    //Green screen color =  r = 62, g = 178, b = 31
	    //Normalised         = r = 0.243, g= 0.698, b = 0.122
	    "GREENSCREENMAD": {
	        "id": "greenscreen-filter",
	        "fragmentShader": "                    precision mediump float;                    uniform sampler2D u_image;                    varying vec2 v_texCoord;                    void main(){                        vec4 pixel = texture2D(u_image, v_texCoord);                        float alpha = 1.0;                        float r = pixel[0];                        float g = pixel[1];                        float b = pixel[2];                        float y =  0.299*r + 0.587*g + 0.114*b;                        float u = -0.147*r - 0.289*g + 0.436*b;                        float v =  0.615*r - 0.515*g - 0.100*b;                        ;                        alpha = (v+u)*10.0 +2.0;                                                pixel = floor(pixel*vec4(2.0,2.0,2.0,2.0));                        pixel = pixel/vec4(2.0,2.0,2.0,2.0);                        pixel = vec4(pixel[2]*2.0, pixel[1]*2.0, pixel[0]*2.0, alpha);                        gl_FragColor = pixel;                    }"
	    },
	    "GREENSCREEN": {
	        "id": "greenscreen-filter",
	        "fragmentShader": "                    precision mediump float;                    uniform sampler2D u_image;                    varying vec2 v_texCoord;                    void main(){                        vec4 pixel = texture2D(u_image, v_texCoord);                        float alpha = 1.0;                        float r = pixel[0];                        float g = pixel[1];                        float b = pixel[2];                        float y =  0.299*r + 0.587*g + 0.114*b;                        float u = -0.147*r - 0.289*g + 0.436*b;                        float v =  0.615*r - 0.515*g - 0.100*b;                        if (y > 0.2 && y < 0.8){                            alpha = (v+u)*40.0 +2.0;                        }                        pixel = vec4(pixel[0], pixel[1], pixel[2], alpha);                        gl_FragColor = pixel;                    }"
	    }
	};

	exports["default"] = VideoCompositor;
	module.exports = exports["default"];

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

	var _mediasource = __webpack_require__(2);

	var _mediasource2 = _interopRequireDefault(_mediasource);

	var VideoSource = (function (_MediaSource) {
	    function VideoSource(properties, gl) {
	        _classCallCheck(this, VideoSource);

	        _get(Object.getPrototypeOf(VideoSource.prototype), "constructor", this).call(this, properties, gl);
	        this.sourceStart = 0;
	        this._volume = 1.0;
	        if (properties.sourceStart !== undefined) {
	            this.sourceStart = properties.sourceStart;
	        }
	        if (properties.volume !== undefined) {
	            this._volume = properties.volume;
	        }
	    }

	    _inherits(VideoSource, _MediaSource);

	    _createClass(VideoSource, [{
	        key: "play",
	        value: function play() {
	            _get(Object.getPrototypeOf(VideoSource.prototype), "play", this).call(this);
	            this.element.play();
	        }
	    }, {
	        key: "seek",
	        value: function seek(time) {
	            _get(Object.getPrototypeOf(VideoSource.prototype), "seek", this).call(this, time);
	            if (time - this.start < 0 || time > this.start + this.duration) {
	                this.element.currentTime = this.sourceStart;
	            } else {
	                this.element.currentTime = time - this.start + this.sourceStart;
	            }
	        }
	    }, {
	        key: "pause",
	        value: function pause() {
	            _get(Object.getPrototypeOf(VideoSource.prototype), "pause", this).call(this);
	            this.element.pause();
	        }
	    }, {
	        key: "load",
	        value: function load() {
	            //check if we're using an already instatiated element, if so don't do anything.

	            if (_get(Object.getPrototypeOf(VideoSource.prototype), "load", this).call(this)) {
	                //this.element.currentTime = this.sourceStart;
	                this.seek(0);
	                this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.element);
	                this.ready = true;
	                this.onready(this);
	                return;
	            };
	            //otherwise begin the loading process for this mediaSource
	            this.element = document.createElement("video");
	            //construct a fragement URL to cut the required segment from the source video
	            this.element.src = this.src;
	            this.element.volume = this._volume;
	            this.element.preload = "auto";
	            this.element.load();
	            var _this = this;
	            this.element.addEventListener("loadeddata", function () {
	                _this.element.currentTime = _this.sourceStart;
	                _this.seek(0);
	                _this.gl.texImage2D(_this.gl.TEXTURE_2D, 0, _this.gl.RGBA, _this.gl.RGBA, _this.gl.UNSIGNED_BYTE, _this.element);
	                _this.ready = true;
	                _this.onready(_this);
	            }, false);
	            /*this.element.addEventListener('seeked', function(){
	                console.log("SEEKED");
	                _this.ready = true;
	                _this.onready(_this);
	            })*/
	        }
	    }, {
	        key: "render",
	        value: function render(program) {
	            _get(Object.getPrototypeOf(VideoSource.prototype), "render", this).call(this, program);
	        }
	    }, {
	        key: "destroy",
	        value: function destroy() {
	            this.element.pause();
	            _get(Object.getPrototypeOf(VideoSource.prototype), "destroy", this).call(this);
	        }
	    }]);

	    return VideoSource;
	})(_mediasource2["default"]);

	exports["default"] = VideoSource;
	module.exports = exports["default"];

/***/ },
/* 2 */
/***/ function(module, exports) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var MediaSource = (function () {
	    function MediaSource(properties, gl) {
	        _classCallCheck(this, MediaSource);

	        this.gl = gl;
	        this.id = properties.id;
	        this.duration = properties.duration;
	        this.start = properties.start;
	        this.playing = false;
	        this.ready = false;
	        this.element = undefined;
	        this.src = undefined;
	        this.texture = undefined;
	        this.mediaSourceListeners = [];

	        this.disposeOfElementOnDestroy = false;

	        //If the mediaSource is created from a src string then it must be resonsible for cleaning itself up.
	        if (properties.src !== undefined) {
	            this.disposeOfElementOnDestroy = true;
	            this.src = properties.src;
	        } else {
	            //If the MediaSource is created from an element then it should not clean the element up on destruction as it may be used elsewhere.
	            this.disposeOfElementOnDestroy = false;
	            this.element = properties.element;
	        }

	        /*var positionLocation = gl.getAttribLocation(program, "a_position");
	        var texCoordLocation = gl.getAttribLocation(program, "a_texCoord");*/

	        //Hard Code these for now, but this is baaaaaad
	        var positionLocation = 0;
	        var texCoordLocation = 1;

	        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	        gl.enable(gl.BLEND);
	        // Create a texture.
	        this.texture = gl.createTexture();
	        gl.bindTexture(gl.TEXTURE_2D, this.texture);
	        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	        // Set the parameters so we can render any size image.
	        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

	        var buffer = gl.createBuffer();
	        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	        gl.enableVertexAttribArray(positionLocation);
	        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

	        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0]), gl.STATIC_DRAW);
	        gl.enableVertexAttribArray(texCoordLocation);
	        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
	    }

	    _createClass(MediaSource, [{
	        key: "play",
	        value: function play() {
	            //console.log("Playing", this.id);
	            this.playing = true;
	            for (var i = 0; i < this.mediaSourceListeners.length; i++) {
	                this.mediaSourceListeners[i].play();
	            }
	        }
	    }, {
	        key: "pause",
	        value: function pause() {
	            console.log("Pausing", this.id);
	            this.playing = false;
	            for (var i = 0; i < this.mediaSourceListeners.length; i++) {
	                this.mediaSourceListeners[i].pause();
	            }
	        }
	    }, {
	        key: "seek",
	        value: function seek(seekTime) {
	            //this.currentTime = seekTime;
	            for (var i = 0; i < this.mediaSourceListeners.length; i++) {
	                this.mediaSourceListeners[i].seek(seekTime);
	            }
	        }
	    }, {
	        key: "isReady",
	        value: function isReady() {
	            return this.ready;
	        }
	    }, {
	        key: "load",
	        value: function load() {
	            console.log("Loading", this.id);
	            for (var i = 0; i < this.mediaSourceListeners.length; i++) {
	                this.mediaSourceListeners[i].load();
	            }
	            if (this.element !== undefined) {
	                return true;
	            }
	            return false;
	        }
	    }, {
	        key: "destroy",
	        value: function destroy() {
	            console.log("Destroying", this.id);
	            for (var i = 0; i < this.mediaSourceListeners.length; i++) {
	                this.mediaSourceListeners[i].destroy();
	            }
	            if (this.disposeOfElementOnDestroy) {
	                delete this.element;
	            }
	        }
	    }, {
	        key: "render",
	        value: function render(program) {
	            //renders the media source to the WebGL context using the pased program
	            for (var i = 0; i < this.mediaSourceListeners.length; i++) {
	                this.mediaSourceListeners[i].render();
	            }
	            this.gl.useProgram(program);
	            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
	            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.element);
	            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
	        }
	    }, {
	        key: "onready",
	        value: function onready(mediaSource) {}
	    }]);

	    return MediaSource;
	})();

	exports["default"] = MediaSource;
	module.exports = exports["default"];

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

	var _mediasource = __webpack_require__(2);

	var _mediasource2 = _interopRequireDefault(_mediasource);

	var ImageSource = (function (_MediaSource) {
	    function ImageSource(properties, gl) {
	        _classCallCheck(this, ImageSource);

	        _get(Object.getPrototypeOf(ImageSource.prototype), "constructor", this).call(this, properties, gl);
	    }

	    _inherits(ImageSource, _MediaSource);

	    _createClass(ImageSource, [{
	        key: "play",
	        value: function play() {
	            _get(Object.getPrototypeOf(ImageSource.prototype), "play", this).call(this);
	        }
	    }, {
	        key: "seek",
	        value: function seek(time) {
	            _get(Object.getPrototypeOf(ImageSource.prototype), "seek", this).call(this, time);
	        }
	    }, {
	        key: "pause",
	        value: function pause() {
	            _get(Object.getPrototypeOf(ImageSource.prototype), "pause", this).call(this);
	        }
	    }, {
	        key: "load",
	        value: function load() {
	            //check if we're using an already instatiated element, if so don't do anything.
	            if (_get(Object.getPrototypeOf(ImageSource.prototype), "load", this).call(this)) {
	                this.seek(0);
	                this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.element);
	                this.ready = true;
	                // Upload the image into the texture.
	                this.onready(this);
	                return;
	            };

	            //otherwise begin the loading process for this mediaSource
	            this.element = new Image();
	            var _this = this;
	            this.element.onload = function () {
	                _this.gl.texImage2D(_this.gl.TEXTURE_2D, 0, _this.gl.RGBA, _this.gl.RGBA, _this.gl.UNSIGNED_BYTE, _this.element);
	                _this.ready = true;
	                _this.onready(_this);
	            };
	            this.element.src = this.src;
	        }
	    }, {
	        key: "render",
	        value: function render(program) {
	            _get(Object.getPrototypeOf(ImageSource.prototype), "render", this).call(this, program);
	        }
	    }]);

	    return ImageSource;
	})(_mediasource2["default"]);

	exports["default"] = ImageSource;
	module.exports = exports["default"];

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

	var _mediasource = __webpack_require__(2);

	var _mediasource2 = _interopRequireDefault(_mediasource);

	var CanvasSource = (function (_MediaSource) {
	    function CanvasSource(properties, gl) {
	        _classCallCheck(this, CanvasSource);

	        _get(Object.getPrototypeOf(CanvasSource.prototype), "constructor", this).call(this, properties, gl);
	        this.width = properties.width;
	        this.height = properties.height;
	    }

	    _inherits(CanvasSource, _MediaSource);

	    _createClass(CanvasSource, [{
	        key: "play",
	        value: function play() {
	            _get(Object.getPrototypeOf(CanvasSource.prototype), "play", this).call(this);
	        }
	    }, {
	        key: "seek",
	        value: function seek(time) {
	            _get(Object.getPrototypeOf(CanvasSource.prototype), "seek", this).call(this, time);
	        }
	    }, {
	        key: "pause",
	        value: function pause() {
	            _get(Object.getPrototypeOf(CanvasSource.prototype), "pause", this).call(this);
	        }
	    }, {
	        key: "load",
	        value: function load() {
	            //check if we're using an already instatiated element, if so don't do anything.
	            if (_get(Object.getPrototypeOf(CanvasSource.prototype), "load", this).call(this)) {
	                this.seek(0);
	                this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.element);
	                this.ready = true;
	                this.onready(this);
	                return;
	            }

	            //otherwise begin the loading process for this mediaSource
	            this.element = document.createElement("canvas");
	            this.element.width = this.width;
	            this.element.height = this.height;
	            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.element);
	            this.ready = true;
	            this.onready(this);
	        }
	    }, {
	        key: "render",
	        value: function render(program) {
	            _get(Object.getPrototypeOf(CanvasSource.prototype), "render", this).call(this, program);
	        }
	    }]);

	    return CanvasSource;
	})(_mediasource2["default"]);

	exports["default"] = CanvasSource;
	module.exports = exports["default"];

/***/ },
/* 5 */
/***/ function(module, exports) {

	/**
	 * Copyright 2012 Akseli Palén.
	 * Created 2012-07-15.
	 * Licensed under the MIT license.
	 * 
	 * <license>
	 * Permission is hereby granted, free of charge, to any person obtaining
	 * a copy of this software and associated documentation files
	 * (the "Software"), to deal in the Software without restriction,
	 * including without limitation the rights to use, copy, modify, merge,
	 * publish, distribute, sublicense, and/or sell copies of the Software,
	 * and to permit persons to whom the Software is furnished to do so,
	 * subject to the following conditions:
	 * 
	 * The above copyright notice and this permission notice shall be
	 * included in all copies or substantial portions of the Software.
	 * 
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
	 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
	 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
	 * BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
	 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
	 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	 * SOFTWARE.
	 * </lisence>
	 * 
	 * Implements functions to calculate combinations of elements in JS Arrays.
	 * 
	 * Functions:
	 *   k_combinations(set, k) -- Return all k-sized combinations in a set
	 *   combinations(set) -- Return all combinations of the set
	 */

	/**
	 * K-combinations
	 * 
	 * Get k-sized combinations of elements in a set.
	 * 
	 * Usage:
	 *   k_combinations(set, k)
	 * 
	 * Parameters:
	 *   set: Array of objects of any type. They are treated as unique.
	 *   k: size of combinations to search for.
	 * 
	 * Return:
	 *   Array of found combinations, size of a combination is k.
	 * 
	 * Examples:
	 * 
	 *   k_combinations([1, 2, 3], 1)
	 *   -> [[1], [2], [3]]
	 * 
	 *   k_combinations([1, 2, 3], 2)
	 *   -> [[1,2], [1,3], [2, 3]
	 * 
	 *   k_combinations([1, 2, 3], 3)
	 *   -> [[1, 2, 3]]
	 * 
	 *   k_combinations([1, 2, 3], 4)
	 *   -> []
	 * 
	 *   k_combinations([1, 2, 3], 0)
	 *   -> []
	 * 
	 *   k_combinations([1, 2, 3], -1)
	 *   -> []
	 * 
	 *   k_combinations([], 0)
	 *   -> []
	 */
	"use strict";

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.k_combinations = k_combinations;
	exports.combinations = combinations;

	function k_combinations(set, k) {
	  var i, j, combs, head, tailcombs;

	  if (k > set.length || k <= 0) {
	    return [];
	  }

	  if (k == set.length) {
	    return [set];
	  }

	  if (k == 1) {
	    combs = [];
	    for (i = 0; i < set.length; i++) {
	      combs.push([set[i]]);
	    }
	    return combs;
	  }

	  // Assert {1 < k < set.length}

	  combs = [];
	  for (i = 0; i < set.length - k + 1; i++) {
	    head = set.slice(i, i + 1);
	    tailcombs = k_combinations(set.slice(i + 1), k - 1);
	    for (j = 0; j < tailcombs.length; j++) {
	      combs.push(head.concat(tailcombs[j]));
	    }
	  }
	  return combs;
	}

	/**
	 * Combinations
	 * 
	 * Get all possible combinations of elements in a set.
	 * 
	 * Usage:
	 *   combinations(set)
	 * 
	 * Examples:
	 * 
	 *   combinations([1, 2, 3])
	 *   -> [[1],[2],[3],[1,2],[1,3],[2,3],[1,2,3]]
	 * 
	 *   combinations([1])
	 *   -> [[1]]
	 */

	function combinations(set) {
	  var k, i, combs, k_combs;
	  combs = [];

	  // Calculate all non-empty k-combinations
	  for (k = 1; k <= set.length; k++) {
	    k_combs = k_combinations(set, k);
	    for (i = 0; i < k_combs.length; i++) {
	      combs.push(k_combs[i]);
	    }
	  }
	  return combs;
	}

/***/ }
/******/ ]);