ssh -t root@138.197.151.119 "cd /usr/src/app/ccm-com  && git pull origin master && pm2 restart server.js"