mod start;
mod logged_in;

use crate::ServerApp;
use crate::data::account::account::{Account,AccountID};

use std::sync::Arc;

pub use start::StartState;
pub use logged_in::LoggedInState;

/**
 * Represents the state of a connection with a single client.
 */
pub struct ConnectionState {

    state: CurrentState,

    pub app: Arc<ServerApp>
}

pub enum CurrentState {
    Start(StartState),
    LoggedIn(LoggedInState)
}

impl ConnectionState {

    pub fn new(app: Arc<ServerApp>) -> ConnectionState {
        ConnectionState {
            state: CurrentState::Start(StartState::new()),
            app: app
        }
    }

    pub fn set_logged_in(&mut self, account: &mut Account) {
        account.set_logged_in();
        self.state = CurrentState::LoggedIn(LoggedInState::new(account.get_id()));
    }

    pub fn is_logged_in(&self) -> bool {
        match &self.state {
            CurrentState::LoggedIn(_) => true,
            _ => false
        }
    }

    pub fn get_account_id(&self) -> AccountID {
        match &self.state {
            CurrentState::LoggedIn(state) => state.get_account_id(),
            _ => panic!("Not in logged in state")
        }
    }
}

impl Drop for ConnectionState {

    fn drop(&mut self){
        match &self.state {
            CurrentState::Start(_) => {},
            CurrentState::LoggedIn(state) => state.on_drop(&self.app)
        };
    }
}