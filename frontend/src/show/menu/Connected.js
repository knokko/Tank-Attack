import React, { Component } from 'react';
import './Connected.css';

export default class ConnectedMenu extends Component {

    render(){
        const gameState = this.props.gameState;
        return (<div className="Connected">
            <div className="Connected-Top-Bar">
                <button className="Connected-Top-Button" onClick={gameState.clickBasePlay}>Play</button>
                <button className="Connected-Top-Button" onClick={gameState.clickBaseCollection}>Collection</button>
                <button className="Connected-Top-Button" onClick={gameState.clickBaseGallery}>Gallery</button>
            </div>
            <div className="Connected-Right-Bar">
                <button className="Connected-Disconnect-Button" onClick={gameState.clickBaseDisconnect}>Disconnect</button>
            </div>
        </div>);
    }
}