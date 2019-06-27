extern crate threadpool;
extern crate ws;

use crate::connection::handling::handler::ConnectionHandler;
use crate::ServerApp;

use std::cell::RefCell;
use std::sync::Arc;

use threadpool::ThreadPool;

struct ConnectionFactory {

    app: Arc<ServerApp>,
    pool: RefCell<ThreadPool>
}

impl ws::Factory for ConnectionFactory {

    type Handler = ConnectionHandler;
    
    fn connection_made(&mut self, out: ws::Sender) -> ConnectionHandler {
        return ConnectionHandler::new(out, Arc::clone(&self.app), RefCell::clone(&self.pool));
    }
}

pub struct ConnectionManager {
    server_handle: ws::Sender
}

impl ConnectionManager {
    pub fn listen_until_end(app: Arc<ServerApp>) {
        let pool = RefCell::new(ThreadPool::new(2));

        let factory = ConnectionFactory {
            app: Arc::clone(&app),
            pool: RefCell::clone(&pool)
        };

        let server = ws::Builder::new().build(factory).unwrap();

        let connection_manager = Some(ConnectionManager {
            server_handle: server.broadcaster()
        });

        *app.connection_manager.lock().unwrap() = connection_manager;

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
