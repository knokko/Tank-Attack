pub mod image;

pub type ProtocolType = u64;

pub const CODE_REGISTER: ProtocolType = 0;
pub const CODE_LOGIN: ProtocolType = 1;
pub const CODE_IMAGE: ProtocolType = 2;

pub const CODE_BITS: usize = 2;
