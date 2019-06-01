use std::sync::Arc;
use crate::connection::sending::send;
use crate::connection::protocol::stc::register;
use crate::data::account::account::{Account,PASSWORD_LENGTH};

use bit_helper::output::{BitOutput,U8VecBitOutput};

pub fn send_success(socket: Arc<ws::Sender>, account: &Account) -> Result<(),ws::Error> {
    let mut output = U8VecBitOutput::with_capacity(3 + PASSWORD_LENGTH);
    output.add_bool(true);
    output.add_sized_u64(register::SUCCESS as u64, register::CODE_BITS);
    output.add_var_u64(account.get_id() as u64);
    output.add_u8s_from_slice(account.get_password());
    send(socket, output.vector)
}

pub fn send_max_accounts_reached(socket: Arc<ws::Sender>) -> Result<(),ws::Error> {
    let mut output = U8VecBitOutput::with_capacity(1);
    output.add_bool(true);
    output.add_sized_u64(register::MAX_ACCOUNTS_REACHED as u64, register::CODE_BITS);
    send(socket, output.vector)
}

pub fn send_random_error(socket: Arc<ws::Sender>) -> Result<(),ws::Error> {
    let mut output = U8VecBitOutput::with_capacity(1);
    output.add_bool(true);
    output.add_sized_u64(register::RANDOM_ERROR as u64, register::CODE_BITS);
    send(socket, output.vector)
}