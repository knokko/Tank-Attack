import { requestImageMetaData } from '../connection/sending/Image';

const bufferCanvas = document.createElement('canvas');

/**
 * Represents a user-created image. Please do not access the properties of instances of this call directly, but only call its methods.
 */
export default class UserImage {

    /**
     * Creates a new UserImage instance from the given Image and time. You should probably not call this constructor
     * directly, but use ImageManager.getUserImage(imageID) instead.
     * @param {Image} image The image
     */
    constructor(image, id){
        this.image = image;
        this.id = id;
        this.meta = null;
    }

    /**
     * Draws this UserImage onto the given canvas. It will be scaled to fit if necessary. The canvas is the only required
     * parameter. If the other parameters are not given, this image will be drawn onto the entire canvas.
     * @param {HTMLCanvasElement} canvas The canvas to draw the image on
     * @param {number} offsetX 
     * @param {number} offsetY 
     * @param {number} width 
     * @param {number} height 
     */
    draw(canvas, offsetX = 0, offsetY = 0, width = canvas.width, height = canvas.height){
        const ctx = canvas.getContext('2d');
        ctx.drawImage(this.image, offsetX, offsetY, width, height);
    }

    /**
     * Gets the numerical unique id of this UserImage.
     */
    getID(){
        return this.id;
    }

    /**
     * Gets or retrieves the metadata of this UserImage from the server and calls the callback function once it is available. 
     * If the metadata is already in memory, the callback function will be called immediathly.
     * If not, a request will be sent to the server to obtain it and the callback function will be called once the response
     * is received.
     * The isVisible method of the metadata can be used to check if the metadata was obtained successfully. Make sure to call
     * it before trying to read the values from the metadata.
     * @param {Function} callback The function to call once the metadata of this image has been obtained.
     * It should take a single parameter of type MetaData.
     */
    getMetaData(callback){
        if (this.meta === null){
            requestImageMetaData(this.id, callback);
        } else {
            callback(meta);
        }
    }
}

/**
 * Creates a new UserImage from the given pixel data and calls onReady once it is ready.
 * This function should only be called from ImageManager.getUserImage().
 * @param {Uint8Array} pixelData A Uint8(Clamped)Array containing the pixel data in RGBA order.
 * @param {number} width The width of the image
 * @param {number} height The height of the image
 * @param {Function} onReady The function to be called when the image is ready. It should have a single parameter of type UserImage
 * @return {UserImage} The UserImage that was created. It may or may not be loaded when this function returns!
 */
export function createImage(pixelData, width, height, onReady){
    if (4 * width * height !== pixelData.length){
        throw 'pixelDataLength is ' + pixelData.length + ', but width is ' + width + ' and height is ' + height;
    }
    if (width !== bufferCanvas.width || height !== bufferCanvas.height){
        bufferCanvas.width = width;
        bufferCanvas.height = height;
    }
    const imageData = bufferCanvas.createImageData(width, height);
    const imageDataBuffer = imageData.data;
    const length = pixelData.length;
    for (let index = 0; index < length; index++){
        imageDataBuffer[index] = pixelData[index];
    }
    bufferCanvas.putImageData(imageData, 0, 0);
    const image = new Image(width, height);
    const userImage = new UserImage(image);
    image.onload = _ => {
        userImage.isLoading = false;
        onReady();
    };
    image.src = bufferCanvas.toDataURL();
    return userImage;
}

/**
 * Represents the metadata of an UserImage. It contains a name, private flag, lastModified and createdAt. These 4 properties
 * can be accessed directly. However, the isVisible() method should be called before attempting to access any of them. If that
 * returns false, the metadata is not available and the values of the 4 properties are not defined.
 * 
 * Instances of MetaData should only be created in the requestImageMetaData function.
 */
export class MetaData {

    /**
     * Constructs a new MetaData instance. This constructor should only be called from the requestImageMetaData function!
     * @param {string} name 
     * @param {boolean} private 
     * @param {boolean} exists 
     * @param {number} lastModified 
     * @param {number} createdAt 
     */
    constructor(name, private, exists, lastModified, createdAt){
        this.name = name;
        this.private = private;
        this.exists = exists;
        this.lastModified = lastModified;
        this.createdAt = createdAt;
    }

    /**
     * Checks if this metadata is visible by this user, false if this image has been removed or if it is private and
     * this user doesn't have privileges to see it.
     */
    isVisible(){
        return this.name !== null;
    }
}