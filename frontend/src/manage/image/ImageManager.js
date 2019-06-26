import { requestImage, requestImageIDs } from '../connection/sending/Image';
import { createImage } from '../image/UserImage';

/**
 * This is the class of the image manager. It is not public because there should only be created 1 instance of it,
 * which happens in this file.
 */
class ImageManager {

    constructor(){
        this.imageMap = new Map();
        this.usersMap = new Map();
    }

    /**
     * Gets or loads the UserImage with the given imageID. Once the image is ready, onLoad will be called.
     * Notice: despite the name, this method doesn't return anything! It only calls the onLoad callback once
     * the image is loaded.
     * If the image is already in the image map of this ImageManager, this method will call onLoad immediathly.
     * If not, a request will be sent to the server to obtain the image data and the onLoad will be called once
     * the image data has been fetched and the image has been loaded.
     * @param {number} imageID The image id of the UserImage to load
     * @param {Object} listener The entity that is requesting the user image. It is only used for the
     * cancelGetUserImage method to determine which callbacks need to be removed.
     * @param {Function} onLoad The function to be called once the UserImage has been loaded. It should take a
     * single parameter of type UserImage.
     */
    getUserImage(imageID, listener, onLoad){
        let userImageState = this.imageMap.get(imageID);
        if (userImageState === undefined){
            userImageState = new ResourceState(listener, onLoad);
            this.imageMap.set(imageID, userImageState);
            requestImage(imageID, (pixelData, width, height) => {
                createImage(pixelData, width, height, userImage => {
                    userImageState.setResource(userImage);
                });
            }, fallbackImage => {
                userImageState.setResource(fallbackImage);
            });
        } else {
            userImageState.addCallback(listener, onLoad);
        }
    }

    /**
     * Cancels a request to get the user image with the specified imageID. It will not prevent
     * the backend from processing the request, but it will prevent the callback from being called.
     * @param {number} imageID The id of the user image that was requested
     * @param {Object} listener The entity that requested the user image, must be the same
     * as the one used for getUserImage.
     */
    cancelGetUserImage(imageID, listener){
        const userImageState = this.imageMap.get(imageID);
        userImageState.removeCallback(listener);
    }

    /**
     * Gets or loads all ids of images owned by the user with the given userID. Note that this method doesn't
     * return anything despite the name, it only calls the callback function once the image ids have been
     * obtained.
     * @param {number} userID The id of the user to get the image ids of
     * @param {Object} listener The entity that is requesting the image ids. It is only used for the
     * cancelGetImageIDs method to determine which callbacks need to be removed.
     * @param {Function} callback The function to be called when the image ids have been obtained. It should
     * take a single parameter that is an array of numbers
     */
    getImageIDS(userID, listener, callback){
        let idsState = this.usersMap.get(userID);
        if (idsState === undefined){
            idsState = new ResourceState(listener, callback);
            this.usersMap.set(userID, idsState);
            requestImageIDs(userID, ids => {
                idsState.setResource(ids);
            });
        } else {
            idsState.addCallback(listener, callback);
        }
    }

    /**
     * Cancels the request to obtain the image ids of a certain user. It will not stop the request from being
     * processed by the backend, but it will prevent the callback from being called.
     * @param {number} userID The id of the user the image ids were requested for
     * @param {Object} listener The entity that requested the image ids, must be the same
     * as the one used for getImageIDs.
     */
    cancelGetImageIDs(userID, listener){
        const idsState = this.usersMap.get(userID);
        idsState.removeCallback(listener);
    }
}

/**
 * The ImageManager instance. It is responsible for storing and fetching all user-created images.
 * The methods of this instance should be called to obtain images.
 */
const Instance = new ImageManager();

export default Instance;

class ResourceState {

    constructor(firstListener, firstsCallback){
        this.resource = null;
        this.callbackPairs = [new ListenerPair(firstListener, firstCallback)];
    }

    setResource(resource){
        this.resource = resource;
        for (let index = 0; index < this.callbacks.length; index++){
            this.callbacks[index].callback(resource);
        }
        this.callbacks = null;
    }

    addCallback(listener, callback){
        if (this.callbacks === null){
            callback(this.resource);
        } else {
            this.callbacks.push(new ListenerPair(listener, callback));
        }
    }

    removeCallback(listener){
        if (this.callbacks !== null){
            const callbacks = this.callbacks;
            const length = callbacks.length;
            for (let index = 0; index < length; index++){
                if (callbacks[index].listener === listener){
                    callbacks.splice(index, 1);
                    index--;
                }
            }
        }
    }
}

class ListenerPair {

    constructor(listener, callback){
        this.listener = listener;
        this.callback = callback;
    }
}