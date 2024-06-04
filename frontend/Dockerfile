# Stage 1: Build the React application
FROM node:14 as build
WORKDIR /app
COPY ./app/package.json ./app/package-lock.json ./
RUN npm install
COPY ./app ./
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:1.19.0-alpine
COPY --from=build /app/build /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
