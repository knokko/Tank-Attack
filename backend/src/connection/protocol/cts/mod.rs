pub mod image;

pub type ProtocolType = i8;

pub const CODE_REGISTER: ProtocolType = 0;
pub const CODE_LOGIN: ProtocolType = 1;
pub const CODE_IMAGE: ProtocolType = 2;