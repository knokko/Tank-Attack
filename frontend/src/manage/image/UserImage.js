import { requestImageMetaData } from '../connection/sending/Image';
import deletedImageURL from '../../show/images/deleted.png';
import ioErrorImageURL from '../../show/images/io_error.png';
import privateImageURL from '../../show/images/private.png';

/**
 * Represents a user-created image. Please do not access the properties of instances of this call directly, but only call its methods.
 */
export default class UserImage {

    /**
     * Creates a new UserImage instance from the given Image and time. You should probably not call this constructor
     * directly, but use ImageManager.getUserImage(imageID) instead.
     * @param {HTMLCanvasElement} image The image
     */
    constructor(image, id){
        this.image = image;
        this.id = id;
        this.meta = null;
        this.changeListeners = [];
        this.metaChangeListeners = [];
    }

    /**
     * Changes the image of this UserImage and notifies all change listeners.
     * This method should only be called from the ImageManager.
     * @param {HTMLCanvasElement} newImage The new image of this UserImage
     */
    changeImage(newImage){
        this.image = newImage;
        for (let index = 0; index < this.changeListeners.length; index++){
            this.changeListeners[index].callback(this);
        }
    }

    /**
     * Changes the metadata of this UserImage and notifies all change listeners.
     * This method should only be called from the ImageManager.
     * @param {MetaData} newMeta The new metadata of this image
     */
    changeMeta(newMeta){
        this.meta = newMeta;
        for (let index = 0; index < this.metaChangeListeners.length; index++){
            this.metaChangeListeners[index].callback(this, newMeta);
        }
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

    addChangeListener(listener, onChange){
        this.changeListeners.push(new ChangeListener(listener, onChange));
    }

    removeChangeListener(listener){
        for (let index = 0; index < this.changeListeners.length; index++){
            if (this.changeListeners[index].listener === listener){
                this.changeListeners.splice(index, 1);
                index--;
            }
        }
    }

    addMetaChangeListener(listener, onChange){
        this.metaChangeListeners.push(new ChangeListener(listener, onChange));
    }

    removeMetaChangeListener(listener){
        for (let index = 0; index < this.metaChangeListeners.length; index++){
            if (this.metaChangeListeners[index].listener === listener){
                this.metaChangeListeners.splice(index, 1);
                index--;
            }
        }
    }

    getWidth(){
        return this.image.width;
    }

    getHeight(){
        return this.image.height;
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
            requestImageMetaData(this.id, meta => {
                this.meta = meta;
                callback(meta);
            });
        } else {
            callback(this.meta);
        }
    }
}

/**
 * Creates a new UserImage from the given pixel data and calls onReady once it is ready.
 * This function should only be called from ImageManager.getUserImage().
 * @param {Uint8Array} pixelData A Uint8(Clamped)Array containing the pixel data in RGBA order.
 * @param {number} width The width of the image
 * @param {number} height The height of the image
 * @param {Function} onReady The function to be called when the (user)image is ready. It should have a single parameter of type UserImage
 */
export function createImage(pixelData, width, height, onReady){
    if (4 * width * height !== pixelData.length){
        throw new Error('pixelDataLength is ' + pixelData.length + ', but width is ' + width + ' and height is ' + height);
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(width, height);
    imageData.data.set(pixelData);
    ctx.putImageData(imageData, 0, 0);
    const userImage = new UserImage(canvas);
    onReady(userImage);
}

/**
 * Represents the metadata of an UserImage. It contains a name, isPrivate, lastModified and createdAt. These 4 properties
 * can be accessed directly. However, the isVisible() method should be called before attempting to access any of them. If that
 * returns false, the metadata is not available and the values of the 4 properties are not defined.
 * 
 * Instances of MetaData should only be created in the requestImageMetaData function.
 */
export class MetaData {

    /**
     * Constructs a new MetaData instance. This constructor should only be called from the requestImageMetaData function!
     * @param {string} name 
     * @param {boolean} isPrivate
     * @param {boolean} exists 
     * @param {number} lastModified 
     * @param {number} createdAt 
     */
    constructor(name, isPrivate, exists, lastModified, createdAt){
        this.name = name;
        this.isPrivate = isPrivate;
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

class ChangeListener {

    constructor(listener, callback){
        this.listener = listener;
        this.callback = callback;
    }
}

function loadFallbackImage(canvas, url){
    const image = new Image();
    image.onload = () => {
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
    };
    image.src = url;
}

const DeletedImageCanvas = document.createElement('canvas');
const IOErrorImageCanvas = document.createElement('canvas');
const PrivateImageCanvas = document.createElement('canvas');

loadFallbackImage(DeletedImageCanvas, deletedImageURL);
loadFallbackImage(IOErrorImageCanvas, ioErrorImageURL);
loadFallbackImage(PrivateImageCanvas, privateImageURL);

export { DeletedImageCanvas, IOErrorImageCanvas, PrivateImageCanvas}