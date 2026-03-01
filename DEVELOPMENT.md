# DEVELOPMENT

This project is a **Banana Accounting Plus packaged extension**.  
It builds a single **`.sbaa`** package that contains **two commands**:

- **Export ICTAX FX requests** (from selected Transactions)
- **Import ICTAX FX rates output** (upsert ExchangeRates)

## Build output

The build produces:

- `dist/ch.axlabs.banana.ictax-fx.sbaa`

You can install it in Banana via:

- **Extensions → Manage Extensions → Add from file…** → select the `.sbaa`

## Build dependency

You only need:

- **Qt `rcc`** (Qt Resource Compiler)
- `make` (to run the provided Makefile)

`rcc` compiles the Qt Resource Collection (`.qrc`) into a binary resource bundle, which Banana uses as the `.sbaa` package.

## Makefile

Place this `Makefile` in the repo root (same folder as `ch.axlabs.banana.ictax-fx.qrc`):

```makefile
# Banana ICTAX FX packaged extension builder
# Builds a .sbaa from the .qrc using Qt's rcc.

QRC            := ch.axlabs.banana.ictax-fx.qrc
DIST_DIR       := dist
PACKAGE_NAME   := ch.axlabs.banana.ictax-fx.sbaa

# Allow overriding, e.g.:
#   make RCC=/opt/homebrew/opt/qt/bin/rcc
RCC ?= rcc

.PHONY: all build clean distclean doctor

all: build

doctor:
	@echo "QRC: $(QRC)"
	@echo "RCC: $(RCC)"
	@command -v "$(RCC)" >/dev/null 2>&1 || (echo "ERROR: rcc not found. Install Qt (see below) or set RCC=/path/to/rcc"; exit 1)
	@test -f "$(QRC)" || (echo "ERROR: $(QRC) not found in repo root"; exit 1)
	@echo "OK: rcc found and QRC present."

build: doctor
	@mkdir -p "$(DIST_DIR)"
	@"$(RCC)" -binary -o "$(DIST_DIR)/$(PACKAGE_NAME)" "$(QRC)"
	@echo "Built: $(DIST_DIR)/$(PACKAGE_NAME)"

clean:
	@rm -rf "$(DIST_DIR)"

distclean: clean
```

### Build commands

```bash
make
# outputs: dist/ch.axlabs.banana.ictax-fx.sbaa
```

If `rcc` is not in your `PATH`:

```bash
make RCC=/full/path/to/rcc
```

## Installing dependencies

### macOS

#### Qt (includes `rcc`)
Using Homebrew:

```bash
brew install qt
```

On Apple Silicon, `rcc` is usually here:

- `/opt/homebrew/opt/qt/bin/rcc`

or, for Intel, is usually here:

- `/usr/local/opt/qt/bin/rcc`

Build with:

```bash
make RCC=/opt/homebrew/opt/qt/bin/rcc
```

#### make (if needed)

```bash
xcode-select --install
```

### Linux

#### Debian / Ubuntu

```bash
sudo apt update
sudo apt install -y make qtbase5-dev-tools
```

Then:

```bash
make
```

#### Fedora

```bash
sudo dnf install -y make qt5-qtbase-devel
```

#### Arch

```bash
sudo pacman -S --needed make qt5-base
```

### Windows

#### Option 1: MSYS2 (recommended for Makefile workflow)

1. Install MSYS2
2. Open **MSYS2 MinGW 64-bit** shell
3. Install dependencies:

```bash
pacman -S --needed make mingw-w64-x86_64-qt5
```

Then run `make` from the repo directory.

#### Option 2: WSL (Ubuntu)

1. Install WSL + Ubuntu
2. Inside WSL:

```bash
sudo apt update
sudo apt install -y make qtbase5-dev-tools
make
```

## Repo structure notes

- `ch.axlabs.banana.ictax-fx.qrc` lists all files included in the package.
- `ch.axlabs.banana.ictax-fx.manifest.json` is bundled as `manifest.json` inside the package.
- `@includejs` is used so both commands share `axlabs_banana_ictax_fx_common.js`.
