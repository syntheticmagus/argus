import { Observable, Observer } from "@babylonjs/core/Misc/observable";
import { Tools } from "@babylonjs/core/Misc/tools";
import { Nullable } from "@babylonjs/core/types";
import { hash } from "bcryptjs";
import { AsyncDataConnection, AsyncMediaConnection, AsyncPeer } from "./asyncPeer";

export interface ISensorConnection {
    name: string;
    dataConnection: AsyncDataConnection;
    mediaConnection: AsyncMediaConnection;
}

export class Viewer {
    private _disposed: boolean;
    private readonly _peer: AsyncPeer;
    private readonly _site: string;
    private readonly _passwordHash: string;
    private readonly _liveServiceUrl: string;
    private readonly _idToSensor: Map<string, ISensorConnection>;

    private static readonly NEW_SENSORS_HEARTBEAT_INTERVAL: number = 20 * 1000;

    public onSensorConnectedObservable: Observable<ISensorConnection>;
    public onSensorDisconnectedObservable: Observable<ISensorConnection>;

    private constructor (site: string, passwordHash: string, peer: AsyncPeer, liveServiceUrl: string) {
        this._disposed = false;

        this._peer = peer;
        this._site = site;
        this._passwordHash = passwordHash;
        this._liveServiceUrl = liveServiceUrl;

        this._idToSensor = new Map<string, ISensorConnection>;

        this.onSensorConnectedObservable = new Observable<ISensorConnection>();
        this.onSensorDisconnectedObservable = new Observable<ISensorConnection>();
        
        this._connectToSensorsAsync();
    }

    private async _connectToSensorsAsync(): Promise<void> {
        while (!this._disposed) {
            const viewerToServiceMessage: IViewerToServiceMessage = {
                site: this._site
            };
            const response = await fetch(`${this._liveServiceUrl}/viewer`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(viewerToServiceMessage)
            });
            const serviceToViewerMessage = await response.json() as IServiceToViewerMessage;

            serviceToViewerMessage.peerIds.forEach((id) => {
                if (!this._idToSensor.has(id)) {
                    this._connectToSensorAsync(id);
                }
            });

            await Tools.DelayAsync(Viewer.NEW_SENSORS_HEARTBEAT_INTERVAL);
        }
    }

    private async _connectToSensorAsync(id: string): Promise<ISensorConnection> {
        const dataConnection = await this._peer.createDataConnectionAsync(id);

        const namePromise = new Promise<string>((resolve) => {
            dataConnection.onDataObservable.addOnce((data) => {
                const message: ISensorToViewerMessage = JSON.parse(data);
                resolve(message.name);
            });
        });

        let mediaConnectionObserver: Nullable<Observer<AsyncMediaConnection>>;
        let dataTerminationObserver: Nullable<Observer<void>>;
        const mediaConnectionPromise = new Promise<AsyncMediaConnection>((resolve, reject) => {
            mediaConnectionObserver = this._peer.onMediaConnectionObservable.add((mediaConnection) => {
                if (mediaConnection.peerId === id) {
                    this._peer.onMediaConnectionObservable.remove(mediaConnectionObserver);
                    dataConnection.onTerminatedObservable.remove(dataTerminationObserver);
    
                    mediaConnection.onTerminatedObservable.add(() => {
                        this.onSensorDisconnectedObservable.notifyObservers(this._idToSensor.get(id)!);
                        this._idToSensor.delete(id);
                    });

                    mediaConnection.answer();

                    resolve(mediaConnection);
                }
            });

            dataTerminationObserver = dataConnection.onTerminatedObservable.add(() => {
                this._peer.onMediaConnectionObservable.remove(mediaConnectionObserver);
                dataConnection.onTerminatedObservable.remove(dataTerminationObserver);
                reject();
            });
    
            const message: IViewerToSensorMessage = {
                passwordHash: this._passwordHash
            };
            dataConnection.send(JSON.stringify(message));
        });

        const name = await namePromise;
        const mediaConnection = await mediaConnectionPromise;

        const sensor = {
            name: name,
            dataConnection: dataConnection,
            mediaConnection: mediaConnection
        };
        this._idToSensor.set(id, sensor);
        this.onSensorConnectedObservable.notifyObservers(sensor);
        return sensor;
    }

    public dispose(): void {
        this._disposed = true;
        this._peer.dispose();
    }

    public static async CreateAsync(site: string, password: string, liveServiceUrl: string): Promise<Viewer> {
        const passwordHash = await hash(password, 8);
        const peer = await AsyncPeer.CreateAsync();
        return new Viewer(site, passwordHash, peer, liveServiceUrl);
    }
}
