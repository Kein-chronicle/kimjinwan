# Title
kimjinwan.com

# Contents
web, api

# Versions
Linux : ubuntu 18.04

Node : v12.18.0

Npm : 6.14.4

Web : react 16.13.1

Api : express 4.17.1

# Installation dependency
<pre>
# default update
sudo apt-get update
sudo apt-get upgrade

# Node
sudo apt-get install build-essential libssl-dev
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
source ~/.bashrc
nvm i 12
npm i -g serve

# Pm2
npm install pm2 -g

# NginX
sudo apt-get install -y nginx

# certbot
sudo apt-get install -y software-properties-common
sudo apt-get update
sudo add-apt-repository ppa:certbot/certbot
sudo apt-get update
sudo apt-get install -y python-certbot-nginx

</pre>

Mongodb
<a href="https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/#install-mongodb-community-edition-using-deb-packages" target="_blank">mongodb.com menual</a>

# Mongodb inbound setting
<pre>
sudo vi /etc/mongod.conf 

# bind ip to
0.0.0.0

sudo service mongod restart

# Can check ip inbound
netstat -tnlp
</pre>

# Clone
<pre>
git clone https://github.com/Kein-chronicle/kimjinwan.git
# Need input id, password
</pre>

# Node modules installation
<pre>
cd ~/kimjinwan/web
npm i

cd ~/kimjinwan/api
npm i
</pre>

# Api set something
<pre>
cd ~/kimjinwan/api
mkdir upload
sudo chmod 777 upload

sudo vi config.js
########################################

module.exports = {
  'adminPass' : 'your-admin-login-password',
	'secret' : 'your-SecretKeyInsert',
  'mongodbUri' : 'mongodb://your-mongodbaddress:27017/blog'
}

########################################
</pre>

# React build set
<pre>
cd ~/kimjinwan/web
npm run build
</pre>

# Pm2 start
<pre>
cd ~/kimjinwan/web
pm2 start --name "web" npm -- run prod

cd ~/kimjinwan/api
pm2 start --name "api" npm -- run start

# check running
pm2 ls
pm2 log
# control + c for exit log
</pre>

# NginX & SSL setting
<pre>
sudo vi /etc/nginx/sites-enabled/default

# block all default 80 site set
# And insert in last line

##########################################
upstream upstream1 {
        server your-local-ip(aws private ip):3000;
}

server {
       listen 80;
       listen [::]:80;

       server_name your-api-site-name(api-dns-address);

       location / {
                proxy_set_header Host $host;
                proxy_pass http://upstream1;
       }
}

upstream upstream2 {
        server your-local-ip(aws private ip):3030;
}

server {
       listen 80;
       listen [::]:80;

       server_name your-web-site-name(web-dns-address, if you have couple of doman, can input with ' '(blank));

       location / {
                proxy_set_header Host $host;
                proxy_pass http://upstream2;
       }
}
##########################################

# check nginx setting success
sudo nginx -t

# if get fail, find error

sudo nginx restart

# SSL setting with certbot
sudo certbot --nginx -d your-site-name -d your-site-name (you can input domains like this : -d your-site-name)

# SSL reset true set
sudo certbot renew --dry-run
</pre>

# Complete

Anyone can use this code set
