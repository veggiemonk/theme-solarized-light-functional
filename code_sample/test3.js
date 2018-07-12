/*eslint-disable */
const argv = require( 'minimist' )( process.argv.slice( 2 ) );

import gulp from 'gulp';
import sass from 'gulp-sass';
import uglify from 'gulp-uglify';
import rename from 'gulp-rename';
import streamify from 'gulp-streamify';
import source from 'vinyl-source-stream';
import budo from 'budo';
import hmr from 'browserify-hmr';
import browserify from 'browserify';
//TODO:
//	-import rollupify from 'rollupify'; // rollup is messed up when using es7...
//	- coverify (code coverage)
import envify from 'envify/custom';
import mithrilObjectify from 'mithril-objectify/browserify';
const resetCSS = require( 'node-reset-scss' ).includePath;
const importOnce = require( 'node-sass-import-once' );

/**----------------------------------------------------------------
 * BABEL CONFIG
 */
const babelConfig = {
	global: true,
	ignore: /\/node_modules\/(?!whatwg-fetch\/)/,
	presets: [ 'es2015', 'stage-2' ],
	plugins: [
		'lodash', [ 'transform-runtime', {
			polyfill: false,
			regenerator: true
		} ]
	]
};
//import babelify from 'babelify';
const babelify = require( 'babelify' ).configure( babelConfig );
//Source from node_modules are not transpiled by default!!
//The above example will transform all files except those in the node_modules
//directory that are not in node_modules/whatwg-fetch.

/**----------------------------------------------------------------
 * PATH CONFIG
 */
const infile = 'index.js';
const entry = `./src/${infile}`;
const outdir = './dist';
//const outfile = `${outdir}/bundle.js`;
const outfile = 'bundle.js';
const mainSCSS = './app/scss/main.scss';
const watchSCSS = './cdn/sass/*css';

/**----------------------------------------------------------------
 * STYLE: CSS pre-processor
 */
gulp.task( 'scss', function() {
	gulp.src( mainSCSS )
		.pipe( sass( {
			outputStyle: argv.production ? 'compressed' : undefined,
			importer: importOnce, //inline css in the scss
			importOnce: {
				index: false,
				css: true,
				bower: false
			}
			/*,
						includePaths: [ resetCSS ]*/ //remove css reset
		} ).on( 'error', sass.logError ) )
		.pipe( gulp.dest( outdir ) );
} );

// TODO:60 copy images
// TODO:120 image optimization (to do only once?)
// TODO:130 web font
// TODO: rollup

/**----------------------------------------------------------------
 * DEVELOPMENT TASK
 */

gulp.task( 'watch', [ 'scss' ], function( cb ) {
	//watch stylesheet
	gulp.watch( watchSCSS, [ 'scss' ] );

	//TODO: toggle option LIVE and HMR
	//dev server
	budo( entry, {
		serve: outfile, // end point for our <script> tag
		stream: process.stdout, // pretty-print requests
		live: true, // live reload & CSS injection
		port: 8000, // port
		dir: outdir, // directory to serve
		open: argv.open, // whether to open the browser
		cors: true,
		browserify: {
			transform: [
					[ babelify, {
						global: true,
						ignore: /\/node_modules\/(?!whatwg-fetch\/)/
					} ],
					[ 'envify', { 'global': true, NODE_ENV: 'development' } ]
					//[ 'envify', { 'global': true, NODE_ENV: 'local' } ]
				]
				/*,
							plugin: hmr*/
		}
	} ).on( 'exit', cb );
} );


/**----------------------------------------------------------------
 * BUNDLING TASK
 */

gulp.task( 'bundle', [ 'scss' ], function() {

	const transform = []; //written this way to allow easy changes and trying things out.
	if ( argv.production ) {
		transform.push( [ 'envify', { global: true, _: 'purge', NODE_ENV: 'production' }, { global: true } ] );
		//TODO transform.push( rollupify );
		transform.push( [ babelify ] );
		transform.push( [ mithrilObjectify ] );
	} else {
		transform.push( [ envify( { global: true, NODE_ENV: 'development' } ), { global: true } ] );
		transform.push( [ babelify ] );
	}
	const b = browserify( entry, { transform } );
	const bundler = b.bundle();
	return bundler
		.pipe( source( infile ) )
		.pipe( streamify( uglify() ) )
		.pipe( rename( outfile ) )
		.pipe( gulp.dest( outdir ) );
} );