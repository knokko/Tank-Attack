import React from 'react';
import BaseMenu from '../../show/menu/Connected';
import CollectionMenu from '../../show/menu/connected/Collection';
import ConnectionManager from '../connection/Manager';

export default class StateMenu {

    constructor(app){
        this.app = app;
        this.baseMenu = <BaseMenu gameState={this} />;
        this.collectionMenu = <CollectionMenu gameState={this} />;
        this.menu = this.baseMenu;
        this.isLoading = false;
    }

    setMenu(newMenu){
        this.menu = newMenu;
        this.app.forceUpdate();
    }

    setLoading(){
        this.isLoading = true;
    }

    render(){
        return this.menu;
    }

    clickBasePlay = _ => {
        if (!this.isLoading){
            window.alert('To play menu');
        }
    }

    clickBaseCollection = _ => {
        if (!this.isLoading){
            this.setMenu(this.collectionMenu);
        }
    }

    clickBaseGallery = _ => {
        if (!this.isLoading){
            window.alert('To the gallery');
        }
    }

    clickBaseDisconnect = _ => {
        ConnectionManager.disconnect();
    }

    clickCollectionBack = _ => {
        this.setMenu(this.baseMenu);
    }
}