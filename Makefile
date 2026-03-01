# Banana ICTAX FX packaged extension builder
# Builds a .sbaa from the .qrc using Qt's rcc.

QRC            := ch.axlabs.banana.ictax-fx.qrc
DIST_DIR       := dist
PACKAGE_NAME   := ch.axlabs.banana.ictax-fx.sbaa

# Allow overriding, e.g.:
#   make RCC=/usr/local/opt/qttools/bin/rcc
RCC ?= rcc

# ---- Docker build (no local Qt/rcc needed) ----
DOCKER_IMAGE ?= banana-ictax-fx-builder
DOCKERFILE   ?= Dockerfile

.PHONY: all build clean distclean doctor \
	docker-image docker-package docker-clean

all: build

doctor:
	@echo "QRC: $(QRC)"
	@echo "RCC: $(RCC)"
	@command -v "$(RCC)" >/dev/null 2>&1 || (echo "ERROR: rcc not found. Install Qt tools (see DEVELOPMENT.md) or set RCC=/path/to/rcc"; exit 1)
	@test -f "$(QRC)" || (echo "ERROR: $(QRC) not found in repo root"; exit 1)
	@echo "OK: rcc found and QRC present."

build: doctor
	@mkdir -p "$(DIST_DIR)"
	@"$(RCC)" -binary -o "$(DIST_DIR)/$(PACKAGE_NAME)" "$(QRC)"
	@echo "Built: $(DIST_DIR)/$(PACKAGE_NAME)"

clean:
	@rm -rf "$(DIST_DIR)"

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
