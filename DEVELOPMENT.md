# DEVELOPMENT

This project is a **Banana Accounting Plus packaged extension**.
It builds a single **`.sbaa`** package containing two commands:

- **Export ICTAX FX requests** (from selected Transactions)
- **Import ICTAX FX rates output** (upsert ExchangeRates)

## Build output

- `dist/ch.axlabs.banana.ictax-fx.sbaa`

Install in Banana via:

- **Extensions -> Manage Extensions -> Add from file...** and select the `.sbaa`

## Build system

The project now uses **CMake** as the build entry point.
CMake invokes Qt `rcc` to compile the `.qrc` package definition into the final `.sbaa`.

### Quick build

```bash
make
```

Equivalent direct CMake commands:

```bash
cmake -S . -B build
cmake --build build --target package
```

If `rcc` is not on `PATH`, set it explicitly:

```bash
make RCC=/full/path/to/rcc
```

## Dependencies

You need:

- `cmake`
- Qt tools including `rcc`
- `make` (only if you want to use the Makefile wrapper)

## Installing dependencies

### macOS

```bash
brew install cmake qt
```

Apple Silicon `rcc` is typically:

- `/opt/homebrew/opt/qt/bin/rcc`

Intel macOS `rcc` is typically:

- `/usr/local/opt/qt/bin/rcc`

### Linux

#### Debian / Ubuntu

```bash
sudo apt update
sudo apt install -y cmake make qt6-base-dev-tools
```

#### Fedora

```bash
sudo dnf install -y cmake make qt6-qtbase-devel
```

#### Arch

```bash
sudo pacman -S --needed cmake make qt6-base
```

### Windows

Use a toolchain that provides both **CMake** and **Qt6 `rcc`** (MSYS2 or WSL are both fine).

## Repo structure notes

- `ch.axlabs.banana.ictax-fx.qrc` lists all files included in the package.
- `ch.axlabs.banana.ictax-fx.manifest.json` is bundled as `manifest.json` inside the package.
- `@includejs` is used so both commands share `axlabs_banana_ictax_fx_common.js`.
