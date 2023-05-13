docker buildx create --use
docker buildx build --push --platform linux/arm64/v8,linux/amd64 -t vorelli/nightingale:$TAG -t vorelli/nightingale:latest .
# docker tag vorelli/nightingale:$TAG vorelli/nightingale:latest
# docker push --all-tags vorelli/nightingale
