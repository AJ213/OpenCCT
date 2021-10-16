import brain from 'brain.js';
// Code by Noahkra https://github.com/noahkra

let latestCallback, latestFramelog, net, training = [], times = [];
let handleScreenshot = (screenshot, desired) => {
	if (analyseFrame(screenshot) === desired) {
		return true;
	}
	return false;
}

async function analyseVideo(expectedSplits = 1000, multiplier = 10) {
	let p1 = performance.now();
	times = [];
	let ended = video.ended;
	while (!ended && times.length < expectedSplits) {
		await measure(multiplier);
		if (times.length < expectedSplits) {
			await toNextGameplay(multiplier);
		}
		ended = video.ended;
	}
	video.playbackRate = 1;
	let p2 = performance.now();
	console.log(times);
	return `Total time: ${Math.round(times.reduce((a,b) => a + (b[1] - b[0]), 0) * 1000)/1000} (took ${Math.round((p2 - p1)) / 1000}s)`;
}
async function measure(multiplier = 10) {
	video.playbackRate = multiplier;
	let timeIn = await getVideoTime(video);
	let timeOut = await startLoop("levelcomplete");

	timeOut = await measureExact(timeOut, "levelcomplete");
	return times.push([timeIn, timeOut]);
}
async function toNextGameplay(multiplier = 10) {
	video.playbackRate = multiplier;
	let time = await startLoop("gameplay");
	await measureExact(time, "gameplay");

	return;
}
async function measureExact(time, desired) {
	video.playbackRate = 1;
	video.currentTime = time - 0.2;

	return await startLoop(desired);
}

function startLoop(desired) {
	return new Promise((resolve, reject) => {
		let loop = () => {
			latestCallback = video.requestVideoFrameCallback((now, metadata) => {
				let result = handleScreenshot(videoScreenshot(video), desired);
				if (result) {
					video.pause();
					video.cancelVideoFrameCallback(latestCallback);
					return resolve(metadata.mediaTime);
				}
				loop();
			});
		}
		
		loop();
		video.play()
	});
}
function videoScreenshot() {
	let c = document.createElement('canvas');
	let cc = c.getContext('2d', {alpha: false});
	c.width = 2;
	c.height = 2;
	cc.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, c.width, c.height);

	return [...cc.getImageData(0, 0, c.width, c.height).data].filter((v,i) => (i+1) % 4).map(x => x / 255);
}
function analyseFrame(screenshot) {
	let result = net.run(screenshot);
	if (result.gameplay > result.levelcomplete) {
		return "gameplay";
	}
	return "levelcomplete";
}
async function vGoto(time) {
	video.currentTime = time + 0.001;
	return await getVideoTime();
}
function startFrameLog() {
	latestFramelog = video.requestVideoFrameCallback((now, metadata) => {
		console.log("Time", Math.round(metadata.mediaTime * 1000)/1000);
		startFrameLog();
	});
}
function stopFrameLog() {
	video.cancelVideoFrameCallback(latestFramelog);
}
function getVideoTime() {
	return new Promise((resolve, reject) => {
		window.video.currentTime += 0.000_001; video.requestVideoFrameCallback((a,b) => resolve(b.mediaTime)); video.currentTime -= 0.000_001;
	});
}
function trainGameplay() {
	net.fromJSON(net.toJSON());
	training.push({input: videoScreenshot(video), output: { gameplay: 1, levelcomplete: 0 }});
	return net.train(training);
}
function trainLevelcomplete() {
	net.fromJSON(net.toJSON());
	training.push({input: videoScreenshot(video), output: { gameplay: 0, levelcomplete: 1 }});
	return net.train(training);
}
function initTrainGameplay() {
	training.push({input: videoScreenshot(video), output: { gameplay: 1, levelcomplete: 0 }});
	return net.train(training);
}
function testNet() {
	return net.run(videoScreenshot(video));
}
function exp() {
	return JSON.stringify([net.toJSON(), training]);
}
function load(stringified) {
	[netJSON, trainingArr] = JSON.parse(stringified);
	net.fromJSON(netJSON);
	training = trainingArr;
}
s.onload = () => net = new brain.NeuralNetwork();