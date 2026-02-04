use clap::ArgMatches as ClapArgMatches;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct ArgMatches {
    pub(crate) inner: ClapArgMatches,
}

#[wasm_bindgen]
impl ArgMatches {
    #[wasm_bindgen]
    pub fn get_one_string(self, id: String) -> Result<Option<String>, String> {
        self.inner
            .try_get_one::<String>(&id)
            .map(|a| a.cloned())
            .map_err(|_| "Unable to convert the unmatches id from String".to_string())
    }

    #[wasm_bindgen]
    pub fn get_one(self, id: String) -> Result<Option<JsValue>, String> {
        let string = || {
            self.inner
                .try_get_one::<String>(&id)
                .map(|a| a.map(|b| JsValue::from_str(b)))
        };

        let number = || {
            self.inner
                .try_get_one::<f64>(&id)
                .map(|a| a.map(|b| JsValue::from_f64(*b)))
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
