SHELL = /bin/sh
CC=em++
# S_DIR =src
CPPFLAGS=-I. -std=c++11
B_DIR =../build
PUB_DIR=../../../../../../public
# VPATH = $(S_DIR)
WASM_DIR=\'\/react_interface\/src\/tutors\/Stylus\/c\_modules\/bezier_fit\/build\/\'


EMCCFLAGS= -s USE_PTHREADS=0 -s FILESYSTEM=0 -s WASM=1 -s MODULARIZE=1 \
 		   -s EXPORT_NAME='c_BezierFit' -s ENVIRONMENT=web  \
 		   -s EXPORTED_FUNCTIONS="['_c_FitCurve', '_c_ML_EncodeCurves',"_c_GroupStrokes"]" \
 		   -s EXPORT_ES6=1 -s INVOKE_RUN=0

bezier_fit.wasm: GraphicsGems.cpp bezier_fit.cpp stroke_group.cpp GraphicsGems.h
	$(CC) stroke_group.cpp GraphicsGems.cpp bezier_fit.cpp  -o $(B_DIR)/bezier_fit.js $(EMCCFLAGS) $(CPPFLAGS)
	sed -i '1s/^/\/\* eslint no-unused-expressions:0 no-restricted-globals:0 \*\/\n/' $(B_DIR)/bezier_fit.js
	sed -i "s/import.meta.url/${WASM_DIR}/g" $(B_DIR)/bezier_fit.js
	mv $(B_DIR)/bezier_fit.js $(B_DIR)/js_glue.js
	cp $(B_DIR)/bezier_fit.wasm $(PUB_DIR)/bezier_fit.wasm
	