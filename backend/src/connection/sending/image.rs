use super::broadcast;

use crate::ServerApp;
use crate::connection::protocol::stc;
use crate::data::image::image::ImageID;

use std::sync::Arc;
use bit_helper::output::{BitOutput, U8VecBitOutput};

pub fn broadcast_changed_pixels(app: Arc<ServerApp>, image_id: ImageID){
    let mut output = U8VecBitOutput::with_capacity(3);
    output.add_bool(false);
    output.add_sized_u64(stc::IMAGE, stc::CODE_BITS);
    output.add_sized_u64(stc::image::IMAGE_CHANGE, stc::image::CODE_BITS);
    output.add_var_u64(image_id as u64);
    broadcast(app, output.vector);
}

pub mod upload {

    use std::sync::Arc;
    use crate::connection::sending::send;
    use crate::connection::protocol::stc::image::upload;
    use crate::data::image::image::ImageID;

    use bit_helper::output::{BitOutput, U8VecBitOutput};

    pub fn send_success(socket: Arc<ws::Sender>, image_id: ImageID, created_at: u64) -> Result<(),ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(6);
        output.add_bool(true);
        output.add_sized_u64(upload::SUCCESS as u64, upload::CODE_BITS);
        output.add_var_u64(image_id as u64);
        output.add_var_u64(created_at);
        send(socket, output.vector)
    }

    pub fn send_fail(socket: Arc<ws::Sender>, error_code: upload::CodeType) -> Result<(),ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(1);
        output.add_bool(true);
        output.add_sized_u64(error_code as u64, upload::CODE_BITS);
        send(socket, output.vector)
    }
}

pub mod change_pixels {

    use std::sync::Arc;
    use crate::connection::sending::send;
    use crate::connection::protocol::stc::image::change_pixels;

    use bit_helper::output::{BitOutput,U8VecBitOutput};

    pub fn send_success(socket: Arc<ws::Sender>) -> Result<(),ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(1);
        output.add_bool(true);
        output.add_sized_u64(change_pixels::SUCCESS as u64, change_pixels::CODE_BITS);
        send(socket, output.vector)
    }

    pub fn send_fail(socket: Arc<ws::Sender>, error_code: change_pixels::CodeType) -> Result<(),ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(1);
        output.add_bool(true);
        output.add_sized_u64(error_code as u64, change_pixels::CODE_BITS);
        send(socket, output.vector)
    }
}

pub mod get_pixels {

    use std::sync::Arc;
    use crate::connection::sending::send;
    use crate::connection::protocol::stc::image::get_pixels;
    use crate::data::image::imagedata::ImageData;

    use bit_helper::output::{BitOutput,U8VecBitOutput};

    pub fn send_success(socket: Arc<ws::Sender>, pixels: ImageData) -> Result<(),ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(1 + 4 * pixels.get_width() * pixels.get_height());
        output.add_bool(true);
        output.add_sized_u64(get_pixels::SUCCESS as u64, get_pixels::CODE_BITS);
        pixels.to_bits(&mut output);
        send(socket, output.vector)
    }

    pub fn send_fail(socket: Arc<ws::Sender>, error_code: get_pixels::CodeType) -> Result<(),ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(1);
        output.add_bool(true);
        output.add_sized_u64(error_code as u64, get_pixels::CODE_BITS);
        send(socket, output.vector)
    }
}

pub mod change_meta {

    use std::sync::Arc;
    use crate::connection::sending::send;
    use crate::connection::protocol::stc::image::change_meta;

    use bit_helper::output::{BitOutput,U8VecBitOutput};

    pub fn send_success(socket: Arc<ws::Sender>) -> Result<(),ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(1);
        output.add_bool(true);
        output.add_sized_u64(change_meta::SUCCESS as u64, change_meta::CODE_BITS);
        send(socket, output.vector)
    }

    pub fn send_fail(socket: Arc<ws::Sender>, error_code: change_meta::CodeType) -> Result<(),ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(1);
        output.add_bool(true);
        output.add_sized_u64(error_code as u64, change_meta::CODE_BITS);
        send(socket, output.vector)
    }
}

pub mod get_meta {

    use std::sync::Arc;
    use crate::connection::sending::send;
    use crate::connection::protocol::stc::image::get_meta;

    use bit_helper::output::{BitOutput,U8VecBitOutput};

    pub fn send_success(socket: Arc<ws::Sender>, private: bool, name: &String, created_at: u64, last_modified: u64) -> Result<(),ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(30);
        output.add_bool(true);
        output.add_sized_u64(get_meta::SUCCESS as u64, get_meta::CODE_BITS);
        output.add_bool(private);
        output.add_string(Some(name));
        output.add_var_u64(created_at);
        output.add_var_u64(last_modified);
        send(socket, output.vector)
    }

    pub fn send_fail(socket: Arc<ws::Sender>, error_code: get_meta::CodeType) -> Result<(),ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(1);
        output.add_bool(true);
        output.add_sized_u64(error_code as u64, get_meta::CODE_BITS);
        send(socket, output.vector)
    }
}

pub mod copy {

    use std::sync::Arc;
    use crate::connection::sending::send;
    use crate::connection::protocol::stc::image::copy;
    use crate::data::image::image::ImageID;
    use bit_helper::output::{BitOutput,U8VecBitOutput};

    pub fn send_success(socket: Arc<ws::Sender>, id: ImageID, created_at: u64) -> Result<(),ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(4);
        output.add_bool(true);
        output.add_sized_u64(copy::SUCCESS as u64, copy::CODE_BITS);
        output.add_var_u64(id as u64);
        output.add_var_u64(created_at);
        send(socket, output.vector)
    }

    pub fn send_fail(socket: Arc<ws::Sender>, error_code: copy::CodeType) -> Result<(),ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(1);
        output.add_bool(true);
        output.add_sized_u64(error_code as u64, copy::CODE_BITS);
        send(socket, output.vector)
    }
}

pub mod ids {

    use std::sync::Arc;
    use crate::connection::sending::send;
    use crate::connection::protocol::stc::image::ids;
    use crate::data::image::image::ImageID;
    use bit_helper::output::{BitOutput,U8VecBitOutput};

    pub fn send_success(socket: Arc<ws::Sender>, image_ids: Vec<ImageID>) -> Result<(),ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(1 + 2 * image_ids.len());
        output.add_bool(true);
        output.add_sized_u64(ids::SUCCESS as u64, ids::CODE_BITS);
        output.add_var_u64(image_ids.len() as u64);
        for image_id in image_ids {
            output.add_var_u64(image_id as u64);
        }
        send(socket, output.vector)
    }

    pub fn send_no_account(socket: Arc<ws::Sender>) -> Result<(),ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(1);
        output.add_bool(true);
        output.add_sized_u64(ids::NO_ACCOUNT as u64, ids::CODE_BITS);
        send(socket, output.vector)
    }
}