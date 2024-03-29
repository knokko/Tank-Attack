use super::broadcast_except;

use crate::connection::protocol::stc;
use crate::connection::state::ConnectionState;
use crate::data::image::image::ImageID;
use crate::data::account::account::AccountID;
use crate::ServerApp;

use bit_helper::output::{BitOutput, U8VecBitOutput};
use std::sync::Arc;

pub fn broadcast_changed_pixels(app: Arc<ServerApp>, image_id: ImageID, state: &ConnectionState) {
    let mut output = U8VecBitOutput::with_capacity(3);
    output.add_bool(false);
    output.add_sized_u64(stc::IMAGE, stc::CODE_BITS);
    output.add_sized_u64(stc::image::IMAGE_CHANGE, stc::image::CODE_BITS);
    output.add_var_u64(image_id as u64);
    broadcast_except(app, state.websocket_index, output.vector);
}

pub fn broadcast_changed_meta(app: Arc<ServerApp>, image_id: ImageID, state: &ConnectionState) {
    let mut output = U8VecBitOutput::with_capacity(3);
    output.add_bool(false);
    output.add_sized_u64(stc::IMAGE, stc::CODE_BITS);
    output.add_sized_u64(stc::image::IMAGE_META_CHANGE, stc::image::CODE_BITS);
    output.add_var_u64(image_id as u64);
    broadcast_except(app, state.websocket_index, output.vector);
}

pub fn broadcast_created_image(app: Arc<ServerApp>, owner_id: AccountID, image_id: ImageID, state: &ConnectionState){
    let mut output = U8VecBitOutput::with_capacity(5);
    output.add_bool(false);
    output.add_sized_u64(stc::IMAGE, stc::CODE_BITS);
    output.add_sized_u64(stc::image::IMAGE_CREATE, stc::image::CODE_BITS);
    output.add_var_u64(image_id as u64);
    output.add_var_u64(owner_id as u64);
    broadcast_except(app, state.websocket_index, output.vector);
}

pub mod upload {

    use crate::connection::protocol::stc::image::upload;
    use crate::connection::sending::send;
    use crate::data::image::image::ImageID;
    use std::sync::Arc;

    use bit_helper::output::{BitOutput, U8VecBitOutput};

    pub fn send_success(
        socket: Arc<ws::Sender>,
        image_id: ImageID,
        created_at: u64,
    ) -> Result<(), ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(6);
        output.add_bool(true);
        output.add_sized_u64(upload::SUCCESS as u64, upload::CODE_BITS);
        output.add_var_u64(image_id as u64);
        output.add_var_u64(created_at);
        send(socket, output.vector)
    }

    pub fn send_fail(
        socket: Arc<ws::Sender>,
        error_code: upload::CodeType,
    ) -> Result<(), ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(1);
        output.add_bool(true);
        output.add_sized_u64(error_code as u64, upload::CODE_BITS);
        send(socket, output.vector)
    }
}

pub mod change_pixels {

    use crate::connection::protocol::stc::image::change_pixels;
    use crate::connection::sending::send;
    use std::sync::Arc;

    use bit_helper::output::{BitOutput, U8VecBitOutput};

    pub fn send_success(socket: Arc<ws::Sender>, new_last_modified: u64) -> Result<(), ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(8);
        output.add_bool(true);
        output.add_sized_u64(change_pixels::SUCCESS as u64, change_pixels::CODE_BITS);
        output.add_var_u64(new_last_modified);
        send(socket, output.vector)
    }

    pub fn send_fail(
        socket: Arc<ws::Sender>,
        error_code: change_pixels::CodeType,
    ) -> Result<(), ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(1);
        output.add_bool(true);
        output.add_sized_u64(error_code as u64, change_pixels::CODE_BITS);
        send(socket, output.vector)
    }
}

pub mod get_pixels {

    use crate::connection::protocol::stc::image::get_pixels;
    use crate::connection::sending::send;
    use crate::data::image::imagedata::ImageData;
    use std::sync::Arc;

    use bit_helper::output::{BitOutput, U8VecBitOutput};

    pub fn send_success(socket: Arc<ws::Sender>, pixels: ImageData) -> Result<(), ws::Error> {
        let mut output =
            U8VecBitOutput::with_capacity(1 + 4 * pixels.get_width() * pixels.get_height());
        output.add_bool(true);
        output.add_sized_u64(get_pixels::SUCCESS as u64, get_pixels::CODE_BITS);
        pixels.to_bits(&mut output);
        send(socket, output.vector)
    }

    pub fn send_fail(
        socket: Arc<ws::Sender>,
        error_code: get_pixels::CodeType,
    ) -> Result<(), ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(1);
        output.add_bool(true);
        output.add_sized_u64(error_code as u64, get_pixels::CODE_BITS);
        send(socket, output.vector)
    }
}

pub mod change_meta {

    use crate::connection::protocol::stc::image::change_meta;
    use crate::connection::sending::send;
    use std::sync::Arc;

    use bit_helper::output::{BitOutput, U8VecBitOutput};

    pub fn send_success(socket: Arc<ws::Sender>) -> Result<(), ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(1);
        output.add_bool(true);
        output.add_sized_u64(change_meta::SUCCESS as u64, change_meta::CODE_BITS);
        send(socket, output.vector)
    }

    pub fn send_fail(
        socket: Arc<ws::Sender>,
        error_code: change_meta::CodeType,
    ) -> Result<(), ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(1);
        output.add_bool(true);
        output.add_sized_u64(error_code as u64, change_meta::CODE_BITS);
        send(socket, output.vector)
    }
}

pub mod get_meta {

    use crate::connection::protocol::stc::image::get_meta;
    use crate::connection::sending::send;
    use std::sync::Arc;

    use bit_helper::output::{BitOutput, U8VecBitOutput};

    pub fn send_success(
        socket: Arc<ws::Sender>,
        private: bool,
        name: &String,
        created_at: u64,
        last_modified: u64,
    ) -> Result<(), ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(30);
        output.add_bool(true);
        output.add_sized_u64(get_meta::SUCCESS as u64, get_meta::CODE_BITS);
        output.add_bool(private);
        output.add_string(Some(name));
        output.add_var_u64(created_at);
        output.add_var_u64(last_modified);
        send(socket, output.vector)
    }

    pub fn send_fail(
        socket: Arc<ws::Sender>,
        error_code: get_meta::CodeType,
    ) -> Result<(), ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(1);
        output.add_bool(true);
        output.add_sized_u64(error_code as u64, get_meta::CODE_BITS);
        send(socket, output.vector)
    }
}

pub mod copy {

    use crate::connection::protocol::stc::image::copy;
    use crate::connection::sending::send;
    use crate::data::image::image::ImageID;
    use bit_helper::output::{BitOutput, U8VecBitOutput};
    use std::sync::Arc;

    pub fn send_success(
        socket: Arc<ws::Sender>,
        id: ImageID,
        created_at: u64,
    ) -> Result<(), ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(4);
        output.add_bool(true);
        output.add_sized_u64(copy::SUCCESS as u64, copy::CODE_BITS);
        output.add_var_u64(id as u64);
        output.add_var_u64(created_at);
        send(socket, output.vector)
    }

    pub fn send_fail(socket: Arc<ws::Sender>, error_code: copy::CodeType) -> Result<(), ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(1);
        output.add_bool(true);
        output.add_sized_u64(error_code as u64, copy::CODE_BITS);
        send(socket, output.vector)
    }
}

pub mod ids {

    use crate::connection::protocol::stc::image::ids;
    use crate::connection::sending::send;
    use crate::data::image::image::ImageID;
    use bit_helper::output::{BitOutput, U8VecBitOutput};
    use std::sync::Arc;

    pub fn send_success(socket: Arc<ws::Sender>, image_ids: Vec<ImageID>) -> Result<(), ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(1 + 2 * image_ids.len());
        output.add_bool(true);
        output.add_sized_u64(ids::SUCCESS as u64, ids::CODE_BITS);
        output.add_var_u64(image_ids.len() as u64);
        for image_id in image_ids {
            output.add_var_u64(image_id as u64);
        }
        send(socket, output.vector)
    }

    pub fn send_no_account(socket: Arc<ws::Sender>) -> Result<(), ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(1);
        output.add_bool(true);
        output.add_sized_u64(ids::NO_ACCOUNT as u64, ids::CODE_BITS);
        send(socket, output.vector)
    }
}
