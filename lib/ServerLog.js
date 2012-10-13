/**
 * # ServerLog
 * 
 * Copyright(c) 2012 Stefano Balietti
 * MIT Licensed
 *
 * Handles the log stream to file and to stdout
 * 
 * ---
 * 
 */
 
// ## Global scope

var util = require('util'),
	fs = require('fs'),
	path = require('path');

var JSUS = require('nodegame-client').JSUS;

ServerLog.verbosity_levels = require('nodegame-client').verbosity_levels;

module.exports = ServerLog;

var defaultLogDir = __dirname + './../log';

/**
 * ## ServerLog constructor
 * 
 * Creates an instance of ServerLog
 * 
 * @param {object} options The configuration options for the SeverLog
 */
function ServerLog (options) {
	
	this.name = options.name || 'Noname';
	this.verbosity = ('undefined' !== typeof options.verbosity) ? options.verbosity : 1;
	this.dumpmsg = ('undefined' !== typeof options.dumpmsg) ? options.dumpmsg : false;
	this.dumpsys = ('undefined' !== typeof options.dumpsys) ? options.dumpsys : true;
	this.logdir = path.normalize(options.logdir || defaultLogDir);
	this.logdir = path.resolve(this.logdir);
		
	this.checkLogDir();
	
	this.sysfile = path.normalize(options.sysfile || this.logdir + '/syslog');
	this.msgfile = path.normalize(options.msgfile || this.logdir + '/messages');
			
	if (this.dumpsys) {
		try {
			this.logSysStream = fs.createWriteStream( this.sysfile, {'flags': 'a'});
			this.log('Log of System Messages active');
		}
		catch (e) {
			this.log('System Messages log could not be started');
		}
	}
	
	if (this.dumpmsg) {
		try {
			this.logMsgStream = fs.createWriteStream( this.msgfile, {'flags': 'a'});
			this.log('Log of Messages active');
		}
		catch (e) {
			this.log('Msg Log could not be started');
		}
	}	
};


//## ServerLog methods

/**
 * ### ServerLog.checkLogDir
 * 
 * Creates the log directory if not existing
 * 
 */
ServerLog.prototype.checkLogDir = function() {
	// skip warning for node 8
	if ('undefined' !== typeof fs.existsSync) {
		if (!fs.existsSync(this.logdir)) {
			fs.mkdirSync(this.logdir, 0755);
		}
	}
	else if (!path.existsSync(this.logdir)) {
		fs.mkdirSync(this.logdir, 0755);
	}
};

/**
 * ### ServerLog.log
 * 
 * Logs a string to stdout and to file, depending on
 * the current log-level and the  configuration options 
 * for the current ServerLog instance
 * 
 * @param {string} text The string to log
 * @param {string|Number} level The log level for this log 
 * 
 */
ServerLog.prototype.log = function (text, level) {
	level = level || 0;
	if ('string' === typeof level) {
		level = ServerLog.verbosity_levels[level];
	}
	if (this.verbosity > level) {
		this.console(text);
		if (this.logSysStream) {
			this.sys(text,level);
		}
	}
};

/**
 * ### ServerLog.console
 * 
 * Fancifies the output to console
 * 
 * @param {object|string} data The text to log
 * @param {string} type A flag that determines the color of the output
 */
ServerLog.prototype.console = function(data, type){
	
	var ATT = '0;32m'; // green text;
	
	switch (type) {
		
		case 'ERR':
			ATT = '0;31m'; // red text;
			break;
			
		case 'WARN':
			ATT = '0;37m'; // gray text;
			break;
	}
		
	util.log("\033[" + ATT + this.name + '\t' + data.toString() + "\033[0m");
};

/**
 * ### ServerLog.msg
 * 
 * Dumps a game message to game messages file, as defined in the
 * constructor
 * 
 * @param {GameMSg} gameMsg The game message to dump
 * 
 */
ServerLog.prototype.msg = function(gameMsg) {	
	if (!this.logMsgStream) return;
	this.logMsgStream.write(this.name + ',\t' + gameMsg);
};

/**
 * ### ServerLog.sys
 * 
 * Dumps a string to the syslog file, as defined in the constructor
 * 
 * @param {string} text The text to dump
 * 
 */ 
ServerLog.prototype.sys = function(text) {
	if (!this.logSysStream) return;	
	text = JSUS.getDate() + ', ' + this.name + ' ' + text;
	this.logSysStream.write(text + '\n');	
	
};

/**
 * ### ServerLog.close
 * 
 * Closes open output streams
 */
ServerLog.prototype.close = function() {
	if (this.logSysStream) this.logSysStream.close();
	if (this.logMsgStream) this.logMsgStream.close();
};