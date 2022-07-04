/*
 * Messaging protocol:
 * - viewer creates data connection to camera
 * - viewer sends password hash to camera
 * - camera checks password hash against password
 * - if camera accepts password
 * -   camera tells viewer its name
 * -   camera opens media connection to viewer
 * -   viewer closes data connection
 * - else if camera rejects password
 *     camera closes data connection
 */

interface IViewerToCameraMessage {
    passwordHash: string;
}

interface ICameraToViewerMessage {
    name: string
}