import React, { Component, Fragment } from 'react';
import ImageManager from '../../../../manage/image/ImageManager';
import ProfileManager from '../../../../manage/storage/ConnectProfiles';
import UserImageComponent from '../../../component/image/UserImage';
import { Route } from 'react-router-dom';
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
                if (this.state.selectedImage !== null && !newImageIDs.includes(this.state.selectedImage.getID())) {
                    this.setState({ imageIDs: newImageIDs, selectedImage: null });
                } else {
                    this.setState({ imageIDs: newImageIDs });
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
       this.props.history.push(this.props.match.url + "/create");
    }

    render() {
        return (<Fragment>
            <Route path={this.props.path} exact render={() => {
                return (<Fragment>
                    <div className="Images-Collection">
                        {this.renderImages()}
                    </div>
                    <div className="Images-Right-Bar">
                        {this.renderSelected()}
                        <button className="Images-New-Button" onClick={this.toCreateImageMenu}>Upload image</button>
                    </div>
                </Fragment>);
            }} />
            <Route path={this.props.match.path + "/create"} render={props => <CreateImageMenu {...props} collectionMenu={this.props.collectionMenu} />} />
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
                        x={7 + 15 * (index % 5)}
                        y={5 + 20 * Math.floor(index / 5)}
                        maxWidth={13}
                        maxHeight={18}
                        imageID={imageID}
                        key={index}
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