use clap::Command as ClapCommand;
use wasm_bindgen::prelude::*;

use crate::ArgMatches;

#[wasm_bindgen]
pub struct Command {
    inner: ClapCommand,
}

#[wasm_bindgen]
impl Command {
    #[wasm_bindgen(constructor)]
    pub fn new(name: String) -> Self {
        Self {
            inner: ClapCommand::new(name),
        }
    }

    #[wasm_bindgen]
    pub fn default() -> Self {
        Self {
            inner: ClapCommand::default(),
        }
    }

    #[wasm_bindgen(js_name = "getMatches")]
    pub fn get_matches(self) -> ArgMatches {
        ArgMatches {
            inner: self.inner.get_matches(),
        }
    }
}
