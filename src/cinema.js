(function () {

	/*
	 * constructor
	 * @public
	 * @param {Element} container - parent dom element for audio player
	 * @param {Object} settings - object to overwrite default settings
	 */
	this.Cinema = function (media, settings) {

		// default settings
		var defaults = {
			autoplay: false,
			display: {
				fullScreenBtn: true,
				times: true,
				progressBar: true,
				volumeBar: true
			},
			animate: {
				toolbar: true
			}
		};

		// props
		this.media = media;
		this.settings = extendDefaults(defaults, settings);
		this.state = {
			playing: !this.settings.autoplay,
			fullScreen: false
		};

		// render dom elements
		this.render();

	};

	/*
	 * renders dom elements and adds event listeners
	 * @public
	 */
	Cinema.prototype.render = function () {

		// media file
		this.media.className = 'cinema-media';
		this.media.addEventListener('timeupdate', this.playingRender.bind(this));
		this.media.addEventListener('ended', this.mediaEndRender.bind(this));
		this.media.addEventListener('progress', this.progressRender.bind(this));

		// container
		this.container = document.createElement('div');
		this.container.className = 'cinema-container';
		this.media.parentNode.insertBefore(this.container, this.media.nextSibling);
		this.container.appendChild(this.media);
		if (this.settings.animate.toolbar) {
			this.container.addEventListener('mouseover', this.mediaMouseoverRender.bind(this));
			this.container.addEventListener('mouseout', this.mediaMouseoutRender.bind(this));
		}

		// toolbar
		this.toolbar = document.createElement('div');
		this.toolbar.className = 'cinema-toolbar';
		if (!this.settings.animate.toolbar) {
			this.toolbar.classList.add('cinema-toolbar-active');
		}
		this.container.appendChild(this.toolbar);

		// left toolbar
		this.leftToolbar = document.createElement('div');
		this.leftToolbar.className = 'cinema-toolbar-left';
		this.toolbar.appendChild(this.leftToolbar);

		// right toolbar
		this.rightToolbar = document.createElement('div');
		this.rightToolbar.className = 'cinema-toolbar-right';
		this.toolbar.appendChild(this.rightToolbar);

		// play button
		this.playBtn = document.createElement('button');
		this.playBtn.className = 'cinema-btn cinema-btn-play';
		this.playBtnImg = document.createElement('img');
		this.playBtn.appendChild(this.playBtnImg);
		this.playBtn.addEventListener('click', this.playPause.bind(this));
		this.leftToolbar.appendChild(this.playBtn);

		// full screen button
		if (this.settings.display.fullScreenBtn) {
			this.fullScreenBtn = document.createElement('button');
			this.fullScreenBtn.className = 'cinema-btn cinema-btn-fullscreen';
			// this.fullScreenBtn.textContent = 'Full Screen';
			this.fullScreenBtnImg = document.createElement('img');
			this.fullScreenBtnImg.src = 'icons/fullscreen.svg';
			this.fullScreenBtn.appendChild(this.fullScreenBtnImg);
			this.fullScreenBtn.addEventListener('click', this.fullScreen.bind(this));
			this.rightToolbar.appendChild(this.fullScreenBtn);
		}

		// time elapsed / duration
		if (this.settings.display.times) {

			// container for all time-related elements
			this.timeContainer = document.createElement('span');
			this.timeContainer.className = 'cinema-times';

			// elasped time init
			this.elapsedTimeSpan = document.createElement('span');
			this.elapsedTimeSpan.className = 'cinema-times-elasped';
			this.elapsedTimeSpan.textContent = '0:00';
			this.timeContainer.appendChild(this.elapsedTimeSpan);

			// separator
			this.timeSeparatorSpan = document.createElement('span');
			this.timeSeparatorSpan.className = 'cinema-times-separator';
			this.timeSeparatorSpan.textContent = ' / ';
			this.timeContainer.appendChild(this.timeSeparatorSpan);

			// get duration when ready
			this.media.addEventListener('durationchange', this.durationRender.bind(this));

			// place overall element in toolbar
			this.leftToolbar.appendChild(this.timeContainer);

		}

		// progress bar
		if (this.settings.display.progressBar) {

			this.progressBarContainer = document.createElement('div');
			this.progressBarContainer.className = 'cinema-progress-bar-container';
			this.progressBarContainer.addEventListener('click', this.progressBarInnerRender.bind(this));
			this.container.appendChild(this.progressBarContainer);

			this.progressBarInner = document.createElement('span');
			this.progressBarInner.className = 'cinema-progress-bar-inner';

			this.progressBarBuffer = document.createElement('span');
			this.progressBarBuffer.className = 'cinema-progress-bar-buffer';

			this.progressBarContainer.appendChild(this.progressBarBuffer);
			this.progressBarContainer.appendChild(this.progressBarInner);

		}

		// state initialization and autoplay if defined
		this.playPause();

	};

	/*
	 * play or pause media depending on state
	 * @public
	 */
	Cinema.prototype.playPause = function () {
		this.state.playing ? this.pause() : this.play();
	};

	/*
	 * play media
	 * @public
	 */
	Cinema.prototype.play = function () {
		this.media.play();
		// this.playBtn.textContent = 'Pause';
		this.playBtnImg.src = 'icons/pause.svg';
		this.state.playing = true;
	};

	/*
	 * pause media
	 * @public
	 */
	Cinema.prototype.pause = function () {
		this.media.pause();
		// this.playBtn.textContent = 'Play';
		this.playBtnImg.src = 'icons/play.svg';
		this.state.playing = false;
	};

	/*
	 * make video full screenish
	 * @public
	 */
	Cinema.prototype.fullScreen = function () {
		this.state.fullScreen ? this.container.classList.remove('cinema-fullscreen') : this.container.classList.add('cinema-fullscreen');
		this.state.fullScreen = !this.state.fullScreen;
	};

	/*
	 * renders on mouseover of media
	 * @public
	 */
	Cinema.prototype.mediaMouseoverRender = function () {
		this.toolbar.classList.add('cinema-toolbar-active');
	};

	/*
	 * renders on mouseout of media
	 * @public
	 */
	Cinema.prototype.mediaMouseoutRender = function () {
		this.toolbar.classList.remove('cinema-toolbar-active');
	};

	/*
	 * renders the elasped time dom element
	 * @public
	 */
	Cinema.prototype.playingRender = function () {

		/*
		 * @TODO
		 * A consideration more than a thing that needs to happen
		 * the 'timeupdate' event (referenced in the render() method) runs at a rate
		 * that can make this functionality look buggy because:
		 * - Doesn't run frequently enough
		 * - Doesn't run at a consistent rate, e.g. sometimes it's a 0.5 seconds and sometimes it's 1.5 seconds
		 * Alternative to consider is setInterval(); not as cool, but might look smoother
		 * Also saw mention of window.requestAnimationFrame(); just look into it when this happens
		 */

		// progress bar
		if (this.settings.display.progressBar) {
			var percentageElapsed = (this.media.currentTime / this.media.duration) * 100;
			this.progressBarInner.style.width = percentageElapsed + '%';
		}

		// time elapsed string
		if (this.settings.display.times) {
			this.elapsedTimeSpan.textContent = secondsToString(this.media.currentTime);
		}

	};

	/*
	 * renders the buffered time dom element
	 * @public
	 */
	Cinema.prototype.progressRender = function () {
		if (this.settings.display.progressBar) {
			var m = this.media;
			for (var i = 0; i < m.buffered.length; i++) {
				if (m.buffered.start(m.buffered.length - 1 - i) < m.currentTime) {
					this.progressBarBuffer.style.width = (m.buffered.end(m.buffered.length - 1 - i) / m.duration) * 100 + '%';
					break;
				}
			}
		}
	};

	/*
	 * renders the duration time dom element
	 * @public
	 */
	Cinema.prototype.durationRender = function () {
		this.durationSpan = document.createElement('span');
		this.durationSpan.className = 'cinema-times-duration';
		this.durationSpan.textContent = secondsToString(this.media.duration) || 'Not Applicable';
		this.timeContainer.appendChild(this.durationSpan);
	};

	/*
	 * renders the inner progress bar element
	 * @public
	 * @Param {Event}
	 */
	Cinema.prototype.progressBarInnerRender = function (e) {
		this.media.currentTime = (e.offsetX / this.progressBarContainer.clientWidth) * this.media.duration;
	};

	/*
	 * renders the duration time dom element
	 * @public
	 */
	Cinema.prototype.mediaEndRender = function () {
		this.state.playing = false;
		this.playBtn.textContent = 'Replay';
	};

	/*
	 * takes a number of seconds and converts it into a user-friendly string, e.g. 0:42 or 2:38
	 * @private
	 * @param {Number} seconds
	 * @returns {String}
	 */
	function secondsToString(seconds) {
		var secondsInt = parseInt(seconds);
		var minutes = Math.floor(secondsInt / 60);
		var leftoverSeconds = secondsInt % 60;
		if (leftoverSeconds < 10) {
			leftoverSeconds = '0' + leftoverSeconds;
		}
		return minutes + ':' + leftoverSeconds;
	};

	/*
	 * given two objects, will seek to overwrite first object with anything provided in the second object
	 * alternative to Object.assign() which doesn't work in IE apparently
	 * @private
	 * @param {Object} source - source object to be modified
	 * @param {Object} properties - object with updated values
	 * @returns {Object}
	 */
	function extendDefaults(source, properties) {
		for (property in properties) {
			if (properties.hasOwnProperty(property)) {
				source[property] = properties[property];
			}
		}
		return source;
	};

}());
