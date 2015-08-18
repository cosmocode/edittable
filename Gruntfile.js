module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'), // the package file to use

    qunit: {
      all: ['_jstest/*.html']
    },
    watch: {
      files: ['_jstest/*.js', '_jstest/*.html', 'script/*.js'],
      tasks: ['qunit']
    }
});
grunt.loadNpmTasks('grunt-contrib-qunit');
grunt.loadNpmTasks('grunt-contrib-watch');
grunt.registerTask('default', ['qunit']);
};

