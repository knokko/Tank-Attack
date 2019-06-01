pub mod upload {

    pub const SUCCESS: u8 = 0;
    pub const IO_ERROR: u8 = 1;
    pub const LONG_NAME: u8 = 2;
    pub const MANY_TOTAL: u8 = 3;
    pub const MANY_YOU: u8 = 4;

    pub const CODE_BITS: usize = 3;
}

pub mod change {

    pub const SUCCESS: u8 = 0;
    pub const IO_ERROR: u8 = 1;
    pub const UNAUTHORIZED: u8 = 2;
    pub const NO_IMAGE: u8 = 3;

    pub const CODE_BITS: usize = 2;
}

pub mod get {

    pub const SUCCESS: u8 = 0;
    pub const IO_ERROR: u8 = 1;
    pub const UNAUTHORIZED: u8 = 2;
    pub const NO_IMAGE: u8 = 3;

    pub const CODE_BITS: usize = 2;
}

pub mod copy {

    pub const SUCCESS: u8 = 0;
    pub const IO_ERROR_READ: u8 = 1;
    pub const IO_ERROR_WRITE: u8 = 2;
    pub const UNAUTHORIZED: u8 = 3;
    pub const NO_IMAGE: u8 = 4;
    pub const MANY_TOTAL: u8 = 5;

    pub const CODE_BITS: usize = 3;
}

pub mod ids {

    pub const SUCCESS: u8 = 0;
    pub const NO_ACCOUNT: u8 = 1;

    pub const CODE_BITS: usize = 1;
}