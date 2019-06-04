use bit_helper::input::BitInputError;

use std::fmt::{Display, Formatter, Result};

pub enum FatalProcessError {
    Form(BitInputError),
    StaticValue(StaticFatalValueError),
    DynamicValue(DynamicFatalValueError),
    WS(ws::Error),
}

impl Display for FatalProcessError {
    fn fmt(&self, f: &mut Formatter) -> Result {
        match self {
            FatalProcessError::Form(bie) => bie.fmt(f),
            FatalProcessError::StaticValue(sv) => sv.fmt(f),
            FatalProcessError::DynamicValue(dv) => dv.fmt(f),
            FatalProcessError::WS(ws) => ws.fmt(f),
        }
    }
}

pub fn static_error(cause: &'static str) -> FatalProcessError {
    FatalProcessError::StaticValue(StaticFatalValueError::new(cause))
}

pub fn dynamic_error(cause: String) -> FatalProcessError {
    FatalProcessError::DynamicValue(DynamicFatalValueError::new(cause))
}

pub struct StaticFatalValueError {
    reason: &'static str,
}

impl Display for StaticFatalValueError {
    fn fmt(&self, f: &mut Formatter) -> Result {
        write!(f, "{}", self.reason)
    }
}

impl StaticFatalValueError {
    pub fn new(reason: &'static str) -> StaticFatalValueError {
        StaticFatalValueError { reason: reason }
    }
}

pub struct DynamicFatalValueError {
    reason: String,
}

impl Display for DynamicFatalValueError {
    fn fmt(&self, f: &mut Formatter) -> Result {
        write!(f, "{}", self.reason)
    }
}

impl DynamicFatalValueError {
    pub fn new(reason: String) -> DynamicFatalValueError {
        DynamicFatalValueError { reason: reason }
    }
}

impl From<BitInputError> for FatalProcessError {
    fn from(error: BitInputError) -> FatalProcessError {
        FatalProcessError::Form(error)
    }
}

impl From<ws::Error> for FatalProcessError {
    fn from(error: ws::Error) -> FatalProcessError {
        FatalProcessError::WS(error)
    }
}
