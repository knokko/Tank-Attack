import { ByteArrayBitOutput } from 'bit-helper/BitOutput';

export default function createLoginPacket(accountID, password){
    const output = new ByteArrayBitOutput(new Int8Array(4 + password.length));
    output.writeInt(accountID);
    output.writeBytes(password);
    return output.getRawBytes().buffer;
}