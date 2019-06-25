import CODE_IMAGE from '../protocol/CtS';
import { 
    CODE_IMAGE_GET_PIXELS, 
    CODE_IMAGE_BITCOUNT, 
    CODE_IMAGE_GET_META ,
    CODE_IMAGE_IDS
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
import { createOutput } from '../Manager';
import { MetaData } from '../../image/UserImage';

export function requestImage(imageID, onSuccess, onFail){
    const output = createOutput(CODE_IMAGE, input => {
        const responseCode = input.readNumber(GET_PIXELS_BIT_COUNT, false);
        if (responseCode === GET_PIXELS_SUCCESS){
            const width = input.readByte() & 0xFF + 1;
            const height = input.readByte() & 0xFF + 1;
            const length = 4 * width * height;
            const pixels = new Uint8Array(length);
            for (let index = 0; index < length; index++){
                pixels[index] = input.readByte() & 0xFF;
            }
            onSuccess(pixels);
        } else if (responseCode === GET_PIXELS_IO_ERROR){
            // TODO maybe inform player?
            onFail();
        } else if (responseCode === GET_PIXELS_UNAUTHORIZED){
            // TODO maybe inform player?
            onFail();
        } else if (responseCode === GET_PIXELS_NO_IMAGE){
            // TODO maybe inform player?
            onFail();
        } else {
            throw 'Unexpected getPixels response code: ' + responseCode;
        }
    });
    output.writeNumber(CODE_IMAGE_GET_PIXELS, CODE_IMAGE_BITCOUNT, false);
    output.writeVarUint(imageID);
    output.terminate();
}

export function requestImageMetaData(imageID, callback){
    const output = createOutput(CODE_IMAGE, input => {
        const responseCode = input.readNumber(GET_META_BITCOUNT, false);
        if (responseCode === GET_META_SUCCESS){
            const private = input.readBoolean();
            const name = input.readString();
            const createdAt = input.readVarUint();
            const lastModified = input.readVarUint();
            callback(new MetaData(name, private, true, lastModified, createdAt));
        } else if (responseCode === GET_META_UNAUTHORIZED){
            callback(new MetaData(null, true, true, 0, 0));
        } else if (responseCode === GET_META_NO_IMAGE){
            callback(new MetaData(null, false, false, 0, 0));
        } else {
            throw 'Unknown getImageMeta response code: ' + responseCode;
        }
    });
    output.writeNumber(CODE_IMAGE_GET_META, CODE_IMAGE_BITCOUNT, false);
    output.writeVarUint(imageID);
    output.terminate();
}

export function requestImageIDs(userID, callback){
    const output = createOutput(CODE_IMAGE, input => {
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
            throw 'Unknown ImageIds response code: ' + responseCode;
        }
    });
    output.writeNumber(CODE_IMAGE_IDS, CODE_IMAGE_BITCOUNT, false);
    output.writeVarUint(userID);
    output.terminate();
}