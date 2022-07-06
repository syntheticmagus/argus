import { ArcRotateCamera, Camera, Color4, FreeCamera, MeshBuilder, PBRMaterial, serializeAsMeshReference, Tools, Vector3, VideoTexture } from "@babylonjs/core";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
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

        const plane = MeshBuilder.CreatePlane("ground", { width: 1, height: 1 }, scene);
        const planeMat = new PBRMaterial("groundMat", scene);
        planeMat.unlit = true;
        plane.material = planeMat;

        viewer.onMediaConnectionReceivedObservable.add((connection) => {
            connection.answer();
            connection.onStreamObservable.add((stream) => {
                VideoTexture.CreateFromStreamAsync(scene, stream, {}, false).then((texture) => {
                    planeMat.albedoTexture = texture;
                    
                    // TODO: Scale to fit rather than just fitting vertically.
                    plane.scaling.x = texture.getSize().width / texture.getSize().height;
                });
            });
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
