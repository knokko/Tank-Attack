import React, { Component, Fragment } from 'react';
import './Collection.css';

export default class CollectionMenu extends Component {

    constructor(props){
        super(props);
        this.state = {
            bodyComponent: <Fragment />
        };

        // TODO Add the other body components and create a class for the images component
        this.imagesBodyComponent = <Fragment>Images body</Fragment>;
        this.tilesBodyComponent = <Fragment>Tiles body</Fragment>;
        this.levelsBodyComponent = <Fragment>Levels body</Fragment>;
        this.projectilesBodyComponent = <Fragment>Projectiles body</Fragment>;
        this.playersBodyComponent = <Fragment>Players body</Fragment>;
        this.enemiesBodyComponent = <Fragment>Enemies body</Fragment>;
    }

    setBodyComponent(newBodyComponent){
        this.setState({
            bodyComponent: newBodyComponent
        });
    }

    render(){
        const gameState = this.props.gameState;
        return (<div className="Collection">
            <div className="Collection-Upper-Bar">
                { this.renderUpperButton('images') }
                { this.renderUpperButton('tiles') }
                { this.renderUpperButton('levels') }
                { this.renderUpperButton('projectiles') }
                { this.renderUpperButton('players') }
                { this.renderUpperButton('enemies') }
                <button className="Collection-Back-Button" onClick={gameState.clickCollectionBack}>Back</button>
            </div>
            <div className="Collection-Body">
                { this.state.bodyComponent }
            </div>
        </div>);
    }

    renderUpperButton(text){
        return <button 
            className="Collection-Upper-Button"
            onClick={_ => {
                this.setBodyComponent(this[text + 'BodyComponent']);
            }}
        >{ text.charAt(0).toUpperCase() + text.substring(1) }</button>;
    }
}