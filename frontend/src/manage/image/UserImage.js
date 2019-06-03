const bufferCanvas = document.createElement('canvas');

export default class UserImage {

    /**
     * Creates a new UserImage instance from the given Image and time. You should probably not call this constructor
     * directly, but use ImageManager.getUserImage(imageID) instead.
     * @param {Image} image The image
     * @param {number} lastModified The time the image was last modified, as the number of milliseconds since the epoch
     */
    constructor(image, lastModified){
        this.image = image;
        this.lastModified = lastModified;
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
}

/**
 * Creates a new UserImage with given pixel data and calls the callback once it is ready.
 * @param {Uint8Array} pixelData A Uint8(Clamped)Array containing the pixel data in RGBA order.
 * @param {number} width The width of the image
 * @param {number} height The height of the image
 * @param {number} lastModified The last time the image was modified (or created), given in number of milliseconds since epoch
 * @param {Function} callback The function to be called when the image is ready. It should have a single parameter of type UserImage
 */
export function createImage(pixelData, width, height, lastModified, callback){
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
    image.onload = _ => {
        const userImage = new UserImage(image, lastModified);
        callback(userImage);
    };
    image.src = bufferCanvas.toDataURL();
}