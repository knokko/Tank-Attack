use crate::ServerApp;

use std::sync::Arc;

pub mod image;
pub mod login;
pub mod register;

pub fn send(socket: Arc<ws::Sender>, message: Vec<u8>) -> Result<(), ws::Error> {
    socket.send(message)
}

pub fn broadcast(app: Arc<ServerApp>, message: Vec<u8>) {
    let should_be_connection_manager = app.connection_manager.lock().unwrap();
    match &*should_be_connection_manager {
        Some(connection_manager) => {
            let server_handle = connection_manager.get_server_handle();
            let result = server_handle.broadcast(message);
            if result.is_err() {
                let error = result.unwrap_err();
                println!("An error occurred while broadcasting: {}", error);
            }
        }
        None => panic!("The connection manager must not be None at this stage"),
    }
}
