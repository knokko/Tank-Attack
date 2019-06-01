pub const MAX_WIDTH: usize = 256;
pub const MAX_HEIGHT: usize = 256;

pub struct ImageData {

    width: usize,
    height: usize,

    pixel_data: Vec<u8>
}

use bit_helper::output::BitOutput;
use bit_helper::input::{BitInput,BitInputError};

impl ImageData {

    pub fn from_data(pixel_data: Vec<u8>, width: usize, height: usize) -> ImageData {
        if pixel_data.len() == (4 * width * height) as usize {
            ImageData {
                width: width,
                height: height,
                pixel_data: pixel_data
            }
        } else {
            panic!("The length of the pixel data should be {}, but it is {}", (4 * width * height), pixel_data.len());
        }
    }

    pub fn from_bits(input: &mut BitInput) -> Result<ImageData,BitInputError> {
        input.ensure_extra_capacity(16)?;
        let width = input.read_direct_u8() as usize + 1;
        let height = input.read_direct_u8() as usize + 1;
        let pixels = input.read_u8s(4 * width * height)?;
        Ok(ImageData::from_data(pixels, width, height))
    }

    pub fn to_bits(&self, output: &mut BitOutput) {
        output.ensure_extra_capacity(2 * 8 + 32 * self.width * self.height);
        output.add_direct_u8((self.width - 1) as u8);
        output.add_direct_u8((self.height - 1) as u8);
        output.add_direct_u8s_from_vec(&self.pixel_data);
    }

    pub fn get_width(&self) -> usize {
        self.width
    }

    pub fn get_height(&self) -> usize {
        self.height
    }

    pub fn get_pixel_data(&self) -> &Vec<u8> {
        &self.pixel_data
    }
}