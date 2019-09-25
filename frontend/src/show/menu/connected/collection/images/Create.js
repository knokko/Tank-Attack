import React, { Component } from 'react';
import './Edit.css';
import { uploadImage } from 'manage/connection/sending/Image';

export default class CreateImage extends Component {

    constructor(props) {
        super(props);
        this.state = {
            error: null,
            info: null
        };

        this.textInputRef = React.createRef();
        this.privateRef = React.createRef();
        this.fileInputRef = React.createRef();

        this.goBack = this.goBack.bind(this);
        this.upload = this.upload.bind(this);
    }

    goBack() {
        const url = this.props.match.url;
        this.props.history.push(url.substring(0, url.lastIndexOf("/")));
    }

    setError(errorMessage) {
        this.setState({ error: errorMessage, info: null });
    }

    setInfo(infoMessage) {
        this.setState({ info: infoMessage, error: null });
    }

    upload() {
        const file = this.fileInputRef.current.files[0];
        if (file !== undefined) {
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

                        const name = this.textInputRef.current.value;
                        const isPrivate = this.privateRef.current.checked;;
                        uploadImage(imageCanvas, name, isPrivate, () => {
                            this.goBack();
                        }, reason => {
                            this.setError(reason);
                        });
                        this.setInfo('Uploading file ' + file.name);
                    } else {
                        this.setError("The image size is " + image.width + " by " + image.height + ", but the maximum allowed size is 256 by 256.");
                    }
                };
                image.onerror = () => {
                    this.setError("Failed to load the image you uploaded.");
                };
                image.src = reader.result;
            }, false);
            reader.readAsDataURL(file);
        } else {
            this.setError('Please select a file first');
        }
    }

    render() {
        return (<div className="Image-Edit-Body">
            {this.state.error && <div className="Image-Edit-Error">{this.state.error}</div>}
            {this.state.info && <div className="Image-Edit-Info">{this.state.info} </div>}
            <button className="Image-Edit-Back" onClick={this.goBack}>Back</button>
            <div className="Image-Edit-Name-Label">Name:</div>
            <input type="text" ref={this.textInputRef} className="Image-Edit-Name-Input"></input>
            <div className="Image-Edit-Private-Label">Private</div>
            <input type="checkbox" ref={this.privateRef} className="Image-Edit-Private-Input"></input>
            <div className="Image-Edit-Image-Label">Image:</div>
            <input type="file" ref={this.fileInputRef} className="Image-Edit-File-Input"></input>
            <button className="Image-Edit-Save" onClick={this.upload}>Upload</button>
        </div>);
    }
}