use bit_helper::input::BitInput;

use crate::ServerApp;
use crate::connection::state::ConnectionState;
use crate::connection::handling::error::*;
use crate::connection::sending::login::*;
use crate::data::account::account::PASSWORD_LENGTH;

use std::sync::Arc;

pub fn process_login(state: &mut ConnectionState, input: &mut BitInput, app: Arc<ServerApp>, socket: Arc<ws::Sender>) -> Result<(),FatalProcessError> {
    if !state.is_logged_in() {
        let account_id = input.read_var_u64()? as u32;
        let password = input.read_u8s(PASSWORD_LENGTH)?;
        let mut account_manager = app.account_manager.lock().unwrap();
        let maybe_account = account_manager.get_mut_account(account_id);
        if maybe_account.is_some() {
            let account = maybe_account.unwrap();
            if account.is_logged_in(){
                send_already_logged_in(socket)?;
            } else {
                if account.equals_password(password){
                    send_success(socket)?;
                    state.set_logged_in(account);
                } else {
                    send_wrong_password(socket)?;
                }
            }
        } else {
            send_no_account(socket)?;
        }
        Ok(())
    } else {
        return Err(static_error("Connection state is already in logged in state"));
    }
}