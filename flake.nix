{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    fenix = {
      url = "github:nix-community/fenix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = {
    fenix,
    flake-utils,
    nixpkgs,
    self,
  }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = import nixpkgs {inherit system;};

      rustPackages = let
        toolchain = with fenix.packages.${system}; let
          system = fromToolchainFile {
            file = ./rust-toolchain.toml;
            sha256 = "sha256-vra6TkHITpwRyA5oBKAHSX0Mi6CBDNQD+ryPSpxFsfg=";
          };
          wasm = targets.wasm32-unknown-unknown.stable.rust-std;
        in
          combine [system wasm];
      in
        with pkgs; [
          toolchain
          wasm-pack
          llvmPackages.bintools
          wasm-bindgen-cli
        ];

      nodePackages = with pkgs; [
        nodejs_24
        corepack_24
      ];
    in {
      devShells.default = pkgs.mkShell {
        inherit system;
        packages = nodePackages ++ rustPackages;

        CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_LINKER = "lld";
      };
    });
}
