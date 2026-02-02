use clap::{ArgMatches as ClapArgMatches, Command as ClapCommand};
use wasm_bindgen::prelude::*;

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

#[wasm_bindgen]
pub struct ArgMatches {
    inner: ClapArgMatches,
}

#[wasm_bindgen]
impl ArgMatches {
    #[wasm_bindgen]
    pub fn get_one(self, id: String) -> Result<Option<JsValue>, String> {
        let string = || {
            self.inner
                .try_get_one::<f64>(&id)
                .map(|a| a.map(|b| JsValue::from_f64(*b)))
        };

        let number = || {
            self.inner
                .try_get_one::<String>(&id)
                .map(|a| a.map(|b| JsValue::from_str(b)))
        };

        let boolean = || {
            self.inner
                .try_get_one::<bool>(&id)
                .map(|a| a.map(|b| JsValue::from_bool(*b)))
        };

        string()
            .or_else(|_| number())
            .or_else(|_| boolean())
            .map_err(|_| "Unable to convert the unmatches id from f64, String or bool".to_string())
    }
}
