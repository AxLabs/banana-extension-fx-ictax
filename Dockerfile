FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# Ubuntu 24.04 (Noble) + Qt6 tooling.
# Note: Qt6's rcc is typically located at /usr/lib/qt6/libexec/rcc (not on PATH).
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    bash \
    qt6-base-dev-tools \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /work

# The repo is mounted into /work by the Makefile.
# Build output is written to /work/dist (mounted from host).

# Allow overriding via environment variables.
ENV QRC=ch.axlabs.banana.ictax-fx.qrc
ENV OUT_NAME=ch.axlabs.banana.ictax-fx.sbaa

# Resolve the Qt6 rcc path reliably and build the package.
CMD ["bash", "-lc", "set -euo pipefail; RCC=\"\"; if command -v rcc >/dev/null 2>&1; then RCC=\"$(command -v rcc)\"; elif [ -x /usr/lib/qt6/libexec/rcc ]; then RCC=/usr/lib/qt6/libexec/rcc; elif [ -x /usr/lib/qt6/bin/rcc ]; then RCC=/usr/lib/qt6/bin/rcc; else echo 'ERROR: Qt6 rcc not found'; exit 1; fi; test -f \"$QRC\"; mkdir -p dist; \"$RCC\" -binary -o \"dist/$OUT_NAME\" \"$QRC\"; ls -la dist" ]