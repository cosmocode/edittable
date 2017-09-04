
module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'), // the package file to use
        eslint: {
            target: ['script', '_jstest']
        },
        qunit: {
            all: ['_jstest/*.html']
        },
        watch: {
            files: ['_jstest/*.js', '_jstest/*.html', 'script/*.js'],
            tasks: ['qunit', 'eslint']
        }
    });
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-eslint');
    grunt.registerTask('default', ['qunit']);
};

