import { requestImage, requestImageIDs } from '../connection/sending/Image';
import UserImage, { createImage } from '../image/UserImage';

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
        let userImage = this.imageMap.get(imageID);
        if (userImage === undefined){
            requestImage(imageID, (pixelData, width, height) => {
                createImage(pixelData, width, height, userImage => {
                    this.imageMap.set(imageID, userImage);
                    onLoad(userImage);
                });
            }, fallbackImage => {
                userImage = new UserImage(fallbackImage);
                this.imageMap.set(imageID, userImage);
                onLoad(userImage);
            });
        } else {
            onLoad(userImage);
        }
    }

    getImageIDS(userID, callback){
        let ids = this.usersMap.get(userID);
        if (ids === undefined){
            requestImageIDs(userID, ids => {
                this.usersMap.set(userID, ids);
                callback(ids);
            });
        } else {
            callback(ids);
        }
    }
}

/**
 * The ImageManager instance. It is responsible for storing and fetching all user-created images.
 * The methods of this instance should be called to obtain images.
 */
const Instance = new ImageManager();

export default Instance;