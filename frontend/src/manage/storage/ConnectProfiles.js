const KEY_AMOUNT = "ConnectProfileAmount";
const KEY_BASE = "ConnectProfile";
const KEY_SELECTED = "ConnectProfileSelected";
const ADDRESS = "ws://localhost:48562";

export const PASSWORD_LENGTH = 64;

class ManagerClass {

    constructor(){
        this.profiles = [];
        this.selected = 0;
    }

    save(){
        const length = this.profiles.length;
        localStorage.setItem(KEY_AMOUNT, length);
        for (let index = 0; index < length; index++) {
            const profile = this.profiles[index];
            const json = {
                name: profile.name,
                address: profile.address,
                id: profile.id,
                password: profile.password
            };
            localStorage.setItem(KEY_BASE + index, JSON.stringify(json));
        }
        localStorage.setItem(KEY_SELECTED, this.selected);
    }

    load(){
        let connectProfileAmount = parseInt(localStorage.getItem(KEY_AMOUNT));
        if (connectProfileAmount){
            this.profiles = new Array(connectProfileAmount);
            for (let index = 0; index < connectProfileAmount; index++){
                const json = JSON.parse(localStorage.getItem(KEY_BASE + index));
                this.profiles[index] = new ConnectProfile(json.name, json.address, json.id, json.password);
            }
            this.selected = parseInt(localStorage.getItem(KEY_SELECTED));
        } else {
            this.profiles = [new ConnectProfile("Default", ADDRESS, -1, null)];
            this.selected = 0;
        }
    }

    createNewProfile(){
        this.selected = this.profiles.length;
        this.profiles.push(new ConnectProfile("New profile", ADDRESS, -1, null));
    }

    getSelectedProfile(){
        return this.profiles[this.selected];
    }
}

export class ConnectProfile {

    constructor(name, address, id, password){
        this.name = name;
        this.address = address;
        this.id = id;
        this.password = password;
    }

    isRegistered(){
        return this.password !== null;
    }
}

const Manager = init();

export default Manager;

function init(){
    const manager = new ManagerClass();
    manager.load();
    return manager;
}