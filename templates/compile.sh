#!/bin/bash
dir="$( dirname "${BASH_SOURCE[0]}" )"
templatesDir="${dir}/../../templates"
if [ -d ${templatesDir} ]
then
    node ${dir}/compile.js ${dir}/*.html ${templatesDir}/*.html
else
    node ${dir}/compile.js ${dir}/*.html
fi
