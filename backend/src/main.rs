extern crate ring;
extern crate ws;

mod connection;
mod data;
mod input;

use std::sync::{Arc, Mutex, RwLock};

use crate::connection::manager::ConnectionManager;
use crate::data::account::manager::AccountManager;
use crate::data::image::manager::ImageManager;

use ring::rand::SystemRandom;

fn main() {
    println!("Starting program...");

    let mut account_manager = AccountManager::init();
    let image_manager = ImageManager::init(&mut account_manager);

    let application = Arc::new(ServerApp {
        connection_manager: RwLock::new(None),
        account_manager: RwLock::new(account_manager),
        image_manager: RwLock::new(image_manager),
        secure_random: Box::new(SystemRandom::new()),
        test_counter: Mutex::new(0),
    });

    {
        let mut image_manager = application.image_manager.write().unwrap();
        image_manager.set_app_instance(Arc::clone(&application));
    }

    input::input_handler::start(Arc::clone(&application));

    // This will block until the application should shut down
    ConnectionManager::listen_until_end(Arc::clone(&application));

    println!("Saving account data...");
    let account_manager = application.account_manager.read().unwrap();
    account_manager.stop();
    drop(account_manager);
    println!("Saved account data");

    println!("Saving image data...");
    let image_manager = application.image_manager.read().unwrap();
    image_manager.stop();
    drop(image_manager);
    println!("Saved image data");

    println!("End of main function");
}

pub struct ServerApp {
    connection_manager: RwLock<Option<ConnectionManager>>,
    account_manager: RwLock<AccountManager>,
    image_manager: RwLock<ImageManager>,
    secure_random: Box<SystemRandom>,
    test_counter: Mutex<i8>,
}

impl ServerApp {
    fn stop_websocket_server(&self) {
        let connection_manager = self.connection_manager.read().unwrap();
        let ref_manager = connection_manager.as_ref();
        if ref_manager.is_some() {
            let result = ref_manager.unwrap().get_server_handle().shutdown();
            match result {
                Ok(_) => println!("Closed the websocket server"),
                Err(cause) => println!("Failed to close the websocket server because {}", cause),
            };
        }
    }
}
