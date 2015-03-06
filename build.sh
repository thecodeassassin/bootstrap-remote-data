#!/bin/sh

echo 'Compressing scripts...'

yui-compressor js/bootstrap-remote-tabs.js -o js/bootstrap-remote-tabs.min.js
yui-compressor js/jquery.loadmask.js -o js/jquery.loadmask.min.js
