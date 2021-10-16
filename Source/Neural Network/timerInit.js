init();

let video;
let markIn = 0;
let markOut = 0;

async function init() {
	video = await getVideoElement();

	video.pause();

	appendMaterial().then(createTimerWindow);
}

function getVideoElement() {
	return new Promise((resolve, reject) => {
		(function waitForVideo() {
			let video = document.querySelector("video");
			if (video) { return resolve(video); }
			setTimeout(waitForVideo, 10);
		})();
	});
}

function mark(callback) {
	video.currentTime += 0.001;
	video.requestVideoFrameCallback((now, metadata) => callback(metadata.mediaTime));
	video.currentTime -= 0.001;
}

function appendMaterial() {
	let icons = document.createElement('link');
	icons.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
	icons.rel = "stylesheet";

	let css = document.createElement('link');
	css.href = "https://unpkg.com/material-components-web@latest/dist/material-components-web.min.css";
	css.rel = "stylesheet";

	let font = document.createElement('link');
	font.href = "https://fonts.googleapis.com/css?family=Roboto:300,400,500";
	font.rel = "stylesheet";

	//let js = document.createElement('script');
	//js.src = "https://unpkg.com/material-components-web@latest/dist/material-components-web.min.js";

	document.head.append(icons, css);

	return Promise.all([
		new Promise((resolve, reject) => {
			icons.onload = resolve;
		}),
		new Promise((resolve, reject) => {
			css.onload = resolve;
		})
	]);
}

function createButton({ label: _label, icon: _icon }, onclick) {
	let button, label, icon, ripple;

	button = document.createElement("button");
	button.className = "mdc-button mdc-button--raised mdc-typography";

	Object.assign(button.style, {
		transition: "height 0.2s",
		zIndex: 9001,
		fontSize: window.location.hostname === "www.twitch.tv" ? "12.4px" : "13px"
	});

	if (_label) {
		label = document.createElement("span");
		label.className  = "mdc-button__label";
		label.innerText = _label;
	}

	if (_icon) {
		icon = document.createElement("span");
		icon.className = "material-icons " + (_label ? "mdc-button__icon" : "mdc-fab__icon");
		icon.innerText  = _icon;
	}

	ripple = document.createElement("span");
	ripple.className = "mdc-button__ripple";

	//mdc.ripple.MDCRipple.attachTo(button);

	button.append(ripple, icon || "", label || "");

	button.onclick = onclick;

	return button;
}

function createTimeLabel({ label: _label, icon: _icon }) {
	let timeLabel = document.createElement('span'),
		label = document.createElement('span'),
		time = document.createElement('span');

	if (_label) {
		label.innerText = _label;
	}

	if (_icon) {
		label.innerText = _icon;
		label.className = "material-icons";
		label.style.transform = "scale(0.85) translate(0px, -3px)";
	}

	label.style.paddingRight = "4px";

	timeLabel.style.display = "flex";

	time.innerText = "-.---";

	timeLabel.append(label, time);

	return timeLabel;
}

function updateTimeLabelTime(timeLabel, time) {
	timeLabel.children[1].innerText = Math.round(time * 1000) / 1000 + "s";
}

function assignAll(objects, assignable) {
	objects.forEach(obj => Object.assign(obj, assignable));
}

function createTimerWindow() {
	let timerWindow = document.createElement('div');
	let timerHeader = document.createElement('div');

	timerWindow.className = "mdc-card";

	let ButtonMarkIn  = createButton({label: "MARK IN"}, () => {
		mark(time => {
			window.markIn = time;
			ButtonMarkIn.children[1].innerText = "Marked!";
			setTimeout(() => ButtonMarkOut.children[1].innerText = "Mark Out", 1000);
			updateTimeLabelTime(markInLabel, time);
			if (window.markIn && window.markOut) {
				updateTimeLabelTime(timeResultLabel, window.markOut - window.markIn);
			}
		});
	});

	let ButtonMarkOut = createButton({label: "MARK OUT"}, () => {
		mark(time => {
			window.markOut = time;
			ButtonMarkOut.children[1].innerText = "Marked!";
			setTimeout(() => ButtonMarkOut.children[1].innerText = "Mark Out", 1000);
			updateTimeLabelTime(markOutLabel, time);
			if (window.markIn && window.markOut) {
				updateTimeLabelTime(timeResultLabel, window.markOut - window.markIn);
			}
		});
	});

	let frameBck = createButton({icon: "skip_previous"}, () => video.currentTime -= (1/60));
	let frameFwd = createButton({icon: "skip_next"}, () => video.currentTime += (1/60));

	let timeResultWrapper = document.createElement('div');
	timeResultWrapper.className = "mdc-typography--headline6";

	let markInLabel = createTimeLabel({ label: "MARK IN: " });
	let markOutLabel = createTimeLabel({ label: "MARK OUT: " });
	let timeResultLabel = createTimeLabel({ icon: "alarm" });

	timeResultWrapper.append(markInLabel, markOutLabel, timeResultLabel);

	timerWindow.append(timerHeader, ButtonMarkIn, ButtonMarkOut, frameBck, frameFwd, timeResultWrapper);

	assignAll([ButtonMarkIn.style, ButtonMarkOut.style, frameFwd.style, frameBck.style], {
		top: "-37px",
		transition: "top 0.2s",
		margin: "4px 0 0 4px"
	});

	Object.assign(timerWindow.style, {
		zIndex: 9000,
		position: "absolute",
		width: "347px",
		height: "61px",
		backgroundColor: "#303030",
		transition: "height 0.2s, opacity 0.2s, transform 0.2s",
		overflow: "hidden",
		display: "block",
		opacity: "0"
	});

	Object.assign(timerHeader.style, {
		zIndex: 9002,
		position: "absolute",
		width: "100%",
		height: "20px",
		backgroundColor: "#444444",
		cursor: "grab"
	});

	Object.assign(timeResultWrapper.style, {
		top: "30px",
		width: "100%",
		position: "absolute",
		fontSize: "12px",
		color: "white",
		transition: "top 0.2s",
		display: "flex",
		justifyContent: "space-evenly"
	});

	document.documentElement.style.setProperty("--mdc-theme-primary", "#008080");

	timerWindow.onmouseover = () => {
		timerWindow.style.height = "104px";
		ButtonMarkIn.style.top
			= ButtonMarkOut.style.top
			= frameFwd.style.top
			= frameBck.style.top
			= "20px";
		timeResultWrapper.style.top = "73px";
	}

	timerWindow.onmouseout = () => {
		timerWindow.style.height = "61px";
		ButtonMarkIn.style.top
			= ButtonMarkOut.style.top
			= frameFwd.style.top
			= frameBck.style.top
			= "-37px";
		timeResultWrapper.style.top = "30px";
	}

	timerHeader.onmousedown = e => {
		e.preventDefault();

		timerHeader.style.cursor = "grabbing";

		document.onmousemove = e => {
			e.preventDefault();

			Object.assign(timerWindow.style, {
				top: (timerWindow.offsetTop + e.movementY) + "px",
				left: (timerWindow.offsetLeft + e.movementX) + "px"
			});
		};

		document.onmouseup = () => {
			e.preventDefault();

			timerHeader.style.cursor = "grab";

			document.onmouseup = document.onmousemove = null;

			chrome.storage.sync.set({ position: { top: timerWindow.offsetTop + 10, left: timerWindow.offsetLeft }});
		};
	}

	document.body.append(timerWindow);

	chrome.storage.sync.get(['position'], data => {
		if (data.position) {
			Object.assign(timerWindow.style, {
				top: (data.position.top - 10) + "px",
				left: data.position.left + "px"
			});
		} else {
			Object.assign(timerWindow.style, {
				top: "10px",
				left: "10px"
			});
		}

		timerWindow.style.opacity = "1";
		timerWindow.style.transform = "translate(0, 10px)";
	});
}