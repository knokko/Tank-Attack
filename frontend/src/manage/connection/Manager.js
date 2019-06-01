import { ByteArrayBitOutput } from 'bit-helper/output';
import { ByteArrayBitInput } from 'bit-helper/input';
import { CODE_LOGIN, CODE_REGISTER } from './protocol/CtS';

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
                    self.createOutput(CODE_LOGIN, input => {
                        const responseCode = input.readByte();
                        // TODO read the responseCode and act depending on what it is
                    }, 0).terminate();
                } else {
                    self.state = REGISTERING;
                    self.createOutput(CODE_REGISTER, input => {
                        const responseCode = input.readByte();
                        // TODO read the responseCode and act depending on what it is
                    }, 0).terminate();
                }
            };
            this.socket.onclose = _ => {
                self.state = NOT_CONNECTED;
                onClose();
            };
            this.socket.onerror = event => {
                alert(event.target);
            };
            this.socket.onmessage = event => {
                const input = new ByteArrayBitInput(event.target.result);
                if (input.readBoolean()){
                    self.waitingCallbacks.shift()(input);
                } else {
                    // TODO process server initiated message, but we don't have any yet
                }
            };
        } else {
            alert('You should be in the NOT_CONNECTED state, but you are in state ' + this.state);
        }
    }

    createOutput(messageID, callback, initialCapacity = 10){
        const self = this;

        // The + 1 is for the messageID
        const output = new ByteArrayBitOutput(new Int8Array(initialCapacity + 1), 0, _ => {
            self.socket.send(this.getBytes());
        });
        output.writeByte(messageID);
        if (callback){
            this.waitingCallbacks.push(callback);
        }
        return output;
    }
}

const ManagerInstance = new Manager();

export default ManagerInstance;