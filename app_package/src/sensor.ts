import { Tools } from "@babylonjs/core/Misc/tools";
import { compare } from "bcryptjs";
import { AsyncDataConnection, AsyncPeer } from "./asyncPeer";

export class Sensor {
    private _disposed: boolean;
    private readonly _peer: AsyncPeer;
    private readonly _site: string;
    private readonly _name: string;
    private readonly _password: string;
    private readonly _stream: MediaStream;
    private readonly _liveServiceUrl: string;

    private static readonly REGISTER_HEARTBEAT_INTERVAL: number = 30 * 1000;

    private constructor (site: string, name: string, password: string, peer: AsyncPeer, stream: MediaStream, liveServiceUrl: string) {
        this._disposed = false;
        this._peer = peer;
        this._site = site;
        this._name = name;
        this._password = password;
        this._stream = stream;
        this._liveServiceUrl = liveServiceUrl;

        this._peer.onDataConnectionObservable.add((connection) => {
            this._handleDataConnection(connection);
        });

        this._registerWithLiveServiceAsync();
    }

    private async _registerWithLiveServiceAsync(): Promise<void> {
        while (!this._disposed) {
            const message: ISensorToServiceMessage = {
                peerId: this._peer.id
            };

            await fetch(`${this._liveServiceUrl}/sensor/${this._site}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(message)
            });

            await Tools.DelayAsync(Sensor.REGISTER_HEARTBEAT_INTERVAL);
        }
    }

    private _handleDataConnection(connection: AsyncDataConnection) {
        connection.onDataObservable.add((data) => {
            const message = JSON.parse(data) as IViewerToSensorMessage;

            compare(this._password, message.passwordHash).then((match: boolean) => {
                if (match) {
                    const response: ISensorToViewerMessage = {
                        name: this._name
                    };
                    connection.send(JSON.stringify(response));
                    this._peer.createMediaConnection(connection.peerId, this._stream);
                } else {
                    connection.dispose();
                }
            });
        });
    }

    private dispose(): void {
        this._disposed = true;
        this._peer.dispose();
        this._stream.getTracks().forEach((track) => {
            track.stop();
        });
    }

    public static async CreateAsync(site: string, name: string, password: string, liveServiceUrl: string): Promise<Sensor> {
        const videoStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
        const peer = await AsyncPeer.CreateAsync();
        return new Sensor(site, name, password, peer, videoStream, liveServiceUrl);
    }
}
