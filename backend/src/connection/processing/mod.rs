mod login;
mod register;
mod image;

use std::sync::Arc;
use bit_helper::input::BitInput;
use crate::connection::state::ConnectionState;
use crate::connection::handling::error::*;
use crate::ServerApp;
use crate::connection::protocol::cts::*;

pub fn process_request(state: &mut ConnectionState, input: &mut BitInput, app: Arc<ServerApp>, socket: Arc<ws::Sender>) -> Result<(),FatalProcessError> {
    println!("Execute task on thread {:?}", std::thread::current().id());
    let message_code: ProtocolType = input.read_i8()?;
    if message_code == CODE_LOGIN {
        return login::process_login(state, input, app, socket);
    } else if message_code == CODE_REGISTER {
        return register::process_register(state, app, socket);
    } else if message_code == CODE_IMAGE {
        return image::process_image(state, input, app, socket);
    } else {
        return Err(dynamic_error(format!("Unknown message code: {}", message_code)));
    }
}