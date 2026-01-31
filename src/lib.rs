use clap::Command;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct OurCommand {
    inner: Command,
}

#[wasm_bindgen]
impl OurCommand {
    #[wasm_bindgen(constructor)]
    pub fn new(name: String) -> Self {
        Self {
            inner: Command::new(name),
        }
    }

    #[wasm_bindgen]
    pub fn default() -> Self {
        Self {
            inner: Command::default(),
        }
    }
}
