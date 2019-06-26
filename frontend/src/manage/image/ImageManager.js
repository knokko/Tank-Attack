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
     * @param {Function} onLoad The function to be called once the UserImage has been loaded. It should take a
     * single parameter of type UserImage.
     */
    getUserImage(imageID, onLoad){
        let userImageState = this.imageMap.get(imageID);
        if (userImageState === undefined){
            userImageState = new ResourceState(onLoad);
            this.imageMap.set(imageID, userImageState);
            requestImage(imageID, (pixelData, width, height) => {
                createImage(pixelData, width, height, userImage => {
                    userImageState.setResource(userImage);
                });
            }, fallbackImage => {
                userImageState.setResource(fallbackImage);
            });
        } else {
            userImageState.addCallback(onLoad);
        }
    }

    /**
     * Gets or loads all ids of images owned by the user with the given userID. Note that this method doesn't
     * return anything despite the name, it only calls the callback function once the image ids have been
     * obtained.
     * @param {number} userID The id of the user to get the image ids of
     * @param {Function} callback The function to be called when the image ids have been obtained. It should
     * take a single parameter that is an array of numbers
     */
    getImageIDS(userID, callback){
        let idsState = this.usersMap.get(userID);
        if (idsState === undefined){
            idsState = new ResourceState(callback);
            this.usersMap.set(userID, idsState);
            requestImageIDs(userID, ids => {
                idsState.setResource(ids);
            });
        } else {
            idsState.addCallback(callback);
        }
    }
}

/**
 * The ImageManager instance. It is responsible for storing and fetching all user-created images.
 * The methods of this instance should be called to obtain images.
 */
const Instance = new ImageManager();

export default Instance;

class ResourceState {

    constructor(firstCallback){
        this.resource = null;
        this.callbacks = [firstCallback];
    }

    setResource(resource){
        this.resource = resource;
        for (let index = 0; index < this.callbacks.length; index++){
            this.callbacks[index](resource);
        }
        this.callbacks = null;
    }

    addCallback(callback){
        if (this.callbacks === null){
            callback(this.resource);
        } else {
            this.callbacks.push(callback);
        }
    }
}