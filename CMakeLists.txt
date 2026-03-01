cmake_minimum_required(VERSION 3.20)

project(banana_ictax_fx NONE)

set(QRC "ch.axlabs.banana.ictax-fx.qrc" CACHE STRING "Qt resource collection file")
set(PACKAGE_NAME "ch.axlabs.banana.ictax-fx.sbaa" CACHE STRING "Output package name")
set(DIST_DIR "${CMAKE_SOURCE_DIR}/dist" CACHE PATH "Output directory for generated package")

set(QRC_PATH "${CMAKE_SOURCE_DIR}/${QRC}")
if(NOT EXISTS "${QRC_PATH}")
  message(FATAL_ERROR "QRC file not found: ${QRC_PATH}")
endif()

# Keep explicit resource dependencies so rebuilds happen when package content changes.
set(PACKAGE_CONTENT_FILES
  "${CMAKE_SOURCE_DIR}/ch.axlabs.banana.ictax-fx.manifest.json"
  "${CMAKE_SOURCE_DIR}/axlabs_banana_ictax_fx_common.js"
  "${CMAKE_SOURCE_DIR}/ch.axlabs.banana.fx.ictax.export.js"
  "${CMAKE_SOURCE_DIR}/ch.axlabs.banana.fx.ictax.import.js"
)

foreach(_file IN LISTS PACKAGE_CONTENT_FILES)
  if(NOT EXISTS "${_file}")
    message(FATAL_ERROR "Required package file not found: ${_file}")
  endif()
endforeach()

find_package(Qt6 QUIET COMPONENTS Core)
if(TARGET Qt6::rcc AND (NOT DEFINED RCC_EXECUTABLE OR RCC_EXECUTABLE STREQUAL ""))
  get_target_property(_QT_RCC_EXECUTABLE Qt6::rcc IMPORTED_LOCATION)
  if(_QT_RCC_EXECUTABLE)
    set(RCC_EXECUTABLE "${_QT_RCC_EXECUTABLE}" CACHE FILEPATH "Path to Qt rcc executable")
  endif()
endif()

if(NOT DEFINED RCC_EXECUTABLE OR RCC_EXECUTABLE STREQUAL "")
  find_program(RCC_EXECUTABLE NAMES rcc qt6-rcc
    PATHS
      /usr/lib/qt6/libexec
      /usr/lib/qt6/bin
      /opt/homebrew/opt/qt/bin
      /usr/local/opt/qt/bin
  )
endif()

if(NOT RCC_EXECUTABLE)
  message(FATAL_ERROR "Qt rcc not found. Install Qt6 tools or pass -DRCC_EXECUTABLE=/path/to/rcc")
endif()

set(OUTPUT_PATH "${DIST_DIR}/${PACKAGE_NAME}")

add_custom_command(
  OUTPUT "${OUTPUT_PATH}"
  COMMAND "${CMAKE_COMMAND}" -E make_directory "${DIST_DIR}"
  COMMAND "${RCC_EXECUTABLE}" -binary -o "${OUTPUT_PATH}" "${QRC_PATH}"
  DEPENDS "${QRC_PATH}" ${PACKAGE_CONTENT_FILES}
  COMMENT "Building Banana package ${OUTPUT_PATH}"
  VERBATIM
)

add_custom_target(package ALL DEPENDS "${OUTPUT_PATH}")
