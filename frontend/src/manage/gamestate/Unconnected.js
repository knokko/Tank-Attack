import Menu from '../../show/menu/Unconnected';
import ConnectingMenu from '../../show/menu/Connecting';
import ConnectProfileManager from '../storage/ConnectProfiles';
import ConnectionManager from '../connection/Manager';
import StateMenu from './Menu';
import React from 'react';

export default class Unconnected {

    constructor(app){
        this.isConnecting = false;
        this.app = app;
    }

    connect(){
        this.isConnecting = true;
        const selectedProfile = ConnectProfileManager.profiles[ConnectProfileManager.selected];
        const self = this;
        ConnectionManager.connect(selectedProfile, _ => {
            self.app.setGameState(new StateMenu(this.app));
        }, _ => {
            this.isConnecting = false;
            self.app.setGameState(this);
        });
    }

    render(){
        if (!this.isConnecting){
            return <Menu gameState={this} />;
        } else {
            return <ConnectingMenu />;
        }
    }
}