import { Observable, Observer } from "@babylonjs/core/Misc/observable";
import { Tools } from "@babylonjs/core/Misc/tools";
import { Nullable } from "@babylonjs/core/types";
import { hash } from "bcryptjs";
import { AsyncMediaConnection, AsyncPeer } from "./asyncPeer";

export class Viewer {
    private _disposed: boolean;
    private readonly _peer: AsyncPeer;
    private readonly _site: string;
    private readonly _passwordHash: string;
    private readonly _liveServiceUrl: string;
    private readonly _idToSensor: Map<string, AsyncMediaConnection>;

    private static readonly NEW_SENSORS_HEARTBEAT_INTERVAL: number = 10 * 1000;

    public onMediaConnectionEstablishedObservable: Observable<AsyncMediaConnection>;
    public onMediaConnectionClosedObservable: Observable<AsyncMediaConnection>;

    private constructor (site: string, passwordHash: string, peer: AsyncPeer, liveServiceUrl: string) {
        this._disposed = false;

        this._peer = peer;
        this._site = site;
        this._passwordHash = passwordHash;
        this._liveServiceUrl = liveServiceUrl;

        this._idToSensor = new Map<string, AsyncMediaConnection>;

        this.onMediaConnectionEstablishedObservable = new Observable<AsyncMediaConnection>();
        this.onMediaConnectionClosedObservable = new Observable<AsyncMediaConnection>();
        
        this._connectToSensorsAsync();
    }

    private async _connectToSensorsAsync(): Promise<void> {
        while (!this._disposed) {
            const response = await fetch(`${this._liveServiceUrl}/viewer/${this._site}`, {
                method: "GET"
            });
            const message = await response.json() as IServiceToViewerMessage;

            message.peerIds.forEach((id) => {
                if (!this._idToSensor.has(id)) {
                    this._connectToSensorAsync(id);
                }
            });

            await Tools.DelayAsync(Viewer.NEW_SENSORS_HEARTBEAT_INTERVAL);
        }
    }

    private async _connectToSensorAsync(id: string): Promise<void> {
        const dataConnection = await this._peer.createDataConnectionAsync(id);

        let mediaConnectionObserver: Nullable<Observer<AsyncMediaConnection>>;
        let dataTerminationObserver: Nullable<Observer<void>>;
        return new Promise<void>((resolve, reject) => {
            mediaConnectionObserver = this._peer.onMediaConnectionObservable.add((mediaConnection) => {
                if (mediaConnection.peerId === id) {
                    this._peer.onMediaConnectionObservable.remove(mediaConnectionObserver);
                    dataConnection.onTerminatedObservable.remove(dataTerminationObserver);

                    this._idToSensor.set(id, mediaConnection);
    
                    mediaConnection.onTerminatedObservable.add(() => {
                        this._idToSensor.delete(id);
                        this.onMediaConnectionClosedObservable.notifyObservers(mediaConnection);
                    });
    
                    this.onMediaConnectionEstablishedObservable.notifyObservers(mediaConnection);

                    resolve();
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
    }

    public dispose(): void {
        this._disposed = true;
        this._peer.dispose();
    }

    public static async CreateAsync(site: string, password: string, liveServiceUrl: string): Promise<Viewer> {
        const passwordHash = await hash(password, 8);
        const peer = await AsyncPeer.CreateAsync();
        return new Viewer(site, password, peer, liveServiceUrl);
    }
}
