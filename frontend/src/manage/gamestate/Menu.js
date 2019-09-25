import React from 'react';
import BaseMenu from 'show/menu/Connected';
import CollectionMenu from 'show/menu/connected/Collection';
import ConnectionManager from '../connection/Manager';
import { BrowserRouter as Router, Route } from 'react-router-dom';

const Instance = {

    // Will be set in the App constructor
    app: null,
    isLoading: false,

    setLoading: function(){
        this.isLoading = true;
    },

    render: function({ match }){
        return (<Router>
            <Route path={match.path} exact render={props => <BaseMenu {...props} gameState={this} />} />
            <Route path={match.path + "/collection"} render={props => <CollectionMenu {...props} gameState={this} />} />
        </Router>);
    },

    clickBasePlay: function(match, history) {
        if (!this.isLoading){
            window.alert('To play menu');
        }
    },

    clickBaseCollection: function(match, history) {
        if (!this.isLoading){
            history.push(match.url + "/collection");
        }
    },

    clickBaseGallery: function(match, history) {
        if (!this.isLoading){
            window.alert('To the gallery');
        }
    },

    clickBaseDisconnect: function(match, history) {
        ConnectionManager.disconnect();
    },

    clickCollectionBack: function(match, history) {
        history.push(match.path.substring(0, match.path.lastIndexOf("/")));
    }
}

Instance.render = Instance.render.bind(Instance);

export default Instance;