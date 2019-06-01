use std::sync::Arc;
use crate::connection::sending::send;
use crate::connection::protocol::stc;
use crate::connection::protocol::stc::login::LOGIN_CODE_BITS;
use bit_helper::output::{BitOutput,U8VecBitOutput};

pub fn send_success(socket: Arc<ws::Sender>) -> Result<(),ws::Error> {
    send_response(socket, stc::login::SUCCESS)
}

pub fn send_already_logged_in(socket: Arc<ws::Sender>) -> Result<(),ws::Error> {
    send_response(socket, stc::login::ALREADY_LOGGED_IN)
}

pub fn send_wrong_password(socket: Arc<ws::Sender>) -> Result<(),ws::Error> {
    send_response(socket, stc::login::WRONG_PASSWORD)
}

pub fn send_no_account(socket: Arc<ws::Sender>) -> Result<(),ws::Error> {
    send_response(socket, stc::login::NO_ACCOUNT)
}

fn send_response(socket: Arc<ws::Sender>, code: u8) -> Result<(),ws::Error> {
    let mut output = U8VecBitOutput::with_capacity(1);
    output.add_bool(true);
    output.add_sized_u64(code as u64, LOGIN_CODE_BITS);
    send(socket, output.vector)
}