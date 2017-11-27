# How to run vam webconfig api

## first time create persistence storage
```
docker volume create eslab_vam_api_data_db
docker volume create eslab_vam_api_data_uploads
```

## Run Container
```
docker run --restart=always -d -p 8000:8000 -v eslab_vam_api_data_db:/home/root/db -v eslab_vam_api_data_uploads:/home/root/uploads --name "webconfig-api" embedded-performance-server.local:5000/eslab/webconfig-api:latest 
```