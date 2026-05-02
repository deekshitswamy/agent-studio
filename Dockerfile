FROM node:22-alpine

WORKDIR /workspace

ENV HOST=0.0.0.0
ENV PORT=3000

COPY . /workspace

EXPOSE 3000

CMD ["node", "server/agent-service.js"]
