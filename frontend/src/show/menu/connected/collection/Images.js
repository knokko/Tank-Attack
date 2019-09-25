import React, { Component, Fragment } from 'react';
import ImageManager from 'manage/image/ImageManager';
import ProfileManager from 'manage/storage/ConnectProfiles';
import UserImageComponent from '../../../component/image/UserImage';
import { Route } from 'react-router-dom';
import CreateImageMenu from './images/Create';
import EditImageMenu from './images/Edit';
import './Images.css';

export default class ImageMenu extends Component {

    render() {
        return (<Fragment>
            <Route path={this.props.match.path} exact render={props => <Overview {...props} />} />
            <Route path={this.props.match.path + "/create"} render={props => <CreateImageMenu {...props} />} />
            <Route path={this.props.match.path + "/edit/:imageID"} render={props => <EditImageMenu {...props} />} />
        </Fragment>);
    }
}

class Overview extends Component {

    constructor(props) {
        super(props);
        this.state = {
            imageIDs: null,
            selectedImage: null,
            selectedMeta: null
        };

        this.userID = ProfileManager.getSelectedProfile().id;

        this.toCreateImageMenu = this.toCreateImageMenu.bind(this);
    }

    componentDidMount() {
        ImageManager.getImageIDS(this.userID, this, imageIDs => {
            this.setState({ imageIDs: imageIDs, selectedImage: null, selectedMeta: null });
            ImageManager.listenUserImageIDs(this.userID, this, newImageIDs => {
                if (this.state.selectedImage !== null && !newImageIDs.includes(this.state.selectedImage.getID())) {
                    this.setState({ imageIDs: newImageIDs, selectedImage: null, selectedMeta: null });
                } else {
                    this.setState({ imageIDs: newImageIDs });
                }
            })
        });
    }

    componentWillUnmount() {
        if (this.state.selectedImage !== null) {
            if (this.state.selectedMeta === null) {
                this.state.selectedImage.cancelGetMetaData(this);
            } else {
                this.state.selectedImage.removeMetaChangeListener(this);
            }
        }
        if (this.state.imageIDs === null) {
            ImageManager.cancelGetImageIDs(ProfileManager.getSelectedProfile().id, this);
        } else {
            ImageManager.stopListenUserImageIDs(this.userID, this);
        }
    }

    toCreateImageMenu() {
        this.props.history.push(this.props.match.url + "/create");
    }

    renderSelected() {
        if (this.state.selectedImage !== null) {
            return <Fragment>
                Image ID: {this.state.selectedImage.getID()} <br />
                {this.state.selectedMeta && this.state.selectedMeta.isVisible() && this.renderSelectedMeta()}
            </Fragment>
        } else {
            return "No image selected";
        }
    }

    renderSelectedMeta() {
        const meta = this.state.selectedMeta;
        return (<Fragment>
            {meta.name} <br />
            {meta.isPrivate ? 'private' : 'public'} <br />
            Last modified at {this.formatTime(meta.lastModified)} <br />
            Created at {this.formatTime(meta.createdAt)} <br />
            <button className="Images-Edit-Button" onClick={() => {
                this.props.history.push(this.props.match.url + '/edit/' + this.state.selectedImage.getID());
            }} >Edit</button> <br />
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
                        selected={this.state.selectedImage && this.state.selectedImage.getID() === imageID}
                        onClick={userImage => {
                            if (this.state.selectedImage !== null) {
                                if (this.state.selectedMeta === null) {
                                    this.state.selectedImage.cancelGetMetaData(this);
                                } else {
                                    this.state.selectedImage.removeMetaChangeListener(this);
                                }
                            }
                            this.setState({ selectedImage: userImage });
                            userImage.getMetaData(this, meta => {
                                this.setState({ selectedMeta: meta });
                                userImage.addMetaChangeListener(this, (_image, newMeta) => {
                                    this.setState({ selectedMeta: newMeta });
                                });
                            });
                        }}
                    />;
                }
                return result;
            }
        } else {
            return "Loading images...";
        }
    }

    formatTime(millis) {
        const date = new Date(millis);
        return this.ensureLength(date.getDate()) + '/' + this.ensureLength(date.getMonth() + 1) + '/' + date.getFullYear() + ' ' + this.ensureLength(date.getHours()) + ':' + this.ensureLength(date.getMinutes());
    }

    ensureLength(number, minLength = 2) {
        let asString = number + '';
        while (asString.length < minLength) {
            asString = '0' + asString;
        }
        return asString;
    }

    render(){
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
}