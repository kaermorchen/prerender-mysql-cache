# prerender-mysql-cache

MySQL storage for prerendered HTML.
Automatically creates a table 'pages' and stores the processed HTML.

#Installation:

    npm install prerender-mysql-cache

Edit server.js:

    process.env.PRERENDER_MYSQL_CACHE_MYSQL_URL = "mysql://user:pass@host/db";

    //If you want to updated cache, specify time life in seconds
    process.env.PRERENDER_MYSQL_CACHE_REFRESH_TIME = 24 * 3600;

    server.use(require('prerender-mysql-cache'));

    server.start();

