#!/usr/bin/env sh

# This script requires the installation of jsduck
# using 'gem install jsduck'

rm -fr docs
jsduck --config conf.json --output docs
#jsduck . --output docs
