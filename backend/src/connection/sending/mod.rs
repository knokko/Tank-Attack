use std::sync::Arc;

pub mod login;
pub mod register;
pub mod image;

pub fn send(socket: Arc<ws::Sender>, message: Vec<u8>) -> Result<(),ws::Error> {
    socket.send(message)
}