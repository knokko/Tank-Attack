import { requestImage, requestImageIDs, requestImageMetaData } from '../connection/sending/Image';
import UserImage, { createImage, MetaData } from '../image/UserImage';
import ProfileManager from '../storage/ConnectProfiles';

/**
 * This is the class of the image manager. It is not public because there should only be created 1 instance of it,
 * which happens in this file.
 */
class ImageManager {

    constructor(){
        this.imageMap = new Map();
        this.usersMap = new Map();
        this.userImageListenMap = new Map();
    }

    /**
     * Registers an image that this user just uploaded. This method directly puts the image and its metadata in the
     * image map of this ImageManager and thereby avoids fetching the data we already have from the server.
     * @param {number} imageID The id of the newly created image, as returned by the backend
     * @param {HTMLCanvasElement} imageCanvas The canvas containing the image data
     * @param {string} name The name of the image
     * @param {boolean} isPrivate Whether or not the image is private
     * @param {number} createdAt The time the image was created at, as returned by the backend
     */
    registerUploadedImage(imageID, imageCanvas, name, isPrivate, createdAt){
        const userImageState = new ResourceState(null, null);
        const userImage = new UserImage(imageCanvas, imageID);
        userImage.meta = new MetaData(name, isPrivate, true, createdAt, createdAt);
        userImageState.resource = userImage;
        userImageState.callbackPairs = null;
        this.addUserImageID(ProfileManager.getSelectedProfile().id, imageID);
    }

    /**
     * Notifies the image manager that a user has uploaded a new image. This method will make sure that all
     * listeners of the images of the user will get notified.
     * @param {number} ownerID The user id of the owner of the uploaded image
     * @param {number} newImageID The image id of the uploaded image
     */
    notifyImageUpload(ownerID, newImageID){
        if (this.shouldFollowUserImageIDs(ownerID)){
            this.addUserImageID(ownerID, newImageID);
        }
    }

    /**
     * Only for internal use in ImageManager!
     * @param {number} userID 
     * @param {number} newImageID 
     */
    addUserImageID(userID, newImageID){
        const imageIDs = this.usersMap.get(userID).resource;
        imageIDs.push(newImageID);
        this.userImageListenMap.get(userID).notifyListeners(imageIDs);
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
                createImage(imageID, pixelData, width, height, userImage => {
                    userImageState.setResource(userImage);
                });
            }, fallbackImageCanvas => {
                userImageState.setResource(new UserImage(fallbackImageCanvas, imageID));
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
     * Notifies the image manager that someone has changed the image with the given id. The image manager
     * will make sure that eventual image listeners will get notified of the change.
     * @param {number} imageID the image id of the changed image
     */
    notifyImageChange(imageID){
        const userImageState = this.imageMap.get(imageID);
        if (userImageState !== undefined){
            const userImage = userImageState.resource;
            if (userImage !== null){
                requestImage(imageID, (pixelData, width, height) => {
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    const imageData = new ImageData(width, height);
                    for (let index = 0; index < pixelData.length; index++){
                        imageData.data[index] = pixelData[index];
                    }
                    ctx.putImageData(imageData, width, height);
                    userImage.changeImage(canvas);
                });
            }
        }
    }

    /**
     * Notifies the image manager that the metadata of the image with the given id has changed.
     * The image manager will make sure that eventual listeners of the image metadata will be notified.
     * @param {number} imageID The image id of the image whose metadata changed
     */
    notifyImageMetaChange(imageID){
        const userImageState = this.imageMap.get(imageID);
        if (userImageState !== undefined){
            const userImage = userImageState.resource;
            if (userImage !== null){
                if (userImage.meta !== null){
                    requestImageMetaData(imageID, newMeta => {
                        userImage.changeMeta(newMeta);
                    });
                }
            }
        }
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
            this.userImageListenMap.set(userID, new ChangeListeners());
            requestImageIDs(userID, ids => {
                idsState.setResource(ids);
            });
        } else {
            idsState.addCallback(listener, callback);
        }
    }

    /**
     * Determines whether or not this client is interested in updates about the image ids of the user with
     * the given userID. If so, this client should ask for the new image ids whenever the server notifies
     * it that the image ids of the given user with the given userID have changed.
     * @param {number} userID The id of the user
     */
    shouldFollowUserImageIDs(userID){
        return this.userImageListenMap.has(userID);
    }

    updateUserImageIDs(userID, newImageIDs){
        this.userImageListenMap.get(userID).notifyListeners(newImageIDs);
    }

    listenUserImageIDs(userID, listener, onChange){
        this.userImageListenMap.get(userID).addListener(listener, onChange);
    }

    stopListenUserImageIDs(userID, listener){
        this.userImageListenMap.get(userID).removeListener(listener);
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

    constructor(firstListener, firstCallback){
        this.resource = null;
        this.callbackPairs = [new ListenerPair(firstListener, firstCallback)];
    }

    setResource(resource){
        this.resource = resource;
        for (let index = 0; index < this.callbackPairs.length; index++){
            this.callbackPairs[index].callback(resource);
        }
        this.callbackPairs = null;
    }

    addCallback(listener, callback){
        if (this.callbackPairs === null){
            callback(this.resource);
        } else {
            this.callbackPairs.push(new ListenerPair(listener, callback));
        }
    }

    removeCallback(listener){
        if (this.callbackPairs !== null){
            const callbacks = this.callbackPairs;
            let length = callbacks.length;
            for (let index = 0; index < length; index++){
                if (callbacks[index].listener === listener){
                    callbacks.splice(index, 1);
                    index--;
                    length--;
                }
            }
        }
    }
}

class ChangeListeners {

    constructor(){
        this.pairs = [];
    }

    notifyListeners(newValue){
        const pairs = this.pairs;
        const length = pairs.length;
        for (let index = 0; index < length; index++){
            pairs[index].callback(newValue);
        }
    }

    addListener(listener, onChange){
        console.log('pairs are', this.pairs);
        this.pairs.push(new ListenerPair(listener, onChange));
        console.log('pairs became', this.pairs);
    }

    removeListener(listener){
        const pairs = this.pairs;
        let length = pairs.length;
        console.log('pairs are now', pairs);
        console.log('length is', length);
        for (let index = 0; index < length; index++){
            console.log('index is ' + index + ' and length is ' + index);
            if (pairs[index].listener === listener){
                pairs.splice(index, 1);
                index--;
                length--;
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