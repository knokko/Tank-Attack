import React, { Component, Fragment } from 'react';
import ImageManager from '../../../../manage/image/ImageManager';
import ProfileManager from '../../../../manage/storage/ConnectProfiles';
import UserImageComponent from '../../../component/image/UserImage';
import CreateImageMenu from './images/Create';
import './Images.css';

export default class ImageMenu extends Component {

    constructor(props) {
        super(props);
        this.state = {
            imageIDs: null,
            selectedImage: null
        };

        this.userID = ProfileManager.getSelectedProfile().id;

        this.toCreateImageMenu = this.toCreateImageMenu.bind(this);
    }

    componentDidMount() {
        ImageManager.getImageIDS(this.userID, this, imageIDs => {
            this.setState({ imageIDs: imageIDs, selectedImage: null });
            ImageManager.listenUserImageIDs(this.userID, this, newImageIDs => {
                if (this.state.selectedImage !== null && !newImageIDs.includes(this.state.selectedImage.getID())){
                    this.setState({ imageIDs: newImageIDs, selectedImage: null});
                } else {
                    this.setState({ imageIDs: newImageIDs});
                }
            })
        });
    }

    componentWillUnmount() {
        if (this.state.imageIDs === null) {
            ImageManager.cancelGetImageIDs(ProfileManager.getSelectedProfile().id, this);
        } else {
            ImageManager.stopListenUserImageIDs(this.userID, this);
        }
    }

    toCreateImageMenu() {
        const collectionMenu = this.props.collectionMenu;
        collectionMenu.setBodyComponent(<CreateImageMenu collectionMenu={collectionMenu} />);
    }

    render() {
        return (<Fragment>
            <div className="Images-Collection">
                {this.renderImages()}
            </div>
            <div className="Images-Right-Bar">
                {this.renderSelected()}
                <button className="Images-New-Button" onClick={this.toCreateImageMenu}>Upload image</button>
            </div>
        </Fragment>);
    }

    renderImages() {
        const imageIDs = this.state.imageIDs;
        if (imageIDs !== null) {
            const length = imageIDs.length;
            if (length === 0) {
                return "You don't have any images yet.";
            } else {
                const result = new Array(length);
                for (let index = 0; index < length; index++) {
                    const imageID = imageIDs[index];
                    result[index] = <UserImageComponent
                        x={(10 + 15 * (index % 5)) + 'vw'}
                        y={(10 + 15 * Math.floor(index / 5)) + 'vh'}
                        width="10vw"
                        height="10vh"
                        imageID={imageID}
                        onClick={userImage => {
                            this.setState({ selectedImage: userImage });
                        }}
                    />;
                }
                return result;
            }
        } else {
            return "Loading images...";
        }
    }

    renderSelected() {
        if (this.state.selectedImage !== null) {
            return <Fragment>
                You selected the image with id {this.state.selectedImage.getID()}
            </Fragment>
        } else {
            return "No image selected";
        }
    }
}