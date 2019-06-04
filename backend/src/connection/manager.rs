extern crate threadpool;
extern crate ws;

use crate::connection::handling::handler::ConnectionHandler;
use crate::ServerApp;

use std::cell::RefCell;
use std::sync::Arc;

use threadpool::ThreadPool;

pub struct ConnectionManager {
    server_handle: ws::Sender,
}

impl ConnectionManager {
    pub fn listen_until_end(app: Arc<ServerApp>) {
        let pool = RefCell::new(ThreadPool::new(2));

        let server = ws::Builder::new()
            .build(|out| {
                return ConnectionHandler::new(out, Arc::clone(&app), RefCell::clone(&pool));
            })
            .unwrap();

        *app.connection_manager.lock().unwrap() = Some(ConnectionManager {
            server_handle: server.broadcaster(),
        });

        println!("Opening web socket server");
        let listen_result = server.listen("127.0.0.1:48562");
        match listen_result {
            Ok(_) => println!("Closed web socket server gracefully"),
            Err(error) => println!("Web socket server crashed because: {}", error),
        };
        pool.borrow().join();
        println!("All running connection tasks have been finished");
    }

    pub fn get_server_handle(&self) -> &ws::Sender {
        &self.server_handle
    }
}
