use bit_helper::input::U8VecRefBitInput;

use crate::connection::state::ConnectionState;
use crate::connection::processing::process_request;
use crate::ServerApp;

use std::sync::{Arc,Mutex};

use ws::CloseCode;

pub struct HandlerTask {

    state: Arc<Mutex<ConnectionState>>,
    message: Vec<u8>,

    app: Arc<ServerApp>,
    socket: Arc<ws::Sender>
}

impl HandlerTask {

    pub fn execute(&self){
        let mut state = self.state.lock().unwrap();
        let mut input = U8VecRefBitInput::new(&self.message);
        let result = process_request(&mut state, &mut input, Arc::clone(&self.app), Arc::clone(&self.socket));
        if result.is_err() {
            let error = result.unwrap_err();
            let close_result = self.socket.close_with_reason(CloseCode::Policy, format!("An error occurred while processing the message: {}", error));
            if close_result.is_ok() {
                println!("Successfully closed a connection that sent an invalid bit message");
            } else {
                println!("A connection that sent an invalid bit message didn't want to close");
            }
        }
    }

    pub fn new(state: Arc<Mutex<ConnectionState>>, message: Vec<u8>, app: Arc<ServerApp>, socket: Arc<ws::Sender>) -> HandlerTask {
        HandlerTask {
            state: state,
            message: message,
            app: app,
            socket: socket
        }
    }
}