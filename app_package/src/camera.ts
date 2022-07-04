import { AsyncDataConnection, AsyncPeer } from "./asyncPeer";

async function compare(password: string, hash: string) {
    return password === hash;
}

export class Camera {
    private readonly _peer: AsyncPeer;
    private readonly _site: string;
    private readonly _name: string;
    private readonly _password: string;
    private readonly _stream: MediaStream;

    private constructor (site: string, name: string, password: string, peer: AsyncPeer, stream: MediaStream) {
        this._peer = peer;
        this._site = site;
        this._name = name;
        this._password = password;
        this._stream = stream;

        this._peer.onDataConnectionObservable.add((connection) => {
            this._handleDataConnection(connection);
        });
    }

    private _handleDataConnection(connection: AsyncDataConnection) {
        connection.onDataObservable.add((data) => {
            const message = JSON.parse(data) as IViewerToCameraMessage;

            compare(`${this._site}${this._password}`, message.passwordHash).then((match: boolean) => {
                if (match) {
                    const response: ICameraToViewerMessage = {
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

    public static async CreateAsync(site: string, name: string, passwordHash: string): Promise<Camera> {
        const videoStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
        const peer = await AsyncPeer.CreateAsync();
        return new Camera(site, name, passwordHash, peer, videoStream);
    }
}
