import React, { Component } from 'react';
import './Create.css';
import { uploadImage } from '../../../../../manage/connection/sending/Image';

export default class CreateImage extends Component {

    constructor(props) {
        super(props);
        this.state = {
            error: null,
            info: null
        };

        this.textInputRef = React.createRef();
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

                        // TODO Add checkbox for private instead of hardcoding false
                        const name = this.textInputRef.current.value;
                        uploadImage(imageCanvas, name, false, () => {
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
        return (<div className="Image-Create-Body">
            {this.state.error && <div className="Image-Create-Error">{this.state.error}</div>}
            {this.state.info && <div className="Image-Create-Info">{this.state.info} </div>}
            <button className="Image-Create-Back" onClick={this.goBack}>Back</button>
            <div className="Image-Create-Label" style={{ top: '20vh' }}>Name:</div>
            <input type="text" ref={this.textInputRef} className="Image-Create-Text-Input" style={{ top: '20vh' }}></input>
            <div className="Image-Create-Label" style={{ top: '40vh' }}>Image:</div>
            <input type="file" ref={this.fileInputRef} className="Image-Create-File-Input" style={{ top: '40vh' }}></input>
            <button className="Image-Create-Upload" onClick={this.upload}>Upload</button>
        </div>);
    }
}