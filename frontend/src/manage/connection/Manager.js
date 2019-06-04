import { ByteArrayBitOutput } from 'bit-helper/output';
import { ByteArrayBitInput } from 'bit-helper/input';
import { CODE_LOGIN, CODE_REGISTER, CTS_CODE_BITS } from './protocol/CtS';
import * as Login from './protocol/stc/Login';
import * as Register from './protocol/stc/Register';
import ConnectProfileManager, { PASSWORD_LENGTH } from '../storage/ConnectProfiles';
import { javaByteCast } from 'bit-helper';

const NOT_CONNECTED = 0;
const CONNECTING = 1;
const REGISTERING = 2;
const LOGGING_IN = 3;
const CONNECTED = 4;

class Manager {

    constructor(){
        this.state = NOT_CONNECTED;
        this.socket = null;
        this.nextRequestId = 0;
        this.waitingCallbacks = [];
    }

    connect(connectProfile, onSuccess, onClose){
        if (this.state === NOT_CONNECTED){
            const self = this;
            this.state = CONNECTING;
            this.socket = new WebSocket(connectProfile.address);
            this.socket.onopen = _ => {
                if (connectProfile.isRegistered()){
                    self.state = LOGGING_IN;
                    const output = self.createOutput(CODE_LOGIN, input => {
                        const responseCode = input.readNumber(Login.CODE_BITS, false);
                        if (responseCode === Login.SUCCESS) {
                            self.state = CONNECTED;
                            onSuccess();
                        } else if (responseCode === Login.ALREADY) {
                            alert('Your account is already logged in.');
                            self.socket.close();
                        } else if (responseCode === Login.NO_ACCOUNT) {
                            alert('There is no account with your id. Did you edit the advanced configuration?');
                            self.socket.close();
                        } else if (responseCode === Login.WRONG_PASSWORD) {
                            alert('The password is incorrect. Did you edit the advanced configuration?');
                            self.socket.close();
                        } else {
                            alert('The server sent an invalid response.');
                            self.socket.close();
                        }
                    }, 2 + PASSWORD_LENGTH);
                    output.writeVarUint(connectProfile.id);
                    const password = connectProfile.password;
                    for (let index = 0; index < PASSWORD_LENGTH; index++){
                        output.writeByte(javaByteCast(password[index]));
                    }
                    output.terminate();
                } else {
                    self.state = REGISTERING;
                    self.createOutput(CODE_REGISTER, input => {
                        const responseCode = input.readNumber(Register.CODE_BITS, false);
                        if (responseCode === Register.SUCCESS){
                            const accountID = input.readVarUint();
                            const password = new Uint8Array(PASSWORD_LENGTH);
                            for (let index = 0; index < PASSWORD_LENGTH; index++){
                                password[index] = input.readByte() & 0xFF;
                            }
                            connectProfile.id = accountID;
                            connectProfile.password = password;
                            ConnectProfileManager.save();
                            self.state = CONNECTED;
                            onSuccess();
                        } else if (responseCode === Register.TOO_MANY) {
                            alert('No more accounts can be created for now.');
                            self.socket.close();
                        } else if (responseCode === Register.RANDOM_ERROR) {
                            alert('The server is having trouble with its random password generator');
                            self.socket.close();
                        } else {
                            alert('The server sent an invalid response');
                            self.socket.close();
                        }
                    }, 0).terminate();
                }
            };
            this.socket.onclose = event => {
                self.state = NOT_CONNECTED;
                if (event.reason){
                    window.alert('Disconnected from server: ' + event.reason);
                } else {
                    window.alert('Disconnected from server');
                }
                onClose();
            };
            this.socket.onmessage = event => {
                const fileReader = new FileReader();
                fileReader.onload = event2 => {
                    const input = new ByteArrayBitInput(new Int8Array(event2.target.result));
                    if (input.readBoolean()){
                        self.waitingCallbacks.shift()(input);
                    } else {
                        // TODO process server initiated message, but we don't have any yet
                    }
                }
                fileReader.readAsArrayBuffer(event.data);
            };
        } else {
            alert('You should be in the NOT_CONNECTED state, but you are in state ' + this.state);
        }
    }

    createOutput(messageID, callback, initialCapacity = 10){
        const self = this;

        // The + 1 is for the messageID
        const output = new ByteArrayBitOutput(new Int8Array(initialCapacity + 1), 0, function() {
            self.socket.send(this.getBytes());
        });
        output.writeNumber(messageID, CTS_CODE_BITS, false);
        if (callback){
            this.waitingCallbacks.push(callback);
        }
        return output;
    }

    disconnect(){
        this.socket.close(1000);
    }
}

const ManagerInstance = new Manager();

export default ManagerInstance;