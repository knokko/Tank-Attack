const PASS_SIZE: usize = 16;

use std::path::Path;
use std::fs::{File, create_dir_all};
use std::fs::OpenOptions;

use std::io::Write;

extern crate positioned_io;
use positioned_io::{ReadAt, WriteAt};

pub struct BrowserAccountManager {

    file_access: File
}

impl Drop for BrowserAccountManager {

    fn drop(&mut self){
        let maybe_length = self.length();
        if maybe_length.is_ok() {
            let length = maybe_length.unwrap();
            if length > 0 {
                let maybe_old_byte = self.get_byte(length - 1);
                if maybe_old_byte.is_ok() {
                    let old_byte = maybe_old_byte.unwrap();
                    match self.set_byte(length - 1, old_byte){
                        Ok(amount) => println!("Refreshed the last ({}) byte successfully", amount),
                        Err(cause) => println!("Failed to refresh the last byte because {}", cause)
                    };
                } else {
                    println!("Failed to read the last byte: {}", maybe_old_byte.unwrap_err());
                }
            } else {
                println!("The file is empty");
            }
        } else {
            println!("Failed to obtain the length of the file: {}", maybe_length.unwrap_err());
        }
        let sync_result = self.file_access.sync_all();
        match sync_result {
            Ok(_) => println!("Synchronized the file successfully"),
            Err(cause) => println!("Failed to synchronize the file because: {}", cause)
        };
    }
}

impl BrowserAccountManager {

    pub fn new(path: &Path) -> BrowserAccountManager {
        let parent_file = path.parent();
        if parent_file.is_some() {
            let dir_result = create_dir_all(parent_file.unwrap());
            if dir_result.is_err() {
                println!("Failed to create parent directories for {:?} because {}", path, dir_result.unwrap_err());
            }
        };
        let file = match OpenOptions::new().write(true).read(true).create(true).open(path) {
            Ok(result) => result,
            Err(reason) => panic!("Failed to access {:?} because {}", path, reason)
        };
        BrowserAccountManager {
            file_access: file
        }
    }

    pub fn get_password(&mut self, id: u64) -> [u8; PASS_SIZE] {
        let mut result: [u8; PASS_SIZE] = [0; PASS_SIZE];
        let read_result = self.file_access.read_at(id * (PASS_SIZE as u64), &mut result);
        match read_result {
            Ok(amount) => println!("Read {} bytes", amount),
            Err(reason) => panic!("Couldn't read password of id {} because {}", id, reason)
        };
        result
    }

    pub fn set_byte(&mut self, index: u64, value: u8) -> Result<usize, std::io::Error> {
        let write_result = self.file_access.write_at(index, &[value]);
        if write_result.is_ok() {
            match self.file_access.sync_data(){
                Ok(_) => Ok(write_result.unwrap()),
                Err(sync_cause) => Err(sync_cause)
            }
        } else {
            write_result
        }
    }

    pub fn get_byte(&mut self, index: u64) -> Result<u8, std::io::Error> {
        let mut buffer = [0];
        let result = self.file_access.read_at(index, &mut buffer);
        match result {
            Ok(_) => Ok(buffer[0]),
            Err(cause) => Err(cause)
        }
    }

    pub fn add_byte(&mut self, value: u8) -> bool {
        let maybe_length = self.length();
        if maybe_length.is_ok() {
            let length = maybe_length.unwrap();
            if length > 0 {
                match self.get_byte(length - 1) {
                    Ok(_) => println!("Successfully set position for writing"),
                    Err(cause) => println!("Failed to read the last byte: {}", cause)
                };
            } else {
                println!("The file is currently empty");
            }
        } else {
            println!("Failed to obtain the length of the file: {}", maybe_length.unwrap_err());
        }
        let result = self.file_access.write(&[value]);
        match result {
            Ok(_) => true,
            Err(_) => false
        }
    }

    pub fn length(&mut self) -> Result<u64, std::io::Error> {
        match self.file_access.metadata() {
            Ok(meta) => Ok(meta.len()),
            Err(cause) => Err(cause)
        }
    }
}