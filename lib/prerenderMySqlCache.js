var mysql = require('mysql');
var connection = mysql.createConnection(process.env.PRERENDER_MYSQL_CACHE_MYSQL_URL);

connection.connect(function(err) {
	if (err) {
		console.error('Error MySQL connecting: ' + err.stack);
		return;
	}
});

connection.config.queryFormat = function (query, values) {
	if (!values) return query;

	return query.replace(/\:(\w+)/g, function (txt, key) {
		if (values.hasOwnProperty(key)) {
			return this.escape(values[key]);
		}

		return txt;
	}.bind(this));
};

var mysqlCache = {
	createTable: function createTableIfNotExists() {
		var createTableSql = "CREATE TABLE IF NOT EXISTS `pages` (\
								`page` VARCHAR(255) NOT NULL,\
								`data` LONGTEXT NOT NULL,\
								`updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\
								PRIMARY KEY (`page`)\
							  )\
							  COLLATE='utf8_general_ci'\
							  ENGINE=InnoDB;";

		connection.query(createTableSql, function (err, result) {
			if (err) throw err;
		});
	},

	insertPage: function(page, data, cb) {
		var insertPageSql = "INSERT INTO pages (page, `data`) VALUES (:page, :data)\
							 ON DUPLICATE KEY UPDATE `data` = :data;";

		connection.query(insertPageSql, {page: page, data: data}, cb);
	},

	getPage: function get(page, cb) {
		var getSql = "SELECT data, updated_at FROM pages WHERE page = :page LIMIT 1";

		connection.query(getSql, {page: page}, function(err, result) {
			if (err) cb(err, result);

			if (result.length) {
				if (process.env.PRERENDER_MYSQL_CACHE_REFRESH_TIME) {
					var now = new Date();
					var datePage = new Date(result[0].updated_at);
					var diff = now - datePage;

					if (diff < (process.env.PRERENDER_MYSQL_CACHE_REFRESH_TIME * 1000)) {
						cb(err, result[0].data);
					} else {
						cb(false, false);
					}
				} else {
					cb(err, result[0].data);
				}
			} else {
				cb(false, false);
			}
		});
	}
};

mysqlCache.createTable();

module.exports = {
	beforePhantomRequest: function (req, res, next) {
		if (req.method !== 'GET') return next();

		mysqlCache.getPage(req.prerender.url, function(err, result){
			if (!err && result) {
				res.send(200, result);
			} else {
				next();
			}
		});
	},

	afterPhantomRequest: function (req, res, next) {
		if(!req.prerender.documentHTML) return next();

		if (req.prerender.statusCode === 200) {
			mysqlCache.insertPage(req.prerender.url, req.prerender.documentHTML, function (err, result){
				console.log('Updated: ' + req.prerender.url);
			});
		}

		next();
	}
};
