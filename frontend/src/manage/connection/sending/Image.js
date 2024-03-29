import { CODE_IMAGE } from '../protocol/CtS';
import { 
    CODE_IMAGE_GET_PIXELS, 
    CODE_IMAGE_GET_META ,
    CODE_IMAGE_IDS,
    CODE_IMAGE_UPLOAD,
    CODE_IMAGE_CHANGE_META,
    CODE_IMAGE_CHANGE_PIXELS,
    CODE_IMAGE_BITCOUNT
} from '../protocol/cts/Image';
import { 
    GET_PIXELS_SUCCESS, 
    GET_PIXELS_IO_ERROR, 
    GET_PIXELS_UNAUTHORIZED, 
    GET_PIXELS_NO_IMAGE,
    GET_PIXELS_BIT_COUNT
 } from '../protocol/stc/image/GetPixels';
import {
    GET_META_SUCCESS,
    GET_META_UNAUTHORIZED,
    GET_META_NO_IMAGE,
    GET_META_BITCOUNT
} from '../protocol/stc/image/GetMeta';
import {
    IDS_SUCCESS,
    IDS_NO_ACCOUNT,
    IDS_BITCOUNT
} from '../protocol/stc/image/Ids';
import {
    UPLOAD_SUCCESS,
    UPLOAD_IO_ERROR,
    UPLOAD_LONG_NAME,
    UPLOAD_MANY_TOTAL,
    UPLOAD_MANY_YOU,
    UPLOAD_BITCOUNT
} from '../protocol/stc/image/Upload';
import {
    CHANGE_META_SUCCESS,
    CHANGE_META_UNAUTHORIZED,
    CHANGE_META_NO_IMAGE,
    CHANGE_META_BITCOUNT
} from '../protocol/stc/image/ChangeMeta';
import { 
    CHANGE_PIXELS_SUCCESS,
    CHANGE_PIXELS_IO_ERROR,
    CHANGE_PIXELS_UNAUTHORIZED,
    CHANGE_PIXELS_NO_IMAGE,
    CHANGE_PIXELS_CODE_BITS
} from '../protocol/stc/image/ChangePixels';
import ConnectionManager from '../Manager';
import ImageManager from '../../image/ImageManager';
import { MetaData, DeletedImageCanvas, IOErrorImageCanvas, PrivateImageCanvas } from '../../image/UserImage';

export function requestImage(imageID, onSuccess, onFail){
    const output = ConnectionManager.createOutput(CODE_IMAGE, input => {
        const responseCode = input.readNumber(GET_PIXELS_BIT_COUNT, false);
        if (responseCode === GET_PIXELS_SUCCESS){
            const width = (input.readByte() & 0xFF) + 1;
            const height = (input.readByte() & 0xFF) + 1;
            const length = 4 * width * height;
            const pixels = new Uint8Array(length);
            for (let index = 0; index < length; index++){
                pixels[index] = input.readByte() & 0xFF;
            }
            onSuccess(pixels, width, height);
        } else if (responseCode === GET_PIXELS_IO_ERROR){
            onFail(IOErrorImageCanvas);
        } else if (responseCode === GET_PIXELS_UNAUTHORIZED){
            onFail(PrivateImageCanvas);
        } else if (responseCode === GET_PIXELS_NO_IMAGE){
            onFail(DeletedImageCanvas);
        } else {
            throw new Error('Unexpected getPixels response code: ' + responseCode);
        }
    });
    output.writeNumber(CODE_IMAGE_GET_PIXELS, CODE_IMAGE_BITCOUNT, false);
    output.writeVarUint(imageID);
    output.terminate();
}

export function requestImageMetaData(imageID, callback){
    const output = ConnectionManager.createOutput(CODE_IMAGE, input => {
        const responseCode = input.readNumber(GET_META_BITCOUNT, false);
        if (responseCode === GET_META_SUCCESS){
            const isPrivate = input.readBoolean();
            const name = input.readString();
            const createdAt = input.readVarUint();
            const lastModified = input.readVarUint();
            callback(new MetaData(name, isPrivate, true, lastModified, createdAt));
        } else if (responseCode === GET_META_UNAUTHORIZED){
            callback(new MetaData(null, true, true, 0, 0));
        } else if (responseCode === GET_META_NO_IMAGE){
            callback(new MetaData(null, false, false, 0, 0));
        } else {
            throw new Error('Unknown getImageMeta response code: ' + responseCode);
        }
    });
    output.writeNumber(CODE_IMAGE_GET_META, CODE_IMAGE_BITCOUNT, false);
    output.writeVarUint(imageID);
    output.terminate();
}

export function requestImageIDs(userID, callback){
    const output = ConnectionManager.createOutput(CODE_IMAGE, input => {
        const responseCode = input.readNumber(IDS_BITCOUNT, false);
        if (responseCode === IDS_SUCCESS){
            const amount = input.readVarUint();
            const ids = new Array(amount);
            for (let index = 0; index < amount; index++){
                ids[index] = input.readVarUint();
            }
            callback(ids);
        } else if (responseCode === IDS_NO_ACCOUNT){
            callback(null);
        } else {
            throw new Error('Unknown ImageIds response code: ' + responseCode);
        }
    });
    output.writeNumber(CODE_IMAGE_IDS, CODE_IMAGE_BITCOUNT, false);
    output.writeVarUint(userID);
    output.terminate();
}

function toSignedByte(unsigned){
    if (unsigned > 127){
        return unsigned - 256;
    } else {
        return unsigned;
    }
}

/**
 * Attempts to upload an image to the backend. If it succeeds, the image will also be registered to the
 * ImageManager.
 * @param {HTMLCanvasElement} canvas The canvas containing the image data
 * @param {string} name The name of the image to upload
 * @param {boolean} isPrivate Whether or not the image should be private
 * @param {Function} onSuccess The function to be called once the upload succeeded. It should
 * have a single parameter that will be the id of the uploaded image.
 * @param {Function} onFail  The function to be called when the upload fails. It should have
 * a single parameter that will be a string describing the error message.
 */
export function uploadImage(canvas, name, isPrivate, onSuccess, onFail){
    const output = ConnectionManager.createOutput(CODE_IMAGE, input => {
        const responseCode = input.readNumber(UPLOAD_BITCOUNT, false);
        if (responseCode === UPLOAD_SUCCESS){
            const imageID = input.readVarUint();
            const createdAt = input.readVarUint();
            ImageManager.registerUploadedImage(imageID, canvas, name, isPrivate, createdAt);
            onSuccess(imageID);
        } else if (responseCode === UPLOAD_IO_ERROR){
            onFail("The server couldn't save your image.");
        } else if (responseCode === UPLOAD_LONG_NAME){
            onFail("The name of your image is too long.");
        } else if (responseCode === UPLOAD_MANY_TOTAL){
            onFail("The maximum number of images has been reached.");
        } else if (responseCode === UPLOAD_MANY_YOU){
            onFail("You reached the maximum number of images for your account.")
        } else {
            onFail("Unknown response code");
        }
    });
    output.writeNumber(CODE_IMAGE_UPLOAD, CODE_IMAGE_BITCOUNT);
    output.writeBoolean(isPrivate);
    output.writeString(name);
    output.writeByte(toSignedByte(canvas.width - 1));
    output.writeByte(toSignedByte(canvas.height - 1));
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const rgbaData = imageData.data;
    const length = rgbaData.length;
    for (let index = 0; index < length; index++){
        output.writeByte(toSignedByte(rgbaData[index]));
    }
    output.terminate();
}

/**
 * Requests the server to change the metadata of the image with the given imageID.
 * @param {number} imageID The id of the image whose meta should be changed
 * @param {string} newName The (new) name of the image
 * @param {boolean} newPrivate The (new) private flag of the image
 * @param {Function} onSuccess The function to be called when the request succeeds. It should not
 * take any parameters.
 * @param {Function} onFail The function to be called when the request fails. It should take a
 * single parameter of type string that will be the reason that the request failed.
 */
export function changeImageMeta(imageID, newName, newPrivate, onSuccess, onFail){
    const output = ConnectionManager.createOutput(CODE_IMAGE, input => {
        const responseCode = input.readNumber(CHANGE_META_BITCOUNT, false);
        if (responseCode === CHANGE_META_SUCCESS){
            onSuccess();
        } else if (responseCode === CHANGE_META_UNAUTHORIZED){
            onFail('You are not allowed to change this image');
        } else if (responseCode === CHANGE_META_NO_IMAGE){
            onFail("The image you are trying to edit doesn't exist (anymore)");
        } else {
            onFail('The server is acting weird');
        }
    });
    output.writeNumber(CODE_IMAGE_CHANGE_META, CODE_IMAGE_BITCOUNT);
    output.writeVarUint(imageID);
    output.writeBoolean(newPrivate);
    output.writeString(newName);
    output.terminate();
}

/**
 * Requests the server to change the pixel data of the image with the given id.
 * @param {number} imageID The id of the image to change
 * @param {HtmlCanvasElement} canvas A canvas containing the new pixels of the image to change
 * @param {Function} onSuccess The function to be called when the request succeeds. It should
 * take a single parameter of type number that will be the new value of lastModified of the image.
 * @param {Function} onFail The function to be called when the request fails. It should take a
 * single parameter of type string that will be the reason the request failed.
 */
export function changeImagePixels(imageID, canvas, onSuccess, onFail){
    const output = ConnectionManager.createOutput(CODE_IMAGE, input => {
        const responseCode = input.readNumber(CHANGE_PIXELS_CODE_BITS, false);
        if (responseCode === CHANGE_PIXELS_SUCCESS){
            onSuccess(input.readVarUint());
        } else if (responseCode === CHANGE_PIXELS_IO_ERROR){
            onFail('The server is having IO trouble');
        } else if (responseCode === CHANGE_PIXELS_UNAUTHORIZED){
            onFail('You are not allowed to change this image');
        } else if (responseCode === CHANGE_PIXELS_NO_IMAGE){
            onFail("The image you are trying to change doesn't exist (anymore)");
        } else {
            onFail('This should not be possible');
        }
    });
    output.writeNumber(CODE_IMAGE_CHANGE_PIXELS, CODE_IMAGE_BITCOUNT);
    output.writeVarUint(imageID);
    output.writeByte(toSignedByte(canvas.width - 1));
    output.writeByte(toSignedByte(canvas.height - 1));
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const rgbaData = imageData.data;
    const length = rgbaData.length;
    for (let index = 0; index < length; index++){
        output.writeByte(toSignedByte(rgbaData[index]));
    }
    output.terminate();
}