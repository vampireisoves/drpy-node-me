FROM node:22-alpine

WORKDIR /app

COPY drpy-node-mcp/package*.json ./

RUN npm install

COPY drpy-node-mcp/ .

RUN mkdir -p /project && \
    ln -s /project/libs_drpy /libs_drpy && \
    ln -s /project/utils /utils && \
    ln -s /project/controllers /controllers && \
    ln -s /project/config /config && \
    ln -s /project/spider /spider && \
    ln -s /project/libs /libs

EXPOSE 57579

CMD ["node", "index.js"]
