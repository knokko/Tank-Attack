use bit_helper::input::BitInput;

use crate::connection::handling::error::*;
use crate::connection::protocol::cts;
use crate::connection::protocol::stc;
use crate::connection::sending::image;
use crate::connection::state::ConnectionState;
use crate::ServerApp;

use crate::data::image::image::{ImageID, MAX_IMAGE_NAME_LENGTH};
use crate::data::image::imagedata::ImageData;
use crate::data::image::manager::AddImageResult::*;

use std::sync::Arc;

pub fn process_image(
    state: &mut ConnectionState,
    input: &mut BitInput,
    app: Arc<ServerApp>,
    socket: Arc<ws::Sender>,
) -> Result<(), FatalProcessError> {
    let sub_code = input.read_sized_u64(cts::image::CODE_BITS)?;
    if sub_code == cts::image::UPLOAD {
        process_image_upload(state, input, app, socket)
    } else if sub_code == cts::image::CHANGE_PIXELS {
        process_image_change_pixels(state, input, app, socket)
    } else if sub_code == cts::image::GET_PIXELS {
        process_image_get_pixels(state, input, app, socket)
    } else if sub_code == cts::image::CHANGE_META {
        process_image_change_meta(state, input, app, socket)
    } else if sub_code == cts::image::GET_META {
        process_image_get_meta(state, input, app, socket)
    } else if sub_code == cts::image::COPY {
        process_image_copy(state, input, app, socket)
    } else if sub_code == cts::image::IDS {
        process_image_ids(state, input, app, socket)
    } else {
        Err(dynamic_error(format!(
            "Invalid image operation code: {}",
            sub_code
        )))
    }
}

fn process_image_upload(
    state: &mut ConnectionState,
    input: &mut BitInput,
    app: Arc<ServerApp>,
    socket: Arc<ws::Sender>,
) -> Result<(), FatalProcessError> {
    if state.is_logged_in() {
        let account_id = state.get_account_id();
        let private = input.read_bool()?;
        let maybe_name = input.read_string(10000)?;
        if maybe_name.is_some() {
            let name = maybe_name.unwrap();
            if name.len() <= MAX_IMAGE_NAME_LENGTH {
                let data = ImageData::from_bits(input)?;
                let mut image_manager = app.image_manager.write().unwrap();
                let image_add_result = image_manager.add_image(private, name, account_id, data);
                if image_add_result.is_ok() {
                    let image_add_enum_result = image_add_result.unwrap();
                    match image_add_enum_result {
                        SUCCESS(image_id, created_at) => {
                            image::broadcast_created_image(Arc::clone(&app), account_id, image_id, state);
                            image::upload::send_success(socket, image_id, created_at)?;
                            Ok(())
                        }
                        TooManyTotal => {
                            image::upload::send_fail(socket, stc::image::upload::MANY_TOTAL)?;
                            Ok(())
                        }
                        TooManyAccount => {
                            image::upload::send_fail(socket, stc::image::upload::MANY_YOU)?;
                            Ok(())
                        }
                    }
                } else {
                    image::upload::send_fail(socket, stc::image::upload::IO_ERROR)?;
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
        Err(static_error(
            "Attempted to upload an image without logging in",
        ))
    }
}

fn process_image_change_pixels(
    state: &mut ConnectionState,
    input: &mut BitInput,
    app: Arc<ServerApp>,
    socket: Arc<ws::Sender>,
) -> Result<(), FatalProcessError> {
    if state.is_logged_in() {
        let account_id = state.get_account_id();
        let image_id = input.read_var_u64()?;
        let mut image_manager = app.image_manager.write().unwrap();
        let maybe_image = image_manager.get_mut_image(image_id as u32);
        if maybe_image.is_some() {
            let image = maybe_image.unwrap();
            if image.can_edit(account_id) {
                let result = image.set_data(ImageData::from_bits(input)?);
                if result.is_ok() {
                    image::change_pixels::send_success(socket)?;
                    image::broadcast_changed_pixels(Arc::clone(&app), image_id as ImageID, state);
                    Ok(())
                } else {
                    image::change_pixels::send_fail(socket, stc::image::change_pixels::IO_ERROR)?;
                    Ok(())
                }
            } else {
                image::change_pixels::send_fail(socket, stc::image::change_pixels::UNAUTHORIZED)?;
                Ok(())
            }
        } else {
            image::change_pixels::send_fail(socket, stc::image::change_pixels::NO_IMAGE)?;
            Ok(())
        }
    } else {
        Err(static_error(
            "Attempted to change an image without logging in",
        ))
    }
}

fn process_image_get_pixels(
    state: &mut ConnectionState,
    input: &mut BitInput,
    app: Arc<ServerApp>,
    socket: Arc<ws::Sender>,
) -> Result<(), FatalProcessError> {
    if state.is_logged_in() {
        let account_id = state.get_account_id();
        let image_id = input.read_var_u64()?;
        let image_manager = app.image_manager.read().unwrap();
        let maybe_image = image_manager.get_image(image_id as u32);
        if maybe_image.is_some() {
            let requested_image = maybe_image.unwrap();
            if requested_image.can_read(account_id) {
                let maybe_image_data = requested_image.get_data();
                if maybe_image_data.is_ok() {
                    let image_data = maybe_image_data.unwrap();
                    image::get_pixels::send_success(socket, image_data)?;
                    Ok(())
                } else {
                    image::get_pixels::send_fail(socket, stc::image::get_pixels::IO_ERROR)?;
                    Ok(())
                }
            } else {
                image::get_pixels::send_fail(socket, stc::image::get_pixels::UNAUTHORIZED)?;
                Ok(())
            }
        } else {
            image::get_pixels::send_fail(socket, stc::image::get_pixels::NO_IMAGE)?;
            Ok(())
        }
    } else {
        Err(static_error(
            "Attempted to request an image without logging in",
        ))
    }
}

fn process_image_change_meta(
    state: &mut ConnectionState,
    input: &mut BitInput,
    app: Arc<ServerApp>,
    socket: Arc<ws::Sender>,
) -> Result<(), FatalProcessError> {
    if state.is_logged_in() {
        let account_id = state.get_account_id();
        let image_id = input.read_var_u64()?;
        let mut image_manager = app.image_manager.write().unwrap();
        let maybe_image = image_manager.get_mut_image(image_id as u32);
        if maybe_image.is_some() {
            let image = maybe_image.unwrap();
            if image.can_edit(account_id) {
                let new_private = input.read_bool()?;
                let maybe_new_name = input.read_string(10000)?;
                if maybe_new_name.is_some() {
                    image.set_private(new_private);
                    image.set_name(maybe_new_name.unwrap());
                    image::broadcast_changed_meta(Arc::clone(&app), image_id as ImageID, state);
                    image::change_meta::send_success(socket)?;
                    Ok(())
                } else {
                    Err(static_error("Attempted to change an image name to null"))
                }
            } else {
                image::change_meta::send_fail(socket, stc::image::change_meta::UNAUTHORIZED)?;
                Ok(())
            }
        } else {
            image::change_meta::send_fail(socket, stc::image::change_meta::NO_IMAGE)?;
            Ok(())
        }
    } else {
        Err(static_error(
            "Attempted to change image metadata without logging in",
        ))
    }
}

fn process_image_get_meta(
    state: &mut ConnectionState,
    input: &mut BitInput,
    app: Arc<ServerApp>,
    socket: Arc<ws::Sender>,
) -> Result<(), FatalProcessError> {
    if state.is_logged_in() {
        let account_id = state.get_account_id();
        let image_id = input.read_var_u64()?;
        let image_manager = app.image_manager.read().unwrap();
        let maybe_image = image_manager.get_image(image_id as u32);
        if maybe_image.is_some() {
            let requested_image = maybe_image.unwrap();
            if requested_image.can_read(account_id) {
                let private = requested_image.get_private();
                let name = requested_image.get_name();
                let created_at = requested_image.get_created_at();
                let last_modified = requested_image.get_last_modified();
                image::get_meta::send_success(socket, private, name, created_at, last_modified)?;
                Ok(())
            } else {
                image::get_meta::send_fail(socket, stc::image::get_meta::UNAUTHORIZED)?;
                Ok(())
            }
        } else {
            image::get_meta::send_fail(socket, stc::image::get_meta::NO_IMAGE)?;
            Ok(())
        }
    } else {
        Err(static_error(
            "Attempted to request image metadata without logging in",
        ))
    }
}

fn process_image_copy(
    state: &mut ConnectionState,
    input: &mut BitInput,
    app: Arc<ServerApp>,
    socket: Arc<ws::Sender>,
) -> Result<(), FatalProcessError> {
    if state.is_logged_in() {
        let account_id = state.get_account_id();
        let original_image_id = input.read_var_u64()?;
        let new_private = input.read_bool()?;
        let maybe_new_image_name =
            input.read_string(crate::data::image::image::MAX_IMAGE_NAME_LENGTH)?;
        if maybe_new_image_name.is_some() {
            let new_image_name = maybe_new_image_name.unwrap();
            let mut image_manager = app.image_manager.write().unwrap();

            let maybe_original_image = image_manager.get_image(original_image_id as u32);
            if maybe_original_image.is_some() {
                let original_image = maybe_original_image.unwrap();
                if original_image.can_read(account_id) {
                    let maybe_original_image_data = original_image.get_data();
                    if maybe_original_image_data.is_ok() {
                        let original_image_data = maybe_original_image_data.unwrap();
                        let image_add_result = image_manager.add_image(
                            new_private,
                            new_image_name,
                            account_id,
                            original_image_data,
                        );
                        if image_add_result.is_ok() {
                            let enum_add_result = image_add_result.unwrap();
                            match enum_add_result {
                                SUCCESS(image_id, created_at) => {
                                    image::broadcast_created_image(Arc::clone(&app), account_id, image_id, state);
                                    image::copy::send_success(socket, image_id, created_at)?;
                                    Ok(())
                                }
                                TooManyTotal => {
                                    image::copy::send_fail(socket, stc::image::copy::MANY_TOTAL)?;
                                    Ok(())
                                }
                                TooManyAccount => {
                                    image::copy::send_fail(socket, stc::image::copy::MANY_YOU)?;
                                    Ok(())
                                }
                            }
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
            Err(static_error("No name for the new image was given"))
        }
    } else {
        Err(static_error(
            "Attempted to copy an image without logging in",
        ))
    }
}

fn process_image_ids(
    state: &mut ConnectionState,
    input: &mut BitInput,
    app: Arc<ServerApp>,
    socket: Arc<ws::Sender>,
) -> Result<(), FatalProcessError> {
    if state.is_logged_in() {
        let own_account_id = state.get_account_id();
        let owner_account_id = input.read_var_u64()? as u32;
        let account_manager = app.account_manager.read().unwrap();
        let maybe_owner_account = account_manager.get_account(owner_account_id);
        if maybe_owner_account.is_some() {
            let owner_account = maybe_owner_account.unwrap();
            let image_ids = owner_account.get_image_ids();
            let image_manager = app.image_manager.read().unwrap();
            let mut visible_image_ids = Vec::with_capacity(image_ids.len());
            for image_id in image_ids {
                let image = image_manager.get_image(*image_id).unwrap();
                if image.can_read(own_account_id) {
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
