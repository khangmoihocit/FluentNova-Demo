# Giai đoạn 1: Build ứng dụng React với Node 24.12.0
FROM node:24.12.0-alpine AS build_stage
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Giai đoạn 2: Sử dụng Nginx để phục vụ các file đã build
FROM nginx:alpine
# Copy thư mục build sang thư mục của Nginx
COPY --from=build_stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Mở cổng 80 cho web
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]