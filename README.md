# prerender-mysql-cache

MySQL storage for prerendered HTML.
Automatically creates a table 'pages' and stores the processed HTML.

#Installation:

    npm install prerender-mysql-cache

Edit server.js:

    process.env.PRERENDER_MYSQL_CACHE_MYSQL_URL = "mysql://user:pass@host/db";
    server.use(require('prerender-mysql-cache'));

    server.start();

