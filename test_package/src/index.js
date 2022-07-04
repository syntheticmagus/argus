import { initializeBabylonApp } from "app_package";

/**
 * Site flow:
 * 
 * Upon arrival, present three options:
 * - If local storage contains a most recent choice, offer to repeat it
 * - Join a camera swarm
 * - View a camera swarm
 * 
 * If you join a swarm, go into camera mode.
 * - Prepare to receive P2P calls.
 * - Begin sending regular updates to live service.
 * - Stay awake, use WakeLock API.
 * - Render black to canvas.
 * 
 * If you view a swarm, go into viewer mode.
 * - Contact the live service for peer IDs.
 * - Contact all peers and get a video stream, then disable it.
 * - Enable only the streams that are being viewed in the viewer experience.
 * - Render the viewer experience to canvas.
 */

document.body.style.width = "100%";
document.body.style.height = "100%";
document.body.style.margin = "0";
document.body.style.padding = "0";

const title = document.createElement("p");
title.innerText = "Babylon.js NPM Package Template";
title.style.fontSize = "32pt";
title.style.textAlign = "center";
document.body.appendChild(title);

const div = document.createElement("div");
div.style.width = "60%";
div.style.margin = "0 auto";
div.style.aspectRatio = "16 / 9";
document.body.appendChild(div);

const canvas = document.createElement("canvas");
canvas.id = "renderCanvas";
canvas.style.width = "100%";
canvas.style.height = "100%";
canvas.style.display = "block";
div.appendChild(canvas);

let assetsHostUrl;
if (DEV_BUILD) {
    assetsHostUrl = "http://127.0.0.1:8181/";
} else {
    assetsHostUrl = "https://nonlocal-assets-host-url/";
}
initializeBabylonApp({ canvas: canvas, assetsHostUrl: assetsHostUrl });
