'use strict';

/* Configuration */
const phpEnabled = true;
const appDir = './';
const serverUrl = 'http://kino-app';	

const	gulp 				= require('gulp'),
		rename 				= require("gulp-rename"),
		browserSync 	= require('browser-sync').create(),
		autoprefixer 	= require('gulp-autoprefixer'),
		cleanCSS 			= require('gulp-clean-css'),
		imagemin 			= require('gulp-imagemin'),
		svgstore 			= require('gulp-svgstore'),
		cheerio 			= require('gulp-cheerio'),
		sass 					= require('gulp-sass'),
		sourcemaps 		= require('gulp-sourcemaps'),
		babel 				= require('gulp-babel'),
		uglify 				= require('gulp-uglify'),
		watch 				= require('gulp-watch'),
		del 					= require('del'),
		bower 				= require('gulp-bower'),
		fileinclude 	= require('gulp-file-include'),
		browserify 		= require('gulp-node-browserify'),
		buffer 				= require('vinyl-buffer'),
		gulpsync 			= require('gulp-sync')(gulp);

let path = {	
	tpl: {
		src: [appDir+'src/**/*.html', '!'+appDir+'src/static-template/**/*.*'],
		build: appDir+'build/',
		watch: [appDir+'src/**/*.html'],
	},
	js: {
		src: appDir+'src/js/app.js',
		build: appDir+'build/js/',
		watch: [appDir+'src/js/**/*.js'],
	},
	style: {
		src: appDir+'src/scss/*.scss',
		build: appDir+'build/css/',
		watch: [appDir+'src/scss/**/*.scss'],
	},
	img: {
		src: [appDir+'src/img/**/*.*', '!'+appDir+'src/img/svg/**/*.*'],
		build: appDir+'build/img/',
		watch: [appDir+'src/img/**/*.*', '!'+appDir+'src/img/svg/**/*.*'],
	},
	svg: {
		src: appDir+'src/img/svg/**/*.*',
		build: appDir+'build/img/svg/',
		watch: [appDir+'src/img/svg/**/*.*'],
	},
	clean: appDir+'build',
};

// https://browsersync.io/docs/options
let serverConfig = {
	// tunnel: true,	
	browser: "chrome",
	logPrefix: "zZZz"
};

if(phpEnabled){
	serverConfig.proxy = {
		target: serverUrl,
		ws: true // enables websockets
	}
} else {
	serverConfig.server = {
		baseDir: appDir,
		directory: true
	};
}

//browserSync Singleton 
let server = function serverBind() {
	if(serverBind.run === null){
		browserSync.init(serverConfig);
		serverBind.run = true;
	}
}
server.run = null;

let log = console.log.bind(console);

/* Tasks */
/*
JS
*/
gulp.task('js', function () { 
	return gulp.src(path.js.src) 
	.pipe(sourcemaps.init()) 
	.pipe(browserify())
	.pipe(buffer())
	.pipe(babel({
		"presets": [
		[ 'es2015-script' ],
		],
	}))
	.on('error', function (err) {
		console.log(err.message);
		this.emit('end');
	})
	.pipe(sourcemaps.write())
	.pipe(gulp.dest(path.js.build));
});
gulp.task('watch-js', function () {
	server();
	watch(path.js.watch, { read: false })
	.on('change', () => gulp.start('js', () => { log('haha'); browserSync.reload(); } ))
	.on('error', error => console.log(`Watcher js error: ${error.message}`));
});
gulp.task('js-min', function () {
	return gulp.src([path.js.build+'*.js', '!'+path.js.build+'*.min.js'])   
	.pipe(uglify())
	.pipe(rename({ suffix: '.min' }))
	.pipe(gulp.dest(path.js.build));
});


/*
Temlates
*/
gulp.task('tpl', function () {
	return gulp.src(path.tpl.src) 
	.pipe(fileinclude({
		prefix: '@@',
		basepath: '@file'
	}))
	.pipe(gulp.dest(path.tpl.build))
});
gulp.task('watch-tpl', function () {
	server();
	watch(path.tpl.watch, { read: false })
	.on('change', () => gulp.start('tpl', () => browserSync.reload() ))
	.on('error', error => log(`Watcher tpl error: ${error.message}`));
});


/*
Styles
*/
gulp.task('css', function () {
	return gulp.src(path.style.src)
	.pipe(sourcemaps.init())
	.pipe(sass())
	.on('error', function (err) {
		console.log(err.message);
		this.emit('end');
	})
	.pipe(autoprefixer({browsers: ['last 2 versions']}))
	.pipe(sourcemaps.write())
	.pipe(gulp.dest(path.style.build));
});
gulp.task('watch-css', function () {
	server();
	watch(path.style.watch, { read: false })
	.on('change', () => gulp.start('css', () => browserSync.reload()) )
	.on('error', error => log(`Watcher style error: ${error.message}`));
});
gulp.task('css-min', function () {
	gulp.src([path.style.build+'*.css', '!'+path.style.build+'*.min.css'])
	.pipe(cleanCSS())
	.pipe(rename({ suffix: '.min' }))
	.pipe(gulp.dest(path.style.build));
});


/*
Images
*/
gulp.task('img', function () {
	return gulp.src( path.img.src )
	.pipe(imagemin([
		imagemin.gifsicle({interlaced: true}),
		imagemin.jpegtran({progressive: true}),
		imagemin.optipng({optimizationLevel: 2}),
		imagemin.svgo({
			plugins: [
			{cleanupAttrs: true},
			{removeDoctype: true},
			{removeViewBox: true},
			]
		}),
		]))
	.pipe(gulp.dest(path.img.build))
});
gulp.task('watch-img', function () {
	server();
	watch( path.img.watch, function(event, cb) {
		gulp.start('img', () => browserSync.reload() );
	})
	.on('error', error => log(`Watcher image error: ${error.message}`));
});

gulp.task('svg', function () {
	return gulp.src(path.svg.src)
	.pipe(imagemin([
		imagemin.svgo({
			plugins: [
			{cleanupAttrs: true},
			{removeDoctype: true},
			{removeViewBox: true},
			]
		})
		]))
	.pipe(svgstore({
		includeTitleElement: false,
		cleanup: [
		'fill',
		],
	}))
	.pipe(cheerio({
		run: function ($) {
			$('svg').attr('style',  'display:none');
		},
		parserOptions: { xmlMode: true }
	}))
	.pipe(gulp.dest(path.svg.build))
});
gulp.task('watch-svg', function () {
	server();
	watch(path.svg.watch, function(event, cb) {
		gulp.start('svg', () => browserSync.reload() );
	})
	.on('error', error => log(`Watcher svg error: ${error.message}`));
});

gulp.task('bower', function() {
	return bower();
});

gulp.task('clean', function(){
	del(path.clean);
});

gulp.task('default', ['tpl','js','css','img','svg',]);
gulp.task('prod', gulpsync.sync(['default', ['js-min', 'css-min']]) );
gulp.task('watch', ['watch-js', 'watch-tpl', 'watch-css', 'watch-img', 'watch-svg'] );

