extern crate ws;
extern crate threadpool;

use std::sync::{Arc,Mutex};
use std::cell::RefCell;

use threadpool::ThreadPool;

use ws::CloseCode;

use crate::ServerApp;
use crate::connection::state::ConnectionState;
use crate::connection::handling::task::HandlerTask;

const MAX_MANUAL_QUEUE_LENGTH: usize = 100;

pub struct ConnectionHandler {

    next_task: Arc<Mutex<NextTask>>,
    task_counter: u32,
    is_closing: bool,

    state: Arc<Mutex<ConnectionState>>,
    application: Arc<ServerApp>,
    
    out: Arc<ws::Sender>,
    pool: RefCell<ThreadPool>
}

struct NextTask {

    id: u32,
    queue: Vec<HandlerTask>
}

impl NextTask {

    fn new() -> NextTask {
        NextTask {
            id: 0,
            queue: Vec::new()
        }
    }
}

impl ConnectionHandler {

    pub fn new(out: ws::Sender, application: Arc<ServerApp>, pool: RefCell<ThreadPool>) -> ConnectionHandler {
        println!("Create new connection handler");
        ConnectionHandler {
            next_task : Arc::new(Mutex::new(NextTask::new())),
            task_counter: 0,
            is_closing: false,
            state: Arc::new(Mutex::new(ConnectionState::new(Arc::clone(&application)))),
            out: Arc::new(out),
            application: application,
            pool: pool
        }
    }
}

impl ws::Handler for ConnectionHandler {

    fn on_message(&mut self, msg: ws::Message) -> Result<(), ws::Error> {

        if !msg.is_binary() {
            println!("Received non-binary message");
            let close_result = self.out.close_with_reason(CloseCode::Unsupported, "Only binary messages are allowed");
            match close_result {
                Ok(_) => {},
                Err(error) => {
                    println!("Closing connection with non-binary websocket failed: {}", error);
                }
            };
            return Ok(());
        }

        let task_id = self.task_counter;
        self.task_counter += 1;

        let task = HandlerTask::new(Arc::clone(&self.state), msg.into_data(), Arc::clone(&self.application), Arc::clone(&self.out));

        {
            let mut next_task = self.next_task.lock().unwrap();
            let arc_next_task = Arc::clone(&self.next_task);
            if next_task.id == task_id {
                self.pool.borrow().execute(move || {
                    execute_task(task, arc_next_task);
                });
            } else {
                if next_task.queue.len() < MAX_MANUAL_QUEUE_LENGTH {
                    println!("Queue the execution of task {}", task_id);
                    next_task.queue.push(task);
                } else {
                    println!("Queue for this handler has grown too big");
                    let close_result = self.out.close_with_reason(CloseCode::Error, "Too many of your messages are queued, server is probably overloaded");
                    match close_result {
                        Ok(_) => {},
                        Err(error) => println!("Failed to close connection with handler with too long queue: {}", error)
                    };
                }
            }
        }
        Ok(())
    }

    fn on_close(&mut self, code: ws::CloseCode, reason: &str) {
        // The WebSocket protocol allows for a utf8 reason for the closing state after the
        // close code. WS-RS will attempt to interpret this data as a utf8 description of the
        // reason for closing the connection. I many cases, `reason` will be an empty string.
        // So, you may not normally want to display `reason` to the user,
        // but let's assume that we know that `reason` is human-readable.
        match code {
            ws::CloseCode::Normal => println!("The client is done with the connection."),
            ws::CloseCode::Away   => println!("The client is leaving the site."),
            _ => println!("The client encountered an error: {}", reason),
        }

        self.handle_close();
    }

    fn on_error(&mut self, _error: ws::Error){
        self.handle_close();
    }

    fn on_shutdown(&mut self){
        self.handle_close();
    }
}

impl ConnectionHandler {

    fn handle_close(&mut self){
        if !self.is_closing {
            self.is_closing = true;

            // Don't start serving any new requests, only continue those that already started
            let mut next_task = self.next_task.lock().unwrap();
            next_task.queue.clear();
        }
    }
}

fn execute_task(mut task: HandlerTask, arc_next_task: Arc<Mutex<NextTask>>){
    loop {
        task.execute();

        let mut end_next_task = arc_next_task.lock().unwrap();
        end_next_task.id += 1;

        if end_next_task.queue.len() > 0 {
            task = end_next_task.queue.remove(0);
        } else {
            break;
        }
    }
}