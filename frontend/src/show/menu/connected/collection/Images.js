import React, { Component, Fragment } from 'react';
import ImageManager from '../../../../manage/image/ImageManager';
import ProfileManager from '../../../../manage/storage/ConnectProfiles';
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
                this.setState({images: null, selectedImage: null});
                callback(this);
            } else {
                // TODO Create an image rendering component that updates once the images are loaded
            }
        });
    }

    render(){
        return (<Fragment>
            <div className="Images-Collection">
                Hm... nu nog de images
            </div>
            <div className="Images-Right-Bar">
                { this.renderSelected() }
                <button className="Images-New-Button">New image</button>
            </div>
        </Fragment>);
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