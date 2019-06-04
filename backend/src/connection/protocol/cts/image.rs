pub type CodeType = u64;

/// Upload a new image
pub const UPLOAD: CodeType = 0;
/// Change pixel data of an existing image
pub const CHANGE_PIXELS: CodeType = 1;
/// Get image pixel data of an existing image
pub const GET_PIXELS: CodeType = 2;
/// Change the metadata (the name or the private status) of an existing image
pub const CHANGE_META: CodeType = 3;
/// Get the metadata of an existing image
pub const GET_META: CodeType = 4;
/// Copy an image (possibly of someone else) and add it to your account
pub const COPY: CodeType = 5;
/// Get all image ids of the images that someone (probably you) owns
pub const IDS: CodeType = 6;

/// The number of bits required to store the image code
pub const CODE_BITS: usize = 3;