FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# Install only what's needed to compile a Qt resource collection (.qrc) into a .sbaa
# (Qt5's rcc is sufficient for this purpose.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    make \
    qtbase5-dev-tools \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /work

# The repo will be mounted into /work by the Makefile.
# Build output should be written to /work/dist (also mounted from host).

# Allow overriding via environment variables.
ENV QRC=ch.axlabs.banana.ictax-fx.qrc
ENV OUT_NAME=ch.axlabs.banana.ictax-fx.sbaa

CMD ["bash", "-lc", "test -f \"$QRC\" && mkdir -p dist && rcc -binary -o \"dist/$OUT_NAME\" \"$QRC\" && ls -la dist"]