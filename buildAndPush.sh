docker build -t vorelli/nightingale:$TAG .
docker tag vorelli/nightingale:$TAG vorelli/nightingale:latest
docker push --all-tags vorelli/nightingale
