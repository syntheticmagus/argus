import { MeshBuilder, PBRMaterial, Tools, VideoTexture } from "@babylonjs/core";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { hash } from "bcryptjs";
import { Sensor } from "./sensor";
import { Viewer } from "./viewer";

class Playground {
    public static CreateScene(engine: Engine, canvas: HTMLCanvasElement): Scene {
        var scene = new Scene(engine);

        const cube = MeshBuilder.CreateBox("cube", { size: 1 }, scene);
        cube.position.y = 1;
        MeshBuilder.CreateGround("ground", { width: 6, height: 6, subdivisions: 2 }, scene);

        scene.createDefaultCameraOrLight(true, true, true);

        scene.onBeforeRenderObservable.runCoroutineAsync(function *() {
            while (true) {
                cube.rotation.x += 0.017;
                cube.rotation.y += 0.013;
                cube.rotation.z += 0.011;
                yield;
            }
        }());

        return scene;
    }
}

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

        const ground = MeshBuilder.CreateGround("ground", { width: 1, height: 1, subdivisions: 2 }, scene);
        const groundMat = new PBRMaterial("groundMat", scene);
        groundMat.unlit = true;
        ground.material = groundMat;
        VideoTexture.CreateFromStreamAsync(scene, stream, {}).then((texture) => {
            groundMat.albedoTexture = texture;
        });

        scene.createDefaultCameraOrLight(true, true, true);
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

        const ground = MeshBuilder.CreateGround("ground", { width: 1, height: 1, subdivisions: 2 }, scene);
        const groundMat = new PBRMaterial("groundMat", scene);
        groundMat.unlit = true;
        ground.material = groundMat;

        viewer.onMediaConnectionReceivedObservable.add((connection) => {
            connection.answer();
            connection.onStreamObservable.add((stream) => {
                VideoTexture.CreateFromStreamAsync(scene, stream, {}).then((texture) => {
                    groundMat.albedoTexture = texture;
                });
            });
        });

        scene.createDefaultCameraOrLight(true, true, true);
    }
}

export interface InitializeBabylonAppOptions {
    canvas: HTMLCanvasElement;
    assetsHostUrl?: string;
}

export function initializeBabylonApp(options: InitializeBabylonAppOptions) {
    if (options.assetsHostUrl) {
        console.log("Assets host URL: " + options.assetsHostUrl!);
    } else {
        console.log("No assets host URL provided");
    }

    const canvas = options.canvas;
    const engine = new Engine(canvas);
    const scene = Playground.CreateScene(engine, canvas);
    engine.runRenderLoop(() => {
        scene.render();
    });
    window.addEventListener("resize", () => {
        engine.resize();
    });
}

//https://stackoverflow.com/questions/29320201/error-installing-bcrypt-with-npm
export async function hashPasswordAsync(site: string, password: string): Promise<string> {
    const SALT_ROUNDS = 8;
    return await hash(site + password, SALT_ROUNDS);
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
