extern crate bit_helper;

use crate::data::image::image::{Image, ImageID};
use crate::data::image::imagedata::ImageData;
use crate::ServerApp;

use crate::data::account::account::AccountID;
use crate::data::account::manager::AccountManager;

use std::fs::File;
use std::path::Path;
use std::sync::Arc;

use std::io::{Read, Write};

use bit_helper::input::U8VecBitInput;
use bit_helper::output::{BitOutput, U8VecBitOutput};

pub const PATH_NAME: &str = "data/images.bin";

const MAX_IMAGES: usize = 10000;
const MAX_IMAGES_PER_ACCOUNT: usize = 500;

pub struct ImageManager {
    images: Vec<Image>,

    app: Option<Arc<ServerApp>>,
}

impl ImageManager {
    pub fn init(account_manager: &mut AccountManager) -> ImageManager {
        let path = Path::new(PATH_NAME);
        if path.exists() {
            let mut file = File::open(path).unwrap();

            let mut amount_buffer = [0; 4];
            file.read_exact(&mut amount_buffer).unwrap();
            let amount = bit_helper::converter::u8_array_to_u32(amount_buffer) as usize;

            let mut file_content = vec![0; amount];
            file.read_exact(&mut file_content).unwrap();
            let mut input = U8VecBitInput::new(file_content);

            let mut images = Vec::with_capacity(amount);
            let mut account_amount_buffer = vec![0; account_manager.amount()];

            for image_id in 0..amount {
                let next_image = Image::load(image_id as ImageID, &mut input).unwrap();
                account_amount_buffer[next_image.get_owner_id() as usize] += 1;
                images.push(next_image);
            }

            for account_id in 0..account_amount_buffer.len() {
                account_manager
                    .get_mut_account(account_id as u32)
                    .unwrap()
                    .reserve_image_capacity(account_amount_buffer[account_id]);
            }

            for image_id in 0..images.len() {
                account_manager
                    .get_mut_account(images[image_id].get_owner_id())
                    .unwrap()
                    .add_image_id(image_id as ImageID);
            }

            println!("Loaded an image manager with {} images", amount);

            ImageManager {
                images: images,
                app: None,
            }
        } else {
            println!(
                "Couldn't find the images data file, so a new empty image manager will be used"
            );
            ImageManager {
                images: Vec::new(),
                app: None,
            }
        }
    }

    pub fn set_app_instance(&mut self, app: Arc<ServerApp>) {
        self.app = Some(app);
    }

    pub fn stop(&self) {
        let mut output = U8VecBitOutput::with_capacity(4 + self.images.len() * 10);
        self.save(&mut output);
        output.terminate();

        let path = Path::new(PATH_NAME);
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();

        let mut file = File::create(path).unwrap();
        file.write_all(output.vector.as_slice()).unwrap();
    }

    /// Will panic if there is no account with the given owner_id
    pub fn add_image(
        &mut self,
        private: bool,
        name: String,
        owner_id: AccountID,
        data: ImageData,
    ) -> Result<AddImageResult, std::io::Error> {
        if self.images.len() >= MAX_IMAGES {
            return Ok(AddImageResult::TooManyTotal);
        }
        match &self.app {
            Some(app) => {
                let mut account_manager = app.account_manager.write().unwrap();
                let account = account_manager.get_mut_account(owner_id).unwrap();
                if account.get_image_ids().len() >= MAX_IMAGES_PER_ACCOUNT {
                    return Ok(AddImageResult::TooManyAccount);
                }
                let image_id = self.images.len() as ImageID;
                let mut image = Image::new(image_id, owner_id, private, name);
                image.set_data(data)?;
                let created_at = image.get_created_at();
                self.images.push(image);
                account.add_image_id(image_id);
                Ok(AddImageResult::SUCCESS(image_id, created_at))
            }
            None => panic!("The app instance of the image manager must not be None!"),
        }
    }

    pub fn get_image(&self, image_id: ImageID) -> Option<&Image> {
        if self.has_image(image_id) {
            Some(&self.images[image_id as usize])
        } else {
            None
        }
    }

    pub fn get_mut_image(&mut self, image_id: ImageID) -> Option<&mut Image> {
        if self.has_image(image_id) {
            Some(&mut self.images[image_id as usize])
        } else {
            None
        }
    }

    pub fn has_image(&self, image_id: ImageID) -> bool {
        (image_id as usize) < self.images.len()
    }

    fn save(&self, output: &mut BitOutput) {
        output.add_u32(self.images.len() as u32);
        for index in 0..self.images.len() {
            self.images[index].save(output);
        }
    }
}

pub enum AddImageResult {
    SUCCESS(ImageID, u64),
    TooManyTotal,
    TooManyAccount,
}
