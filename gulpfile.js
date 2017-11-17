'use strict';

const 	gulp 			= require('gulp'),
		rename 			= require("gulp-rename"),
		browserSync 	= require('browser-sync').create(),
		autoprefixer 	= require('gulp-autoprefixer'),
		cleanCSS 		= require('gulp-clean-css'),
		imagemin 		= require('gulp-imagemin'),
		svgstore 		= require('gulp-svgstore'),
		cheerio 		= require('gulp-cheerio'),
		sass 			= require('gulp-sass'),
		sourcemaps 		= require('gulp-sourcemaps'),
		rigger 			= require('gulp-rigger'),
		jshint 			= require('gulp-jshint'),
		babel 			= require('gulp-babel'),
		uglify 			= require('gulp-uglify'),
		watch 			= require('gulp-watch'),
		del 			= require('del');

const path = {
	tpl: {
		src: 'src/*.html',
		build: 'build/',
		srcDir: 'src/',
		buildDir: 'build/',
		watch: 'src/**/*.html',
	},
	js: {
		src: 'src/js/*.js',
		build: 'build/js/',
		srcDir: 'src/js/',
		buildDir: 'build/js/',
		watch: ['src/js/**/*.js', '!src/js/lib/**/*.*'],
		vendor: {
			src: 'src/js/lib/**/*.*',
			build: 'build/js/lib/',
			srcDir: 'src/js/lib/',
			buildDir: 'build/js/lib/',
			watch: 'src/js/lib/**/*.*',
		},
	},
	style: {
		src: 'src/scss/*.scss',
		build: 'build/css/',
		srcDir: 'src/scss/',
		buildDir: 'build/css/',
		watch: 'src/scss/**/*.scss',
		vendor: {
			src: 'src/scss/lib/**/*.*',
			build: 'build/css/lib/',			
			srcDir: 'src/scss/lib/',
			buildDir: 'build/css/lib/',
			watch: 'src/scss/lib/**/*.*',
		},
	},
	fonts: {
		src: 'src/fonts/**/*.*',
		build: 'build/fonts/',
		srcDir: 'src/fonts/',
		buildDir: 'build/fonts/',
		watch: 'src/fonts/**/*.*',
	},
	img: {
		src: ['src/img/**/*.*', '!src/img/sprite_svg/**/*.*'],
		build: 'build/img/',
		srcDir: 'src/img/',
		buildDir: 'build/img/',
		watch: ['src/img/**/*.*', '!src/img/sprite_svg/**/*.*'],
	},
	svg: {
		src: 'src/img/sprite_svg/**/*.*',
		build: 'build/img/sprite_svg/',
		srcDir: 'src/img/sprite_svg/',
		buildDir: 'build/img/sprite_svg/',
		watch: 'src/img/sprite_svg/**/*.*',
	},
	clean: 'build',
};


// https://browsersync.io/docs/options
let serverConfig = {
	server: {
		baseDir: "./build",
		directory: true
	},
	tunnel: true,
	browser: "chrome",
	logPrefix: "zZZz"
};

//Tasks
gulp.task('tpl', function () {
	return gulp.src(path.tpl.src) 
		.pipe(rigger()) 
		.pipe(gulp.dest(path.tpl.build))
});
gulp.task('tpl-watch', ['tpl'], function (done) {
    browserSync.reload();
    done();
});

gulp.task('js', function () {   		
	return gulp.src(path.js.src) 
		.pipe(rigger())
		.pipe(jshint({"esversion": 6, "strict": "global", "browser": true, "devel": true}))
		.pipe(jshint.reporter('default'))
		.pipe(sourcemaps.init()) 
		.pipe(babel({
			"presets": [
			["env", {
				"targets": {
					"browsers": ["last 2 versions"],
					"uglify": true,
				},
			}]
			]
		}))
		.on('error', function (err) {
			console.log(err.message);
			this.emit('end');
		})
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(path.js.build));
});
gulp.task('js-watch', ['js'], function (done) {
    browserSync.reload();
    done();
});
gulp.task('js-min', function () {
	gulp.src([`${path.js.build}*.js`, `!${path.js.build}*.min.js`])   
		.pipe(uglify())
		.pipe(rename({ suffix: '.min' }))
		.pipe(gulp.dest(path.js.build));
});

gulp.task('style', function () {
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
gulp.task('style-watch', ['style'], function (done) {
    browserSync.reload();
    done();
});
gulp.task('style-min', function () {
	gulp.src([`${path.style.build}*.css`, `!${path.style.build}*.min.css`])
		.pipe(cleanCSS())
		.pipe(rename({ suffix: '.min' }))
		.pipe(gulp.dest(path.style.build));
});

gulp.task('image', function () {
    return gulp.src(path.img.src)
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
gulp.task('image-watch', ['image'], function (done) {
    browserSync.reload();
    done();
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
gulp.task('svg-watch', ['svg'], function (done) {
    browserSync.reload();
    done();
});

gulp.task('font', function() {
    return gulp.src(path.fonts.src)
        .pipe(gulp.dest(path.fonts.build))
});

gulp.task('vendor', function() {
    gulp.src(path.js.vendor.src)
        .pipe(gulp.dest(path.js.vendor.buildDir));    
    gulp.src(path.style.vendor.src)
        .pipe(gulp.dest(path.style.vendor.buildDir));
});

gulp.task('clean', function(){
	del(path.clean);
});

gulp.task('default', [
    'tpl',
    'js',
    'style',
    'image',
    'svg',
    'font',
    'vendor',
], function(){
	// gulp.start('watch');
});

//Watcher
let watcherFile = {
	del: (ePath, srcPath, buildPath) => {
		let	index = ePath.lastIndexOf(srcPath);

		if(!~index){
			srcPath = srcPath.replace(/\//g,'\\');
			buildPath = buildPath.replace(/\//g,'\\');
			index = ePath.lastIndexOf(srcPath);		
		}		
		
		if(~index){
			let endPath = ePath.slice(index).replace(srcPath, buildPath);
			del(endPath).then(paths => {
				console.log('Deleted:\n', paths.join('\n'));
			});
			return true;
		}
		return false;
	},
	add: (ePath, srcPath, buildPath) => {
		let index = ePath.lastIndexOf('\/');

		if(!~index){
			srcPath = srcPath.replace(/\//g,'\\');
			buildPath = buildPath.replace(/\//g,'\\');
			index = ePath.lastIndexOf('\\');		
		}	

		if(~index){
			let endPath = ePath.slice(0,++index).replace(srcPath, buildPath);
			gulp.src(ePath).pipe(gulp.dest(endPath));
			console.log( `Added:\n${ePath}` );
			return true;
		}	
		return false;
	},
}
gulp.task('watch', function () {
	let log = console.log.bind(console);

	browserSync.init(serverConfig);


	/* Templates */
	watch(path.tpl.watch, function(event, cb) {
        gulp.start('tpl-watch');
    }).on('error', error => log(`Watcher error: ${error}`));

	/* JS */
	watch(path.js.watch, function(event, cb) {
        gulp.start('js-watch');
    }).on('error', error => log(`Watcher error: ${error}`));

    /* Styles */
	watch(path.style.watch, function(event, cb) {
        gulp.start('style-watch');
    }).on('error', error => log(`Watcher error: ${error}`));

    /* Images */
	watch(path.img.watch, function(event, cb) {
        gulp.start('image-watch');
    }).on('error', error => log(`Watcher error: ${error}`));

    /* SVG */
	watch(path.svg.watch, function(event, cb) {
        gulp.start('svg-watch');
    }).on('error', error => log(`Watcher error: ${error}`));

	/* JsVendor */
	let watcherJsVendor = watch(path.js.vendor.watch);
	watcherJsVendor.on('change', function(ePath,event){		
		gulp.src(ePath).pipe(gulp.dest(path.js.vendor.buildDir));
		log( `Сhanged:\n${ePath}` );
	});
	watcherJsVendor.on('add', function(ePath,event){
		watcherFile.add(ePath, path.js.vendor.srcDir, path.js.vendor.buildDir) && browserSync.reload();
	});
	watcherJsVendor.on('unlink', function(ePath){
		watcherFile.del(ePath, path.js.vendor.srcDir, path.js.vendor.buildDir) && browserSync.reload();
	});
	watcherJsVendor.on('error', error => log(`Watcher error: ${error}`));

	/* Fonts */
	let watcherFont = watch(path.fonts.watch);
	watcherFont.on('change', function(ePath,event){		
		gulp.src(ePath).pipe(gulp.dest(path.fonts.buildDir));
		log( `Сhanged:\n${ePath}` );
	});
	watcherFont.on('add', function(ePath,event){
		watcherFile.add(ePath, path.fonts.srcDir, path.fonts.buildDir) && browserSync.reload();				
	});
	watcherJsVendor.on('unlink', function(ePath){
		watcherFile.del(ePath, path.fonts.srcDir, path.fonts.buildDir) && browserSync.reload();
	});
	watcherJsVendor.on('error', error => log(`Watcher error: ${error}`));
});
