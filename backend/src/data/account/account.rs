extern crate ring;
extern crate bit_helper;

use ring::rand::SecureRandom;
use bit_helper::output::BitOutput;
use bit_helper::input::{BitInput,BitInputError};

use crate::data::image::image::ImageID;

pub const PASSWORD_LENGTH: usize = 64;
pub const MAX_DISPLAY_NAME_LENGTH: usize = 50;

pub type AccountID = u32;

pub struct Account {

    id: AccountID,
    password: [u8; PASSWORD_LENGTH],

    display_name: Option<String>,
    images: Vec<ImageID>,

    logged_in: bool
}

impl Account {

    pub fn new(id: AccountID, random: &SecureRandom) -> Result<Account,ring::error::Unspecified> {
        let mut password = [0u8; PASSWORD_LENGTH];
        random.fill(&mut password)?;
        Ok(Account {
            id: id,
            password: password,

            display_name: None,
            images: Vec::new(),

            logged_in: false
        })
    }

    pub fn load(id: AccountID, input: &mut BitInput) -> Result<Account,BitInputError> {
        let mut password = [0u8; PASSWORD_LENGTH];
        input.read_u8s_to_slice(&mut password, 0, PASSWORD_LENGTH)?;
        let display_name = input.read_string(MAX_DISPLAY_NAME_LENGTH)?;
        Ok(Account {
            id: id,
            password: password,
            display_name: display_name,

            // The images will be added during the load of the image manager
            images: Vec::new(),

            logged_in: false
        })
    }

    pub fn save(&self, output: &mut BitOutput){
        output.add_u8s_from_slice(&self.password);
        output.add_string(self.display_name.as_ref());

        // The images will be saved by the image manager
    }

    pub fn reserve_image_capacity(&mut self, capacity: usize){
        self.images.reserve_exact(capacity);
    }

    pub fn add_image_id(&mut self, image_id: ImageID){
        self.images.push(image_id);
    }

    pub fn get_image_ids(&self) -> &Vec<ImageID> {
        &self.images
    }

    pub fn is_logged_in(&self) -> bool {
        self.logged_in
    }

    /// This method will mark this account as logged in. It will panic if this account is already marked as logged in.
    /// 
    /// It must ONLY be called from within the connection::state module!
    pub fn set_logged_in(&mut self){
        assert!(!self.logged_in);
        self.logged_in = true;
    }

    /// This method will mark this account as logged out. It will panic if this account is not marked as logged in.
    /// 
    /// It must ONLY be called from within the connection::state module!
    pub fn set_logged_out(&mut self){
        assert!(self.logged_in);
        self.logged_in = false;
    }

    pub fn equals_password(&self, given: Vec<u8>) -> bool {
        self.password.eq(&given[0..PASSWORD_LENGTH])
    }

    pub fn get_id(&self) -> AccountID {
        self.id
    }

    pub fn get_password(&self) -> &[u8; PASSWORD_LENGTH] {
        &self.password
    }
}

impl std::fmt::Debug for Account {

    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "Account {}", self.id)
    }

}