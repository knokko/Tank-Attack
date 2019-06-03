import React, { Component, Fragment } from 'react';
import './Images.css';

export default class ImageMenu extends Component {

    constructor(props){
        super(props);
        this.state = {
            selectedImage: null
        };
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
        if (selectedImage !== null){
            return <Fragment>
                Hm...
            </Fragment>
        } else {
            return null;
        }
    }
}