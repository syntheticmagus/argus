import { initializeBabylonApp, initializeSensorExperienceAsync, initializeViewerExperienceAsync } from "app_package";

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

const canvas = document.createElement("canvas");
canvas.id = "renderCanvas";
canvas.style.width = "100%";
canvas.style.height = "100%";
canvas.style.display = "none";
canvas.style.position = "fixed";
document.body.appendChild(canvas);

const inputSection = document.createElement("div");
inputSection.style.textAlign = "center";

inputSection.appendChild(document.createElement("hr"));
document.body.appendChild(inputSection);
{
    const sensorHeader = document.createElement("h1");
    sensorHeader.textContent = "Sensor";
    inputSection.appendChild(sensorHeader);

    const siteLabel = document.createElement("label");
    siteLabel.textContent = "Site: ";
    inputSection.appendChild(siteLabel);
    const siteInput = document.createElement("input");
    siteInput.setAttribute("type", "text");
    inputSection.appendChild(siteInput);
    inputSection.appendChild(document.createElement("br"));
    inputSection.appendChild(document.createElement("br"));

    const nameLabel = document.createElement("label");
    nameLabel.textContent = "Name: ";
    inputSection.appendChild(nameLabel);
    const nameInput = document.createElement("input");
    nameInput.setAttribute("type", "text");
    inputSection.appendChild(nameInput);
    inputSection.appendChild(document.createElement("br"));
    inputSection.appendChild(document.createElement("br"));

    const passwordLabel = document.createElement("label");
    passwordLabel.textContent = "Password: ";
    inputSection.appendChild(passwordLabel);
    const passwordInput = document.createElement("input");
    passwordInput.setAttribute("type", "text");
    inputSection.appendChild(passwordInput);
    inputSection.appendChild(document.createElement("br"));
    inputSection.appendChild(document.createElement("br"));

    const submitButton = document.createElement("button");
    submitButton.onclick = () => {
        initializeSensorExperienceAsync({
            canvas: canvas,
            site: siteInput.value,
            name: nameInput.value,
            password: passwordInput.value,
            liveServiceUrl: "https://argus-registry.herokuapp.com"
        });

        inputSection.style.display = "none";
        canvas.style.display = "block";
    };
    submitButton.innerHTML = "Submit";
    inputSection.appendChild(submitButton);
}
inputSection.appendChild(document.createElement("hr"));
{
    const viewerHeader = document.createElement("h1");
    viewerHeader.textContent = "Viewer";
    inputSection.appendChild(viewerHeader);

    const siteLabel = document.createElement("label");
    siteLabel.textContent = "Site: ";
    inputSection.appendChild(siteLabel);
    const siteInput = document.createElement("input");
    siteInput.setAttribute("type", "text");
    inputSection.appendChild(siteInput);
    inputSection.appendChild(document.createElement("br"));
    inputSection.appendChild(document.createElement("br"));

    const passwordLabel = document.createElement("label");
    passwordLabel.textContent = "Password: ";
    inputSection.appendChild(passwordLabel);
    const passwordInput = document.createElement("input");
    passwordInput.setAttribute("type", "text");
    inputSection.appendChild(passwordInput);
    inputSection.appendChild(document.createElement("br"));
    inputSection.appendChild(document.createElement("br"));
    const submitButton = document.createElement("button");

    submitButton.onclick = () => {
        initializeViewerExperienceAsync({
            canvas: canvas,
            site: siteInput.value,
            password: passwordInput.value,
            liveServiceUrl: "https://argus-registry.herokuapp.com"
        });

        inputSection.style.display = "none";
        canvas.style.display = "block";
    };
    submitButton.innerHTML = "Submit";
    inputSection.appendChild(submitButton);
}
inputSection.appendChild(document.createElement("hr"));
