import { Component } from 'react';
import StateUnconnected from './manage/gamestate/Unconnected';

class App extends Component {

  constructor(props){
    super(props);
    this.state = {
      gameState: new StateUnconnected(this)
    };
  }

  render() {
    return this.state.gameState.render();
  }

  setGameState(newState){
    this.setState({
      gameState: newState
    });
  }
}

export default App;
