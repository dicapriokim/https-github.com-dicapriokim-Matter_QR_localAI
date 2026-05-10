FROM node:18-alpine

WORKDIR /app

COPY package.json .
RUN npm install --production

COPY . .

# Ensure data directory exists (although usually mounted)
RUN mkdir -p /data

EXPOSE 8099

CMD [ "npm", "start" ]
