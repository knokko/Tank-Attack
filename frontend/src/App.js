import React, { Component } from 'react';
import StateUnconnected from './manage/gamestate/Unconnected';
import StateMenu from './manage/gamestate/Menu';
import ConnectionManager from './manage/connection/Manager';
import ProfileManager from './manage/storage/ConnectProfiles';
import {BrowserRouter as Router, Route } from 'react-router-dom';

class App extends Component {

  constructor(props){
    super(props);
    StateUnconnected.app = this;
    StateMenu.app = this;
    this.state = {
      blockNonEmpty: true
    };
  }

  render() {

    // This render method will only be called once when the user navigates to this website
    // If the pathname is then not empty, it means that the user used a pathname in the url
    // If that happens, we need to log in before we can continue
    if (this.state.blockNonEmpty && window.location.pathname !== "/"){
      ConnectionManager.connect(ProfileManager.getSelectedProfile(), () => {
        this.setState({
          blockNonEmpty: false
        });
      }, () => {

        // When we can't connect, we will just move back to the main menu...
        window.location.pathname = "/";
      });
      return "Loading...";
    }

    return (<Router>
      <Route path="/" exact render={StateUnconnected.render}></Route>
      <Route path="/menu" render={StateMenu.render}></Route>
    </Router>);
  }
}

export default App;
