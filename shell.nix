{ sources ? import ./nix/sources.nix }:
let
  pkgs = import sources.nixpkgs {};

  confluent-niv =
    import
      sources.confluent-niv
      {
        inherit pkgs;
      };

  frameworks = pkgs.darwin.apple_sdk.frameworks;
in
pkgs.mkShell
{
  nativeBuildInputs = [
    confluent-niv.rdkafka
  ];

  buildInputs = [
    # JavaScript
    pkgs.nodejs-16_x
    pkgs.nodePackages.eslint
    pkgs.nodePackages.node-gyp
    pkgs.nodePackages.node-gyp-build
    pkgs.yarn
  ] ++ (
    pkgs.lib.optionals pkgs.stdenv.isDarwin [
      frameworks.Security
      frameworks.CoreServices
      frameworks.CoreFoundation
      frameworks.Foundation
      frameworks.AppKit
    ]
  );


  shellHook = ''
    export C_INCLUDE_PATH=${confluent-niv.rdkafka}/include
    export LD_LIBRARY_PATH=${confluent-niv.rdkafka}/lib
    export LIBRARY_PATH=${confluent-niv.rdkafka}/lib

    export PATH=node_modules/.bin:$PATH
  '';
}
