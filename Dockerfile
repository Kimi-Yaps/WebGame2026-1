FROM nginx:alpine

# Copy custom configuration over
COPY nginx.conf /etc/nginx/nginx.conf

# Copy all your Godot exported web files into Nginx public directory
COPY . /usr/share/nginx/html/

# Expose port 8080 for Cloud Run
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
