/// Upload a new image
pub const UPLOAD: i8 = 0;
/// Change an existing image
pub const CHANGE: i8 = 1;
/// Get image data of an existing image
pub const GET: i8 = 2;
/// Copy an image (possibly of someone else) and add it to your account
pub const COPY: i8 = 3;
/// Get all image ids of the images that someone (probably you) owns
pub const IDS: i8 = 4;
/// The number of bits required to store the image code
pub const CODE_BITS: usize = 3;