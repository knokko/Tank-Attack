import React, { Component } from 'react';
import './Create.css';
import { uploadImage } from '../../../../../manage/connection/sending/Image';

export default class CreateImage extends Component {

    constructor(props){
        super(props);
        this.state = {
            error: null,
            info: null
        };

        this.fileInputRef = React.createRef();

        this.goBack = this.goBack.bind(this);
        this.upload = this.upload.bind(this);
    }

    goBack(){
        const collectionMenu = this.props.collectionMenu;
        collectionMenu.setBodyComponent(collectionMenu.imagesBodyComponent);
    }

    setError(errorMessage){
        this.setState({error: errorMessage, info: null});
    }

    setInfo(infoMessage){
        this.setState({info: infoMessage, error: null});
    }

    upload(){
        const file = this.fileInputRef.current.files[0];
        if (file !== undefined){
            const image = new Image();
            const reader = new FileReader();
            reader.addEventListener('load', () => {

                // TODO Also add an error event
                image.onload = () => {
                    const imageCanvas = document.createElement('canvas');
                    imageCanvas.width = image.width;
                    imageCanvas.height = image.height;
                    const ctx = imageCanvas.getContext('2d');
                    ctx.drawImage(image, 0, 0);

                    // TODO Add checkbox for private instead of hardcoding false
                    // TODO And retrieve the name instead of hardcoding "temp name"
                    uploadImage(imageCanvas, "temp name", false, () => {
                        this.goBack();
                    }, reason => {
                        this.setError(reason);
                    });
                    this.setInfo('Uploading file ' + file.name);
                };
                image.src = reader.result;
            }, false);
            reader.readAsDataURL(file);
        } else {
            this.setError('Please select a file first');
        }
    }

    render(){
        return (<div className="Image-Create-Body">
            { this.state.error && <div className="Image-Create-Error">{ this.state.error }</div> }
            { this.state.info && <div className="Image-Create-Info">{ this.state.info } </div> }
            <button className="Image-Create-Back" onClick={this.goBack}>Back</button>
            <div className="Image-Create-Label" style={{top: '20vh'}}>Name:</div>
            <input type="text" className="Image-Create-Text-Input" style={{top: '20vh'}}></input>
            <div className="Image-Create-Label" style={{top: '40vh'}}>Image:</div>
            <input type="file" ref={this.fileInputRef} className="Image-Create-File-Input" style={{top: '40vh'}}></input>
            <button className="Image-Create-Upload" onClick={this.upload}>Upload</button>
        </div>);
    }
}