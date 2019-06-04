mod image;
mod login;
mod register;

use crate::connection::handling::error::*;
use crate::connection::protocol::cts::*;
use crate::connection::state::ConnectionState;
use crate::ServerApp;
use bit_helper::input::BitInput;
use std::sync::Arc;

pub fn process_request(
    state: &mut ConnectionState,
    input: &mut BitInput,
    app: Arc<ServerApp>,
    socket: Arc<ws::Sender>,
) -> Result<(), FatalProcessError> {
    println!("Execute task on thread {:?}", std::thread::current().id());
    let message_code: ProtocolType = input.read_sized_u64(CODE_BITS)?;
    if message_code == CODE_LOGIN {
        return login::process_login(state, input, app, socket);
    } else if message_code == CODE_REGISTER {
        return register::process_register(state, app, socket);
    } else if message_code == CODE_IMAGE {
        return image::process_image(state, input, app, socket);
    } else {
        return Err(dynamic_error(format!(
            "Unknown message code: {}",
            message_code
        )));
    }
}
