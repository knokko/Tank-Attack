use bit_helper::input::BitInput;

use crate::ServerApp;
use crate::connection::state::ConnectionState;
use crate::connection::handling::error::*;
use crate::connection::protocol::cts;
use crate::connection::protocol::stc;
use crate::connection::sending::image;

use crate::data::image::imagedata::ImageData;
use crate::data::image::image::MAX_IMAGE_NAME_LENGTH;

use std::sync::Arc;

pub fn process_image(state: &mut ConnectionState, input: &mut BitInput, app: Arc<ServerApp>, socket: Arc<ws::Sender>) -> Result<(),FatalProcessError> {
    let sub_code = input.read_i8()?;
    if sub_code == cts::image::UPLOAD {
        process_image_upload(state, input, app, socket)
    } else if sub_code == cts::image::CHANGE {
        process_image_change(state, input, app, socket)
    } else if sub_code == cts::image::GET {
        process_image_get(state, input, app, socket)
    } else if sub_code == cts::image::COPY {
        process_image_copy(state, input, app, socket)
    } else if sub_code == cts::image::IDS {
        process_image_ids(state, input, app, socket)
    } else {
        Err(dynamic_error(format!("Invalid image operation code: {}", sub_code)))
    }
}

fn process_image_upload(state: &mut ConnectionState, input: &mut BitInput, app: Arc<ServerApp>, socket: Arc<ws::Sender>) -> Result<(),FatalProcessError> {
    if state.is_logged_in() {
        let account_id = state.get_account_id();
        let maybe_name = input.read_string(10000)?;
        if maybe_name.is_some() {
            let name = maybe_name.unwrap();
            if name.len() <= MAX_IMAGE_NAME_LENGTH {
                let mut image_manager = app.image_manager.lock().unwrap();
                if image_manager.can_add_image() {
                    let width = 1 + (input.read_u8()? as usize);
                    let height = 1 + (input.read_u8()? as usize);
                    let pixel_data = input.read_u8s(4 * width * height)?;
                    let data = ImageData::from_data(pixel_data, width, height);
                    let maybe_image_id = image_manager.add_image(name, account_id, data);
                    if maybe_image_id.is_ok(){
                        image::upload::send_success(socket, maybe_image_id.unwrap())?;
                        Ok(())
                    } else {
                        image::upload::send_fail(socket, stc::image::upload::IO_ERROR)?;
                        Ok(())
                    }
                } else {
                    image::upload::send_fail(socket, stc::image::upload::MANY_TOTAL)?;
                    Ok(())
                }
            } else {
                image::upload::send_fail(socket, stc::image::upload::LONG_NAME)?;
                Ok(())
            }
        } else {
            Err(static_error("Attempted to upload an image without name"))
        }
    } else {
        Err(static_error("Attempted to upload an image without logging in"))
    }
}

fn process_image_change(state: &mut ConnectionState, input: &mut BitInput, app: Arc<ServerApp>, socket: Arc<ws::Sender>) -> Result<(),FatalProcessError> {
    if state.is_logged_in() {
        let account_id = state.get_account_id();
        let image_id = input.read_u32()?;
        let mut image_manager = app.image_manager.lock().unwrap();
        let maybe_image = image_manager.get_mut_image(image_id);
        if maybe_image.is_some() {
            let image = maybe_image.unwrap();
            if image.can_edit(account_id) {
                let width = input.read_u8()? as usize + 1;
                let height = input.read_u8()? as usize + 1;
                let pixel_data = input.read_u8s(4 * width * height)?;
                let result = image.set_data(ImageData::from_data(pixel_data, width, height));
                if result.is_ok() {
                    image::change::send_success(socket)?;
                    Ok(())
                } else {
                    image::change::send_fail(socket, stc::image::change::IO_ERROR)?;
                    Ok(())
                }
            } else {
                image::change::send_fail(socket, stc::image::change::UNAUTHORIZED)?;
                Ok(())
            }
        } else {
            image::change::send_fail(socket, stc::image::change::NO_IMAGE)?;
            Ok(())
        }
    } else {
        Err(static_error("Attempted to change an image without logging in"))
    }
}

fn process_image_get(state: &mut ConnectionState, input: &mut BitInput, app: Arc<ServerApp>, socket: Arc<ws::Sender>) -> Result<(),FatalProcessError> {
    if state.is_logged_in() {
        let account_id = state.get_account_id();
        let image_id = input.read_u32()?;
        let image_manager = app.image_manager.lock().unwrap();
        let maybe_image = image_manager.get_image(image_id);
        if maybe_image.is_some() {
            let requested_image = maybe_image.unwrap();
            if requested_image.can_read(account_id) {
                let maybe_image_data = requested_image.get_data();
                if maybe_image_data.is_ok() {
                    let image_data = maybe_image_data.unwrap();
                    image::get::send_success(socket, image_data)?;
                    Ok(())
                } else {
                    image::get::send_fail(socket, stc::image::get::IO_ERROR)?;
                    Ok(())
                }
            } else {
                image::get::send_fail(socket, stc::image::get::UNAUTHORIZED)?;
                Ok(())
            }
        } else {
            image::get::send_fail(socket, stc::image::get::NO_IMAGE)?;
            Ok(())
        }
    } else {
        Err(static_error("Attempted to request an image without logging in"))
    }
}

fn process_image_copy(state: &mut ConnectionState, input: &mut BitInput, app: Arc<ServerApp>, socket: Arc<ws::Sender>) -> Result<(),FatalProcessError> {
    if state.is_logged_in() {
        let account_id = state.get_account_id();
        let original_image_id = input.read_u32()?;
        let maybe_new_image_name = input.read_string(crate::data::image::image::MAX_IMAGE_NAME_LENGTH)?;
        if maybe_new_image_name.is_some(){
            let new_image_name = maybe_new_image_name.unwrap();
            let mut image_manager = app.image_manager.lock().unwrap();
            if image_manager.can_add_image(){
                let maybe_original_image = image_manager.get_image(original_image_id);
                if maybe_original_image.is_some() {
                    let original_image = maybe_original_image.unwrap();
                    if original_image.can_read(account_id) {
                        let maybe_original_image_data = original_image.get_data();
                        if maybe_original_image_data.is_ok(){
                            let original_image_data = maybe_original_image_data.unwrap();
                            let maybe_new_image_id = image_manager.add_image(new_image_name, account_id, original_image_data);
                            if maybe_new_image_id.is_ok() {
                                image::copy::send_success(socket, maybe_new_image_id.unwrap())?;
                                Ok(())
                            } else {
                                image::copy::send_fail(socket, stc::image::copy::IO_ERROR_WRITE)?;
                                Ok(())
                            }
                        } else {
                            image::copy::send_fail(socket, stc::image::copy::IO_ERROR_READ)?;
                            Ok(())
                        }
                    } else {
                        image::copy::send_fail(socket, stc::image::copy::UNAUTHORIZED)?;
                        Ok(())
                    }
                } else {
                    image::copy::send_fail(socket, stc::image::copy::NO_IMAGE)?;
                    Ok(())
                }
            } else {
                image::copy::send_fail(socket, stc::image::copy::MANY_TOTAL)?;
                Ok(())
            }
        } else {
            Err(static_error("No name for the new image was given"))
        }
    } else {
        Err(static_error("Attempted to copy an image without logging in"))
    }
}

fn process_image_ids(state: &mut ConnectionState, input: &mut BitInput, app: Arc<ServerApp>, socket: Arc<ws::Sender>) -> Result<(),FatalProcessError> {
    if state.is_logged_in() {
        let own_account_id = state.get_account_id();
        let owner_account_id = input.read_u32()?;
        let account_manager = app.account_manager.lock().unwrap();
        let maybe_owner_account = account_manager.get_account(owner_account_id);
        if maybe_owner_account.is_some() {
            let owner_account = maybe_owner_account.unwrap();
            let image_ids = owner_account.get_image_ids();
            let image_manager = app.image_manager.lock().unwrap();
            let mut visible_image_ids = Vec::with_capacity(image_ids.len());
            for image_id in image_ids {
                let image = image_manager.get_image(*image_id).unwrap();
                if image.can_read(own_account_id){
                    visible_image_ids.push(*image_id);
                }
            }
            image::ids::send_success(socket, visible_image_ids)?;
            Ok(())
            
        } else {
            image::ids::send_no_account(socket)?;
            Ok(())
        }
    } else {
        Err(static_error("Attempted to get image ids before logging in"))
    }
}