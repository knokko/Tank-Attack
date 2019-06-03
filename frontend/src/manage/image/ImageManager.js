class ImageManager {

    constructor(){
        this.imageMap = new Map();
    }

    getUserImage(imageID, callback){
        const userImage = this.imageMap.get(imageID);
        if (userImage === undefined){
            // Ask the server for the image and put it in the map
        } else {
            // Compare the lastModified field of the user image with the last modified of the server.
        }
    }
}

const Instance = new ImageManager();

export default Instance;