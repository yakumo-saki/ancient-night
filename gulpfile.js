'use strict';

var gulp = require('gulp');
var shell = require('gulp-shell')
var del = require('del');
var runSequence = require('run-sequence');

var config = {
    shell: {
      tsmain: {
          verbose: true,
          cwd: '' + __dirname + '/src/main'
      },
      tsrenderer: {
          verbose: true,
          cwd: '' + __dirname + '/src/renderer'
      }
    },
    sass : {
    	 options: {
		  errLogToConsole: true,
		  outputStyle: 'expanded'
		}
    }
};

var AN_SHARED_IN_DIR = 'src/shared/';
var AN_TS_MAIN_IN_DIR = 'src/main/';
var AN_TS_RENDERER_IN_DIR = 'src/renderer/';
var AN_SCSS_IN_DIR = 'app/view/css/**/*.scss';
var AN_SCSS_OUT_DIR = 'app/view/css/';
var ALL_TS = '**/*.ts';
var TSCONFIG = 'tsconfig.json';

gulp.task('default', ['build'] ,function() {
    gulp.watch(AN_TS_MAIN_IN_DIR + ALL_TS, ['build-main']);
    gulp.watch(AN_TS_MAIN_IN_DIR + TSCONFIG, ['build-main']);

    gulp.watch(AN_TS_RENDERER_IN_DIR + ALL_TS, ['build-renderer']);
    gulp.watch(AN_TS_RENDERER_IN_DIR + TSCONFIG, ['build-renderer']);

    gulp.watch(AN_SHARED_IN_DIR + ALL_TS, ['build-main','build-renderer']);
    gulp.watch(AN_SCSS_IN_DIR, ['build-scss']);
});

gulp.task('watch',['default']);

gulp.task('build', ['build-main','build-renderer','build-scss']);

gulp.task('build-main', function(callback) {
    return runSequence('clean-main','build-main-ts',callback);
});

gulp.task('clean-main', function(cb) {
    return del(['./app/main/**'],cb);
});

gulp.task('build-main-ts', shell.task(['tsconfig -u','tsc'], config.shell.tsmain) );


gulp.task('build-renderer', function(callback) {
    return runSequence('clean-renderer','build-renderer-ts',callback);
});

gulp.task('clean-renderer', function(cb) {
    return del(['./app/renderer/**'],cb);
});

gulp.task('build-renderer-ts', ['clean-renderer'], shell.task(['tsconfig -u','tsc'], config.shell.tsrenderer) );

gulp.task('build-scss', shell.task('node-sass ./app/view/css/ancient.scss > ./app/view/css/ancient.css'));
