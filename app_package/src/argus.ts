import { Camera, Color4, FreeCamera, Mesh, MeshBuilder, PBRMaterial, Tools, Vector3, VideoTexture } from "@babylonjs/core";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { AdvancedDynamicTexture, Button } from "@babylonjs/gui";
import { Sensor } from "./sensor";
import { Viewer } from "./viewer";

function createSensorScene(canvas: HTMLCanvasElement, stream: MediaStream) {
    const engine = new Engine(canvas);
    
    engine.runRenderLoop(() => {
        engine.scenes.forEach((scene) => {
            scene.render();
        });
    });
    window.addEventListener("resize", () => {
        engine.resize();
    });

    {
        const scene = new Scene(engine);

        scene.clearColor = new Color4(0, 0, 0, 1);

        const plane = MeshBuilder.CreatePlane("ground", { width: 1, height: 1 }, scene);
        const planeMat = new PBRMaterial("groundMat", scene);
        planeMat.unlit = true;
        plane.material = planeMat;

        
        VideoTexture.CreateFromStreamAsync(scene, stream, {}, false).then((texture) => {
            planeMat.albedoTexture = texture;
            
            // TODO: Scale to fit rather than just fitting vertically.
            plane.scaling.x = texture.getSize().width / texture.getSize().height;
        });

        const camera = new FreeCamera("camera", Vector3.Backward(), scene);
        camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
        const setCameraSize = () => {
            camera.orthoTop = 0.5;
            camera.orthoBottom = -0.5;
            camera.orthoLeft = -0.5 * engine.getRenderWidth() / engine.getRenderHeight();
            camera.orthoRight = 0.5 * engine.getRenderWidth() / engine.getRenderHeight();
        };
        setCameraSize();
        engine.onResizeObservable.add(() => {
            setCameraSize();
        });
    }
}

function createViewerScene(canvas: HTMLCanvasElement, viewer: Viewer) {
    const engine = new Engine(canvas);
    
    engine.runRenderLoop(() => {
        engine.scenes.forEach((scene) => {
            scene.render();
        });
    });
    window.addEventListener("resize", () => {
        engine.resize();
    });

    {
        const scene = new Scene(engine);

        scene.clearColor = new Color4(0, 0, 0, 1);

        const names = new Array<string>();
        const nameToPlane = new Map<string, Mesh>();

        const guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("gui", undefined, scene);

        const button = Button.CreateSimpleButton("button", "Next");
        button.verticalAlignment = Button.VERTICAL_ALIGNMENT_BOTTOM;
        button.onPointerClickObservable.add(() => {
            if (names.length == 0) {
                return;
            }

            nameToPlane.get(names[0])!.setEnabled(false);
            names.push(names[0]);
            names.splice(0, 1);
            nameToPlane.get(names[0])!.setEnabled(true);
        });
        button.widthInPixels = 100;
        button.heightInPixels = 60;
        button.paddingBottomInPixels = 20;
        button.background = "white";
        button.isEnabled = false;

        guiTexture.addControl(button);

        viewer.onSensorConnectedObservable.add((sensor) => {
            const plane = MeshBuilder.CreatePlane("ground", { width: 1, height: 1 }, scene);
            const planeMat = new PBRMaterial("groundMat", scene);
            planeMat.unlit = true;
            plane.material = planeMat;

            const handleStream = (stream: MediaStream) => {
                VideoTexture.CreateFromStreamAsync(scene, stream, {}, false).then((texture) => {
                    planeMat.albedoTexture = texture;
                    
                    // TODO: Scale to fit rather than just fitting vertically.
                    plane.scaling.x = texture.getSize().width / texture.getSize().height;
                });
            };
            if (sensor.mediaConnection.remoteStream) {
                handleStream(sensor.mediaConnection.remoteStream);
            } else {
                sensor.mediaConnection.onStreamObservable.addOnce(handleStream);
            }

            let wasEnabled = false;
            if (nameToPlane.has(sensor.name)) {
                const priorPlane = nameToPlane.get(sensor.name)!;
                wasEnabled = priorPlane.isEnabled();
                (priorPlane.material as PBRMaterial).albedoTexture?.dispose();
                priorPlane.dispose();
            } else {
                names.push(sensor.name);
                if (names.length > 1) {
                    button.isEnabled = true;
                }
            }
            nameToPlane.set(sensor.name, plane);
            plane.setEnabled(wasEnabled || nameToPlane.size === 1);
        });

        const camera = new FreeCamera("camera", Vector3.Backward(), scene);
        camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
        let zoomFactor = 1;
        const setCameraSize = () => {
            camera.orthoTop = zoomFactor * 0.5;
            camera.orthoBottom = zoomFactor * -0.5;
            camera.orthoLeft = zoomFactor * -0.5 * engine.getRenderWidth() / engine.getRenderHeight();
            camera.orthoRight = zoomFactor * 0.5 * engine.getRenderWidth() / engine.getRenderHeight();
        };
        setCameraSize();
        engine.onResizeObservable.add(() => {
            setCameraSize();
        });
    }
}

export interface SensorExperienceParams {
    canvas: HTMLCanvasElement,
    site: string,
    name: string,
    password: string,
    liveServiceUrl: string
}

export async function initializeSensorExperienceAsync(params: SensorExperienceParams) {
    const sensor = await Sensor.CreateAsync(params.site, params.name, params.password, params.liveServiceUrl);
    createSensorScene(params.canvas, sensor.stream);
}

export interface ViewerExperienceParams {
    canvas: HTMLCanvasElement,
    site: string,
    password: string,
    liveServiceUrl: string
}

export async function initializeViewerExperienceAsync(params: ViewerExperienceParams) {
    const viewer = await Viewer.CreateAsync(params.site, params. password, params.liveServiceUrl);
    createViewerScene(params.canvas, viewer);
}
