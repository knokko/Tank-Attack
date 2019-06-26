import React, { Component, Fragment } from 'react';
import ImageManager from '../../../../manage/image/ImageManager';
import ProfileManager from '../../../../manage/storage/ConnectProfiles';
import UserImageComponent from '../../../component/image/UserImage';
import './Images.css';

export default class ImageMenu extends Component {

    constructor(props){
        super(props);
        this.state = {
            images: null,
            selectedImage: null
        };
    }

    showOnReady(callback){
        ImageManager.getImageIDS(ProfileManager.getSelectedProfile().id, imageIDs => {
            if (imageIDs === null){
                this.state = {images: null, selectedImage: null};
                callback(this);
            } else {
                const length = imageIDs.length;
                const imageComponents = new Array(length);
                for (let index = 0; index < length; index++){
                    imageComponents[index] = new UserImageComponent({
                        x: (10 + 15 * (index % 5)) + 'vw',
                        y: (10 + 15 * Math.floor(index / 5)) + 'vh',
                        width: '10',
                        height: '10',
                        userImage: null
                    });
                    const keepIndex = index;
                    ImageManager.getUserImage(imageIDs[index], userImage => {
                        imageComponents[keepIndex].setUserImage(userImage);
                    });
                }
                this.state = {images: imageComponents, selectedImage: null};
                callback(this);
            }
        });
    }

    render(){
        return (<Fragment>
            <div className="Images-Collection">
               { this.renderImages() }
            </div>
            <div className="Images-Right-Bar">
                { this.renderSelected() }
                <button className="Images-New-Button">New image</button>
            </div>
        </Fragment>);
    }

    renderImages(){
        const images = this.state.images;
        const length = images.length;
        if (length === 0){
            return "You don't have any images yet.";
        } else {
            const result = new Array(length);
            for (let index = 0; index < length; index++){
                result[index] = images[index].render();
            }
            return result;
        }
    }

    renderSelected(){
        if (this.state.selectedImage !== null){
            return <Fragment>
                Hm...
            </Fragment>
        } else {
            return null;
        }
    }
}