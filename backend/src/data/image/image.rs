extern crate bit_helper;

use std::path::Path;
use std::io::{Read,Write,Error};
use std::fs::File;

use crate::data::image::imagedata::ImageData;
use crate::data::account::account::AccountID;

use bit_helper::output::BitOutput;
use bit_helper::input::{BitInput,BitInputError};

pub const MAX_IMAGE_NAME_LENGTH: usize = 40;

pub type ImageID = u32;

pub struct Image {

    id: ImageID,
    owner_id: AccountID,

    name: Box<String>
}

impl Image {

    pub fn new(image_id: ImageID, owner_id: AccountID, name: String) -> Image {
        Image {
            id: image_id,
            owner_id: owner_id,
            name: Box::new(name)
        }
    }

    pub fn load(image_id: ImageID, input: &mut BitInput) -> Result<Image,BitInputError> {
        Ok(Image {
            id: image_id,
            owner_id: input.read_u32()?,
            name: Box::new(input.read_string(MAX_IMAGE_NAME_LENGTH)?.unwrap())
        })
    }

    fn get_path(&self) -> String {
        format!("data/images/image{}.png", self.id)
    }

    pub fn get_data(&self) -> Result<ImageData, Error> {
        let path_name = self.get_path();
        let path = Path::new(&path_name);
        let mut file = File::open(path)?;

        let mut size_data = vec![0; 2];
        file.read_exact(&mut size_data)?;

        // The maximum width and height of images is 256 and the minimum width and height is 1
        // So this covers the entire range perfectly
        let width = size_data[0] as usize + 1;
        let height = size_data[1] as usize + 1;

        let required_size = 4 * width * height;
        let mut pixel_data = vec![0; required_size];
        file.read_exact(&mut pixel_data)?;
        return Ok(ImageData::from_data(pixel_data, width, height));
    }

    pub fn set_data(&mut self, data: ImageData) -> Result<(), Error> {
        let path_name = self.get_path();
        let path = Path::new(&path_name);
        std::fs::create_dir_all(path.parent().unwrap())?;
        let mut file = File::create(path)?;
        file.write_all(&[(data.get_width() - 1) as u8, data.get_height() as u8])?;
        file.write_all(data.get_pixel_data())?;

        Ok(())
    }

    pub fn save(&self, output: &mut BitOutput){
        output.add_u32(self.owner_id);
        output.add_string(Some(self.name.as_ref()));
    }

    pub fn get_id(&self) -> ImageID {
        self.id
    }

    pub fn get_owner_id(&self) -> AccountID {
        self.owner_id
    }

    pub fn can_edit(&self, account_id: AccountID) -> bool {
        self.owner_id == account_id
    }

    pub fn can_read(&self, account_id: AccountID) -> bool {
        true
    }
}