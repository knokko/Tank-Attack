pub type CodeType = u64;

pub const IMAGE_CHANGE: CodeType = 0;

pub const CODE_BITS: usize = 1;

pub mod upload {

    pub use super::CodeType;

    pub const SUCCESS: CodeType = 0;
    pub const IO_ERROR: CodeType = 1;
    pub const LONG_NAME: CodeType = 2;
    pub const MANY_TOTAL: CodeType = 3;
    pub const MANY_YOU: CodeType = 4;

    pub const CODE_BITS: usize = 3;
}

pub mod change_pixels {

    pub use super::CodeType;

    pub const SUCCESS: CodeType = 0;
    pub const IO_ERROR: CodeType = 1;
    pub const UNAUTHORIZED: CodeType = 2;
    pub const NO_IMAGE: CodeType = 3;

    pub const CODE_BITS: usize = 2;
}

pub mod get_pixels {

    pub use super::CodeType;

    pub const SUCCESS: CodeType = 0;
    pub const IO_ERROR: CodeType = 1;
    pub const UNAUTHORIZED: CodeType = 2;
    pub const NO_IMAGE: CodeType = 3;

    pub const CODE_BITS: usize = 2;
}

pub mod change_meta {

    pub use super::CodeType;

    pub const SUCCESS: CodeType = 0;
    pub const UNAUTHORIZED: CodeType = 1;
    pub const NO_IMAGE: CodeType = 2;

    pub const CODE_BITS: usize = 2;
}

pub mod get_meta {

    pub use super::CodeType;

    pub const SUCCESS: CodeType = 0;
    pub const UNAUTHORIZED: CodeType = 1;
    pub const NO_IMAGE: CodeType = 2;

    pub const CODE_BITS: usize = 2;
}

pub mod copy {

    pub use super::CodeType;

    pub const SUCCESS: CodeType = 0;
    pub const IO_ERROR_READ: CodeType = 1;
    pub const IO_ERROR_WRITE: CodeType = 2;
    pub const UNAUTHORIZED: CodeType = 3;
    pub const NO_IMAGE: CodeType = 4;
    pub const MANY_TOTAL: CodeType = 5;
    pub const MANY_YOU: CodeType = 6;

    pub const CODE_BITS: usize = 3;
}

pub mod ids {

    pub use super::CodeType;

    pub const SUCCESS: CodeType = 0;
    pub const NO_ACCOUNT: CodeType = 1;

    pub const CODE_BITS: usize = 1;
}
