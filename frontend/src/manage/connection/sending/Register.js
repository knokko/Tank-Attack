import { CODE_REGISTER } from "../protocol/CtS";

export default function createRegisterPacket(){
    return new Int8Array([CODE_REGISTER]).buffer;
}