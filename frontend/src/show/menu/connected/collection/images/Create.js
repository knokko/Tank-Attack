import React, { Component } from 'react';
import './Create.css';

export default class CreateImage extends Component {

    constructor(props){
        super(props);
        this.state = {
            error: null
        };

        this.fileInputRef = React.createRef();

        this.goBack = this.goBack.bind(this);
        this.upload = this.upload.bind(this);
    }

    goBack(){
        this.props.collectionMenu.setBodyComponent(this.props.imagesMenu);
    }

    setError(errorMessage){
        this.setState({error: errorMessage});
    }

    upload(){
        const file = this.fileInputRef.current.files[0];
        if (file !== undefined){
            window.alert('Upload file ' + file.name);
        } else {
            // TODO Rethink about the way I use 'child' components
            this.setError('Please select a file first');
        }
    }

    render(){
        return (<div className="Image-Create-Body">
            { this.state.error && <div className="Image-Create-Error">{ this.state.error }</div>}
            <button className="Image-Create-Back" onClick={this.goBack}>Back</button>
            <div className="Image-Create-Label" style={{top: '20vh'}}>Name:</div>
            <input type="text" className="Image-Create-Text-Input" style={{top: '20vh'}}></input>
            <div className="Image-Create-Label" style={{top: '40vh'}}>Choose file:</div>
            <input type="file" ref={this.fileInputRef} className="Image-Create-File-Input" style={{top: '40vh'}}></input>
            <button className="Image-Create-Upload" onClick={this.upload}>Upload</button>
        </div>);
    }
}