import React, { Component } from 'react';
import './Connected.css';

export default class ConnectedMenu extends Component {

    render(){
        const { match, history, gameState } = this.props;
        return (<div className="Connected">
            <div className="Connected-Top-Bar">
                <button className="Connected-Top-Button" onClick={() => gameState.clickBasePlay(match, history)}>Play</button>
                <button className="Connected-Top-Button" onClick={() => gameState.clickBaseCollection(match, history)}>Collection</button>
                <button className="Connected-Top-Button" onClick={() => gameState.clickBaseGallery(match, history)}>Gallery</button>
            </div>
            <div className="Connected-Right-Bar">
                <button className="Connected-Disconnect-Button" onClick={() => gameState.clickBaseDisconnect()}>Disconnect</button>
            </div>
        </div>);
    }
}