import React, { Component } from 'react';
import ImageBody from './collection/Images';
import { Route } from 'react-router-dom';
import './Collection.css';

export default class CollectionMenu extends Component {

    render() {
        const { gameState, match, history } = this.props;

        return (<div className="Collection">
                <div className="Collection-Upper-Bar">
                    {this.renderUpperButton('images')}
                    {this.renderUpperButton('tiles')}
                    {this.renderUpperButton('levels')}
                    {this.renderUpperButton('projectiles')}
                    {this.renderUpperButton('players')}
                    {this.renderUpperButton('enemies')}
                    <button className="Collection-Back-Button" onClick={() => gameState.clickCollectionBack(match, history)}>Back</button>
                </div>
                <div className="Collection-Body">
                    <Route path={match.path + "/images"} render={props => <ImageBody {...props} collectionMenu={this} /> } />
                    <Route path={match.path + "/tiles"} render={() => "tiles"} />
                    <Route path={match.path + "/levels"} render={() => "levels"} />
                    <Route path={match.path + "/projectiles"} render={() => "projectiles"} />
                    <Route path={match.path + "/players"} render={() => "players"} />
                    <Route path={match.path + "/enemies"} render={() => "enemies"} />
                </div>
            </div>);
    }

    renderUpperButton(text) {
        return <button
            className="Collection-Upper-Button"
            onClick={() => {
                this.props.history.push(this.props.match.url + "/" + text);
            }}
        >{text.charAt(0).toUpperCase() + text.substring(1)}</button>;
    }
}