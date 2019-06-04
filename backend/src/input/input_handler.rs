use crate::ServerApp;
use std::str::SplitWhitespace;
use std::sync::Arc;

pub fn start(application: Arc<ServerApp>) {
    std::thread::spawn(move || {
        let mut input = String::new();
        println!("Listening for your input...");
        loop {
            std::io::stdin()
                .read_line(&mut input)
                .expect("Unable to read user input");
            if handle_user_input(Arc::clone(&application), &input) {
                break;
            } else {
                input.clear();
            }
        }
    });
}

fn handle_user_input(application: Arc<ServerApp>, input: &String) -> bool {
    let mut lines = input.lines();
    loop {
        let maybe_line = lines.next();
        if maybe_line.is_some() {
            let line = maybe_line.unwrap();
            if execute_user_command(Arc::clone(&application), line) {
                return true;
            }
        } else {
            break;
        }
    }
    return false;
}

fn execute_user_command(application: Arc<ServerApp>, command: &str) -> bool {
    let mut line_iterator = command.split_whitespace();
    let maybe_first = line_iterator.next();
    if maybe_first.is_some() {
        let first = maybe_first.unwrap();
        if first.eq("stop") || first.eq("exit") {
            application.stop_websocket_server();
            return true;
        }
        if first.eq("test_counter") {
            execute_test_counter_command(application, &mut line_iterator);
        }
        /* else if first.eq("getbyte") {
            execute_get_byte_command(application, &mut line_iterator);
        } else if first.eq("setbyte") {
            execute_set_byte_command(application, &mut line_iterator);
        } else if first.eq("addbyte") {
            execute_add_byte_command(application, &mut line_iterator);
        } else if first.eq("length"){
            execute_length_command(application);
        } */
        else {
            println!("Unknown command. Use the 'help' command for a list of commands");
        }
    } else {
        println!("You didn't enter a command");
    }
    return false;
}

/*
fn execute_get_byte_command(application: Arc<ServerApp>, command: &mut SplitWhitespace){
    let maybe_index = command.next();
    if maybe_index.is_some() {
        let parsed_index = maybe_index.unwrap().parse();
        if parsed_index.is_ok() {
            let index: u64 = parsed_index.unwrap();
            let mut manager = application.browser_account_manager.lock().unwrap();
            let read_result = manager.get_byte(index);
            match read_result {
                Ok(byte) => println!("The byte at {} is {}", index, byte),
                Err(cause) => println!("Failed to read byte at {} because {}", index, cause)
            };
        } else {
            println!("The index ({}) should be an unsigned integer", maybe_index.unwrap());
        }
    } else {
        println!("You should use:");
        println!("getbyte <index>");
    }
}

fn execute_set_byte_command(application: Arc<ServerApp>, command: &mut SplitWhitespace){
    let maybe_index = command.next();
    if maybe_index.is_some() {
        let parsed_index = maybe_index.unwrap().parse();
        if parsed_index.is_ok() {
            let index: u64 = parsed_index.unwrap();
            let maybe_value = command.next();
            if maybe_value.is_some() {
                let parsed_value = maybe_value.unwrap().parse();
                if parsed_value.is_ok() {
                    let value: u8 = parsed_value.unwrap();
                    let mut manager = application.browser_account_manager.lock().unwrap();
                    match manager.set_byte(index, value) {
                        Ok(amount) => println!("The byte at {} has been set to {} ({} byte changed)", index, value, amount),
                        Err(cause) => println!("Failed to set the byte at {} to {} because: {}", index, value, cause)
                    };
                } else {
                    println!("The value ({}) should be an integer in the range [0,255]", maybe_value.unwrap());
                }
            } else {
                println!("You should use:");
                println!("setbyte {} <value>", index);
            }
        } else {
            println!("The index ({}) should be a non-negative integer", maybe_index.unwrap());
        }
    } else {
        println!("You should use:");
        println!("setbyte <index> <value>")
    }
}

fn execute_add_byte_command(application: Arc<ServerApp>, command: &mut SplitWhitespace){
    let maybe_value = command.next();
    if maybe_value.is_some() {
        let parsed_value = maybe_value.unwrap().parse();
        if parsed_value.is_ok() {
            let value: u8 = parsed_value.unwrap();
            let mut manager = application.browser_account_manager.lock().unwrap();
            let add_result = manager.add_byte(value);
            if add_result {
                println!("The byte {} has been added at the end of the file", value);
            } else {
                println!("Failed to add {} to the end of the file", value);
            }
        } else {
            println!("The value ({}) should be an integer in the range [0,255]", maybe_value.unwrap());
        }
    } else {
        println!("You should use:");
        println!("addbyte <value>");
    }
}

fn execute_length_command(application: Arc<ServerApp>){
    let mut manager = application.browser_account_manager.lock().unwrap();
    match manager.length() {
        Ok(length) => println!("The length of the file is {}", length),
        Err(cause) => println!("Failed to obtain the length of the file because {}", cause)
    };
}*/

fn execute_test_counter_command(application: Arc<ServerApp>, command: &mut SplitWhitespace) {
    let maybe_second = command.next();
    if maybe_second.is_some() {
        let second = maybe_second.unwrap();
        if second.eq("incr") {
            *application.test_counter.lock().unwrap() += 1;
        } else if second.eq("get") {
            println!(
                "Current value of test_counter is {}",
                *application.test_counter.lock().unwrap()
            );
        } else {
            print_test_counter_usage();
        }
    } else {
        print_test_counter_usage();
    }
}

fn print_test_counter_usage() {
    println!("You should use:");
    println!("'test_counter incr' OR 'test_counter get'");
}
