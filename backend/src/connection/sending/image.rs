pub mod upload {

    use std::sync::Arc;
    use crate::connection::sending::send;
    use crate::connection::protocol::stc::image::upload;
    use crate::data::image::image::ImageID;

    use bit_helper::output::{BitOutput, U8VecBitOutput};

    pub fn send_success(socket: Arc<ws::Sender>, image_id: ImageID) -> Result<(),ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(6);
        output.add_bool(true);
        output.add_sized_u64(upload::SUCCESS as u64, upload::CODE_BITS);
        output.add_var_u64(image_id as u64);
        send(socket, output.vector)
    }

    pub fn send_fail(socket: Arc<ws::Sender>, error_code: u8) -> Result<(),ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(1);
        output.add_bool(true);
        output.add_sized_u64(error_code as u64, upload::CODE_BITS);
        send(socket, output.vector)
    }
}

pub mod change {

    use std::sync::Arc;
    use crate::connection::sending::send;
    use crate::connection::protocol::stc::image::change;

    use bit_helper::output::{BitOutput,U8VecBitOutput};

    pub fn send_success(socket: Arc<ws::Sender>) -> Result<(),ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(1);
        output.add_bool(true);
        output.add_sized_u64(change::SUCCESS as u64, change::CODE_BITS);
        send(socket, output.vector)
    }

    pub fn send_fail(socket: Arc<ws::Sender>, error_code: u8) -> Result<(),ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(1);
        output.add_bool(true);
        output.add_sized_u64(error_code as u64, change::CODE_BITS);
        send(socket, output.vector)
    }
}

pub mod get {

    use std::sync::Arc;
    use crate::connection::sending::send;
    use crate::connection::protocol::stc::image::get;
    use crate::data::image::imagedata::ImageData;

    use bit_helper::output::{BitOutput,U8VecBitOutput};

    pub fn send_success(socket: Arc<ws::Sender>, pixels: ImageData) -> Result<(),ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(1 + 4 * pixels.get_width() * pixels.get_height());
        output.add_bool(true);
        output.add_sized_u64(get::SUCCESS as u64, get::CODE_BITS);

        // Make sure we can write full bytes once we reach pixels.to_bits
        output.add_bools_from_vec(&vec![false; 7 - get::CODE_BITS]);
        pixels.to_bits(&mut output);
        send(socket, output.vector)
    }

    pub fn send_fail(socket: Arc<ws::Sender>, error_code: u8) -> Result<(),ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(1);
        output.add_bool(true);
        output.add_sized_u64(error_code as u64, get::CODE_BITS);
        send(socket, output.vector)
    }
}

pub mod copy {

    use std::sync::Arc;
    use crate::connection::sending::send;
    use crate::connection::protocol::stc::image::copy;
    use crate::data::image::image::ImageID;
    use bit_helper::output::{BitOutput,U8VecBitOutput};

    pub fn send_success(socket: Arc<ws::Sender>, id: ImageID) -> Result<(),ws::Error> {
        let mut output = U8VecBitOutput::with_capacity(4);
        output.add_bool(true);
        output.add_sized_u64(copy::SUCCESS as u64, copy::CODE_BITS);
        output.add_var_u64(id as u64);
        send(socket, output.vector)
    }

    pub fn send_fail(socket: Arc<ws::Sender>, error_code: u8) -> Result<(),ws::Error> {
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