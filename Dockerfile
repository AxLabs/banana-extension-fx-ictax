FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# Ubuntu 24.04 (Noble) + Qt6 tooling + CMake.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    bash \
    cmake \
    make \
    qt6-base-dev-tools \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /work

# The repo is mounted into /work by the Makefile.
# Build output is written to /work/dist (mounted from host).

# Allow overriding via environment variables.
ENV QRC=ch.axlabs.banana.ictax-fx.qrc
ENV OUT_NAME=ch.axlabs.banana.ictax-fx.sbaa

# Configure and build the package through CMake.
CMD ["bash", "-lc", "set -euo pipefail; test -f \"$QRC\"; cmake -S . -B /tmp/build -DQRC=\"$QRC\" -DPACKAGE_NAME=\"$OUT_NAME\" -DDIST_DIR=/work/dist; cmake --build /tmp/build --target package; ls -la dist" ]