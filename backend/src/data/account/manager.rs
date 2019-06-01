extern crate ring;
extern crate bit_helper;

use ring::rand::SecureRandom;

use bit_helper::input::{BitInput, U8VecBitInput, BitInputError};
use bit_helper::output::{BitOutput, U8VecBitOutput};

use crate::data::account::account::{Account,PASSWORD_LENGTH};

use std::path::Path;
use std::fs::File;
use std::io::{Write,Read};

const PATH_NAME: &str = "data/accounts.bin";
const MAX_ACCOUNTS: usize = 5000;

pub struct AccountManager {

    accounts: Vec<Account>
}

impl AccountManager {

    pub fn init() -> AccountManager {
        let path = Path::new(PATH_NAME);
        if path.exists() {
            let maybe_file = File::open(path);
            if maybe_file.is_ok() {
                let metadata = path.metadata().unwrap();
                let mut file = maybe_file.unwrap();
                let mut file_content = vec![0u8; metadata.len() as usize];
                file.read_exact(&mut file_content).unwrap();
                let mut bit_input = U8VecBitInput::new(file_content);
                AccountManager::load(&mut bit_input).expect("Invalid account data file content")
            } else {
                panic!("Failed to load accounts: {}", maybe_file.unwrap_err());
            }
        } else {
            println!("Couldn't find the previous account data, so a new empty account manager will be used");
            AccountManager {
                accounts: Vec::new()
            }
        }
    }

    fn load(input: &mut BitInput) -> Result<AccountManager,BitInputError> {
        let amount = input.read_u32().unwrap();
        let mut accounts = Vec::with_capacity(amount as usize);
        for id in 0..amount {
            accounts.push(Account::load(id, input)?);
        }
        println!("Loaded the account manager with {} accounts", amount);
        Ok(AccountManager {
            accounts: accounts
        })
    }

    fn save(&self, output: &mut BitOutput){
        output.add_u32(self.accounts.len() as u32);
        for index in 0..self.accounts.len() {
            self.accounts[index].save(output);
        }
    }

    pub fn get_account(&self, id: u32) -> Option<&Account> {
        if (id as usize) < self.accounts.len() {
            Some(&self.accounts[id as usize])
        } else {
            None
        }
    }

    pub fn get_mut_account(&mut self, id: u32) -> Option<&mut Account> {
        if (id as usize) < self.accounts.len() {
            Some(&mut self.accounts[id as usize])
        } else {
            None
        }
    }

    /// Always use can_create_account before using this method to make sure another account can be added
    pub fn create_account(&mut self, random: &SecureRandom) -> Result<&Account,ring::error::Unspecified> {
        if !self.can_create_account() {
            panic!("Exceeded account limit");
        }
        let id = self.accounts.len();
        let account = Account::new(id as u32, random)?;
        self.accounts.push(account);
        Ok(&self.accounts[id])
    }

    /// Always use this method before using create_account
    pub fn can_create_account(&self) -> bool {
        self.accounts.len() < MAX_ACCOUNTS
    }

    /**
     * The number of accounts that have been created.
     */
    pub fn amount(&self) -> usize {
        self.accounts.len()
    }

    pub fn stop(&self){
        let mut output = U8VecBitOutput::with_capacity(4 + self.accounts.len() * (4 + PASSWORD_LENGTH));
        self.save(&mut output);
        output.terminate();

        let path = Path::new(PATH_NAME);
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();

        let mut file = File::create(path).unwrap();
        file.write_all(output.vector.as_slice()).unwrap();
    }
}