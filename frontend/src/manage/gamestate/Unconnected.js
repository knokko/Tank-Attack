import Menu from '../../show/menu/Unconnected';
import ConnectingMenu from '../../show/menu/Connecting';
import ConnectProfileManager from '../storage/ConnectProfiles';
import ConnectionManager from '../connection/Manager';
import React from 'react';

const Instance = {

    isConnecting: false,

    // This is supposed to be set in the constructor of App
    app: null,

    connect: function({ history }){
        this.isConnecting = true;
        const selectedProfile = ConnectProfileManager.profiles[ConnectProfileManager.selected];
        ConnectionManager.connect(selectedProfile, () => {
            history.push("/menu");
        }, () => {
            this.isConnecting = false;
            history.push("");
        });
    },

    render: function({ match, history }){
        if (!this.isConnecting){
            return <Menu gameState={this} match={match} history={history} />;
        } else {
            return <ConnectingMenu />;
        }
    }
}

Instance.render = Instance.render.bind(Instance);

export default Instance;