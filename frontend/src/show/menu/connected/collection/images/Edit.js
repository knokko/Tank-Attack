import React, { Component } from 'react';
import ImageManager from 'manage/image/ImageManager';
import './Edit.css';
import { changeImageMeta, changeImagePixels } from 'manage/connection/sending/Image';
import { MetaData } from 'manage/image/UserImage';

export default class EditImage extends Component {

    constructor(props) {
        super(props);

        // image is not part of state because it doesn't have any effect on the render method
        this.image = null;

        // meta is part of state because it is important for the render method
        this.state = {
            meta: null,
            error: null,
            info: null
        };

        this.nameRef = React.createRef();
        this.fileRef = React.createRef();
        this.privateRef = React.createRef();
    }

    setError(errorMessage) {
        this.setState({ error: errorMessage, info: null });
    }

    setInfo(infoMessage) {
        this.setState({ info: infoMessage, error: null });
    }

    getImageID(){
        return parseInt(this.props.match.params.imageID);
    }

    componentDidMount() {
        ImageManager.getUserImage(this.getImageID(), this, image => {
            this.image = image;
            image.getMetaData(this, meta => {
                this.setState({ meta: meta });
            });
        });
    }

    componentWillUnmount() {
        if (this.image === null) {
            ImageManager.cancelGetUserImage(this.getImageID(), this);
        } else if (this.state.meta === null) {
            this.image.cancelGetMetaData(this);
        }
    }

    goBack() {
        const url = this.props.match.url;
        this.props.history.push(url.substring(0, url.lastIndexOf('/') - 5));
    }

    render() {
        if (this.state.meta === null) {
            return "Loading...";
        } else if (!this.state.meta.isVisible()) {
            return "You do not have access to this image";
        } else {
            return (<div className="Image-Edit-Body">
                {this.state.error && <div className="Image-Edit-Error">{this.state.error}</div>}
                {this.state.info && <div className="Image-Edit-Info">{this.state.info} </div>}
                <button className="Image-Edit-Back" onClick={() => {
                    this.goBack();
                }}>Cancel</button>
                <div className="Image-Edit-Name-Label">Name:</div>
                <input type="text" ref={this.nameRef} className="Image-Edit-Name-Input" defaultValue={this.state.meta.name} />
                <div className="Image-Edit-Private-Label">Private</div>
                <input type="checkbox" ref={this.privateRef} className="Image-Edit-Private-Input" defaultChecked={this.state.meta.isPrivate} />
                <div className="Image-Edit-Image-Label">Change image:</div>
                <input type="file" ref={this.fileRef} className="Image-Edit-File-Input" style={{left: '45vw'}}/>
                <button className="Image-Edit-Save" onClick={() => {

                    const newName = this.nameRef.current.value;
                    const newPrivate = this.privateRef.current.checked;
                    const newImage = this.fileRef.current.files[0];
                    let changeMeta = newName !== this.state.meta.name || newPrivate !== this.state.meta.isPrivate;

                    let metaResult = undefined;
                    let pixelsResult = undefined;
                    const imageID = this.getImageID();

                    if (changeMeta || newImage){
                        this.setInfo('Saving changes...');
                    } else {
                        this.setInfo('There are no changes');
                    }

                    if (changeMeta) {
                        changeImageMeta(imageID, newName, newPrivate, () => {
                            ImageManager.notifyImageMetaChange(imageID, new MetaData(newName, newPrivate, true, this.state.meta.lastModified, this.state.meta.createdAt));
                            if (newImage) {
                                if (pixelsResult) {
                                    this.goBack();
                                } else if (pixelsResult === undefined) {
                                    metaResult = true;
                                }
                            } else {
                                this.goBack();
                            }
                        }, reason => {
                            metaResult = false;
                            this.setError(reason);
                        });
                    }
                    if (newImage) {
                        const onFail = reason => {
                            pixelsResult = false;
                            this.setError(reason);
                        };

                        const image = new Image();
                        const reader = new FileReader();

                        reader.addEventListener('load', () => {

                            image.onload = () => {
                                if (image.width <= 256 && image.height <= 256) {
                                    const imageCanvas = document.createElement('canvas');
                                    imageCanvas.width = image.width;
                                    imageCanvas.height = image.height;
                                    const ctx = imageCanvas.getContext('2d');
                                    ctx.drawImage(image, 0, 0);

                                    changeImagePixels(imageID, imageCanvas, newLastModified => {
                                        ImageManager.notifyImageChange(imageID, imageCanvas, newLastModified);
                                        if (changeMeta) {
                                            if (metaResult) {
                                                this.goBack();
                                            } else if (metaResult === undefined) {
                                                pixelsResult = true;
                                            }
                                        } else {
                                            this.goBack();
                                        }
                                    }, onFail);
                                } else {
                                    onFail("The image size is " + image.width + " by " + image.height + ", but the maximum allowed size is 256 by 256.");
                                }
                            };
                            image.onerror = () => {
                                onFail("Failed to load the image you uploaded.");
                            };
                            image.src = reader.result;
                        }, false);
                        reader.readAsDataURL(newImage);
                    }
                }} >Save</button>
            </div>);
        }
    }
}