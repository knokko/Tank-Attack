import React, { Component, Fragment } from 'react';
import Manager, { PASSWORD_LENGTH } from '../../manage/storage/ConnectProfiles';
import DynamicStringInput from '../component/input/DynamicString';
import DynamicIntInput from '../component/input/DynamicInt';
import './Unconnected.css';

export default class Unconnected extends Component {

    constructor(props){
        super(props);
        this.state = {
            showAdvanced: false
        };
    }

    setShowAdvanced(show){
        this.setState({
            showAdvanced: show
        });
    }

    // Button handler section

    showAdvanced = () => {
        this.setShowAdvanced(true);
    }

    cancelAdvanced = () => {
        Manager.load();
        this.setShowAdvanced(false);
    }

    saveAdvanced = () => {
        Manager.save();
        this.setShowAdvanced(false);
    }

    // Rendering section

    render(){
        return (<div className="Unconnected">
            <div className="Unconnected-Main-Box">
                <button 
                className="Unconnected-Main-Box-Connect"
                onClick={() => {
                    if (!this.state.showAdvanced){
                        this.props.gameState.connect(this.props);
                    }
                }}
                >Connect!</button>
                {this.state.showAdvanced ? this.renderShowAdvancedMain() : this.renderHiddenAdvanced()}
            </div>
            {this.state.showAdvanced && this.renderShowAdvanced()}
        </div>);
    }

    renderShowAdvanced(){
        return (<Fragment>
            <ConnectProfiles/>
            {this.renderShowAdvancedList()}
        </Fragment>);
    }

    renderHiddenAdvanced(){
        return <button className="Unconnected-Main-Box-Advanced" onClick={this.showAdvanced}>Advanced connect options...</button>;
    }

    renderShowAdvancedMain(){
        return (<Fragment>
            <button className="Unconnected-Advanced-Cancel" onClick={this.cancelAdvanced}>Cancel</button><br/>
            <button className = "Unconnected-Advanced-Save" onClick={this.saveAdvanced}>Save</button>
        </Fragment>);
    }

    renderShowAdvancedList(){
        const length = Manager.profiles.length;
        const profileComponents = new Array(length * 2);
        const self = this;
        for (let index = 0; index < length; index++){
            const rememberIndex = index;
            profileComponents[index * 2] = <button key={index * 2} onClick={ _ => {
                Manager.selected = rememberIndex;
                self.forceUpdate();
            }}>{Manager.profiles[index].name}</button>;
            profileComponents[index * 2 + 1] = <br key={index * 2 + 1}/>;
        }
        return (
            <Fragment>
                <div className="Unconnected-Advanced-Box-List">
                    {profileComponents}
                </div>
                <div className="Unconnected-Advanced-Box-Create-Container">
                <button 
                    className="Unconnected-Advanced-Box-Create"
                    onClick={_ => {
                        Manager.createNewProfile();
                        self.forceUpdate();
                    }}
                >New</button>
                </div>
            </Fragment>
        );
    }
}

class ConnectProfiles extends Component {

    constructor(props){
        super(props);
        this.state = {
            creatingNew: false
        };
    }

    render(){
        const selectedProfile = Manager.profiles[Manager.selected];
        return (<div className="Unconnected-Advanced-Box-Shown">
            Name: <DynamicStringInput entity={selectedProfile} fieldName="name"/><br/>
            Address: <DynamicStringInput entity={selectedProfile} fieldName="address"/><br/>
            {this.maybeRenderPasswordAndId(selectedProfile)}
        </div>);
    }

    maybeRenderPasswordAndId(selectedProfile){
        const self = this;
        if (selectedProfile.isRegistered()) {
            return (<Fragment>
                Password: <input 
                    type="text" 
                    value={passwordToString(selectedProfile.password)}
                    onChange={_ => {
                        // Allow changing later
                    }}
                /><br/>
                Id: <DynamicIntInput entity={selectedProfile} fieldName="id" minValue={0}/><br/>
                <button 
                    className="Unconnected-Advanced-Box-Clear"
                    onClick={_ => {
                        selectedProfile.password = null;
                        selectedProfile.id = -1;
                        self.forceUpdate();
                    }}
                >Clear</button>
            </Fragment>);
        } else {
            return (<Fragment>
                Create a new account upon connecting<br/>
                <button 
                    className="Unconnected-Advanced-Box-Init"
                    onClick={_ => {
                        selectedProfile.password = new Uint8Array(PASSWORD_LENGTH);
                        selectedProfile.id = 0;
                        self.forceUpdate();
                    }}
                >Initialize</button>
            </Fragment>);
        }
    }
}

const CODE_A = "a".charCodeAt(0);

function passwordToString(password){
    let result = '';
    for (let index = 0; index < PASSWORD_LENGTH; index++){
        result += String.fromCharCode(CODE_A + password[index] / 16, CODE_A + password[index] % 16);
    }
    return result;
}