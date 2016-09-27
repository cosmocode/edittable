module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'), // the package file to use

    jshint: {
	  options: {
              curly: true,
              forin: true,
              freeze: true,
              globals: {
                  DOKU_BASE: false,
                  LANG: false,
                  initToolbar: false
              },
              strict: true,
              undef: true,
              unused: true,
              plusplus: true,
              browser: true,
              devel: true,
              jquery: true,
              qunit: true
          },
	  all: ['_jstest/*.js', 'script/*.js', '!script/handsontable.full.js']
    },
    qunit: {
      all: ['_jstest/*.html']
    },
    watch: {
      files: ['_jstest/*.js', '_jstest/*.html', 'script/*.js'],
      tasks: ['qunit', 'jshint']
    }
});
grunt.loadNpmTasks('grunt-contrib-qunit');
grunt.loadNpmTasks('grunt-contrib-watch');
grunt.loadNpmTasks('grunt-contrib-jshint');
grunt.registerTask('default', ['qunit']);
};

