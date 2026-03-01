# Banana ICTAX FX packaged extension builder
# Uses CMake as the build entry point.

QRC            := ch.axlabs.banana.ictax-fx.qrc
DIST_DIR       := dist
PACKAGE_NAME   := ch.axlabs.banana.ictax-fx.sbaa
BUILD_DIR      := build

# Allow overriding, e.g.:
#   make RCC=/opt/homebrew/opt/qt/bin/rcc
RCC ?=

# ---- Docker build (no local Qt/rcc needed) ----
DOCKER_IMAGE ?= banana-ictax-fx-builder
DOCKERFILE   ?= Dockerfile

.PHONY: all build clean distclean doctor \
	docker-image docker-package docker-clean

all: build

doctor:
	@echo "QRC: $(QRC)"
	@echo "RCC: $(RCC)"
	@test -f "$(QRC)" || (echo "ERROR: $(QRC) not found in repo root"; exit 1)
	@command -v cmake >/dev/null 2>&1 || (echo "ERROR: cmake not found."; exit 1)
	@if [ -n "$(RCC)" ] && [ ! -x "$(RCC)" ]; then \
		echo "ERROR: RCC path is not executable: $(RCC)"; \
		exit 1; \
	fi
	@echo "OK: cmake found and QRC present."

build: doctor
	@cmake -S . -B "$(BUILD_DIR)" \
		-DQRC="$(QRC)" \
		-DPACKAGE_NAME="$(PACKAGE_NAME)" \
		-DDIST_DIR="$(abspath $(DIST_DIR))" \
		$(if $(RCC),-DRCC_EXECUTABLE="$(RCC)",)
	@cmake --build "$(BUILD_DIR)" --target package
	@echo "Built: $(DIST_DIR)/$(PACKAGE_NAME)"

clean:
	@rm -rf "$(DIST_DIR)" "$(BUILD_DIR)"

distclean: clean

# ------------------------------
# Docker-based build
# ------------------------------
# Builds the .sbaa inside a container and writes it to ./dist on the host.

docker-image:
	docker build -f "$(DOCKERFILE)" -t "$(DOCKER_IMAGE)" .

docker-package: docker-image
	@mkdir -p "$(DIST_DIR)"
	docker run --rm \
		-v "$(PWD):/work:ro" \
		-v "$(PWD)/$(DIST_DIR):/work/$(DIST_DIR):rw" \
		-w /work \
		-e QRC="$(QRC)" \
		-e OUT_NAME="$(PACKAGE_NAME)" \
		"$(DOCKER_IMAGE)"
	@echo "Built (docker): $(DIST_DIR)/$(PACKAGE_NAME)"

docker-clean:
	@rm -rf "$(DIST_DIR)"
