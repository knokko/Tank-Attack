use crate::connection::handling::error::FatalProcessError;
use crate::connection::handling::error::*;
use crate::connection::sending::register;
use crate::connection::state::ConnectionState;
use crate::ServerApp;

use std::sync::Arc;

pub fn process_register(
    state: &mut ConnectionState,
    app: Arc<ServerApp>,
    socket: Arc<ws::Sender>,
) -> Result<(), FatalProcessError> {
    if !state.is_logged_in() {
        let mut account_manager = app.account_manager.lock().unwrap();
        if account_manager.can_create_account() {
            let account_result = account_manager.create_account(app.secure_random.as_ref());
            if account_result.is_ok() {
                let account = account_result.unwrap();
                register::send_success(socket, account)?;
            } else {
                let random_error = account_result.unwrap_err();
                println!("Secure random failure: {}", random_error);
                register::send_random_error(socket)?;
            }
        } else {
            register::send_max_accounts_reached(socket)?;
        }
        Ok(())
    } else {
        return Err(static_error(
            "Attempted creation of account while logged in",
        ));
    }
}
