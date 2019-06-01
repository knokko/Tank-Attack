use crate::ServerApp;
use crate::data::account::account::AccountID;

use std::sync::Arc;

pub struct LoggedInState {

    account_id: AccountID
}

impl LoggedInState {

    pub fn new(account_id: AccountID) -> LoggedInState {
        LoggedInState {
            account_id: account_id
        }
    }

    pub fn get_account_id(&self) -> AccountID {
        self.account_id
    }

    pub fn on_drop(&self, app: &Arc<ServerApp>){
        let mut account_manager = app.account_manager.lock().unwrap();
        account_manager.get_mut_account(self.account_id).unwrap().set_logged_out();
    }
}