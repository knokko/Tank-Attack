extern crate threadpool;
extern crate ws;

use crate::connection::handling::handler::ConnectionHandler;
use crate::ServerApp;

use std::cell::RefCell;
use std::sync::Arc;
use std::ops::DerefMut;

use threadpool::ThreadPool;

struct ConnectionFactory {

    app: Arc<ServerApp>,
    pool: RefCell<ThreadPool>
}

impl ws::Factory for ConnectionFactory {

    type Handler = ConnectionHandler;
    
    fn connection_made(&mut self, out: ws::Sender) -> ConnectionHandler {
        let arc_out = Arc::new(out);
        let connection_handler;
        let mut lock = self.app.connection_manager.write().unwrap();
        let maybe_connection_manager = lock.deref_mut();
        match maybe_connection_manager {
            Some(connection_manager) => {
                connection_handler = ConnectionHandler::new(Arc::clone(&arc_out), connection_manager.connections.len(), Arc::clone(&self.app), RefCell::clone(&self.pool));
                connection_manager.connections.push(arc_out)
            },
            None => panic!("Connection manager should have been set by now!")
        }
        connection_handler
    }

    fn connection_lost(&mut self, handler: ConnectionHandler){
        println!("Lost connection {}", handler.get_out_index());
        let mut lock = self.app.connection_manager.write().unwrap();
        let maybe_connection_manager = lock.deref_mut();
        match maybe_connection_manager {
            Some(connection_manager) => {
                connection_manager.connections.remove(handler.get_out_index());
            },
            None => panic!("Connection manager should have been set by now!")
        }
    }
}

pub struct ConnectionManager {
    server_handle: ws::Sender,
    connections: Vec<Arc<ws::Sender>>
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
            server_handle: server.broadcaster(),
            connections: Vec::new()
        });

        *app.connection_manager.write().unwrap() = connection_manager;

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

    pub fn get_connections(&self) -> &Vec<Arc<ws::Sender>> {
        &self.connections
    }
}
