use crate::ServerApp;

use std::sync::Arc;

pub mod image;
pub mod login;
pub mod register;

pub fn send(socket: Arc<ws::Sender>, message: Vec<u8>) -> Result<(), ws::Error> {
    socket.send(message)
}

// TODO Maybe recover this function later if it turns out to be useful
/*
fn broadcast(app: Arc<ServerApp>, message: Vec<u8>) {
    let should_be_connection_manager = app.connection_manager.read().unwrap();
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
}*/

pub fn broadcast_except(app: Arc<ServerApp>, index_to_skip: usize, message: Vec<u8>){
    let should_be_connection_manager = app.connection_manager.read().unwrap();
    match &*should_be_connection_manager {
        Some(connection_manager) => {
            let connections = connection_manager.get_connections();
            for index in 0..connections.len() {
                if index != index_to_skip {
                    match connections[index].send(message.as_slice()) {
                        Ok(_) => {},
                        Err(err) => println!("Failed to broadcast a message to connection {} because {}", index, err)
                    }
                }
            }
        }
        None => panic!("The connection manager must not be None at this stage"),
    }
}