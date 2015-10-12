/* global module, require */

module.exports = function (grunt) {
    'use strict';

    require('time-grunt')(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        meta: {
            metaJsFiles: [
                'Gruntfile.js'
            ],
            componentsJsFiles: [
                'js/*/**/*.js'
            ],
            ourJsFiles: [
                '<%= meta.componentsJsFiles %>'
            ]
        },

        eslint: {
            components: {
                src: ['<%= meta.componentsJsFiles %>']
            }
        },

        watch: {
            components: {
                files: [
                    '<%= meta.componentsJsFiles %>'
                ],
                tasks: ['components']
            }
        }
    });

    require('jit-grunt')(grunt);

    grunt.registerTask('components', [
        'eslint:components', 'eslint:test', 'jasmine_nodejs:test'
    ]);

    grunt.registerTask('default', ['watch:components']);
};
