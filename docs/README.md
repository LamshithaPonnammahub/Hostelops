# HostelOps Architecture and Deployment Documentation

## 1. Request Lifecycle & Port Flow

The application receives a request from a client browser. Here is the lifecycle flow:

1. **Client Browser**: The user interacts with the React Frontend mapped to `http://localhost`. Or calls an API endpoint at `http://localhost/api/*`.
2. **Nginx Reverse Proxy (Container: port 80)**:
   - Evaluates the route. If it matches `/`, Nginx serves the static React bundle generated at build time.
   - If it matches `/api/`, Nginx proxies the traffic via an internal Docker network to the Backend container.
3. **Backend Container (Container: port 5000)**:
   - Only exposed internally to the Docker network (`hostel_net`). The host binds port 5000 mainly for debugging capability, but Nginx proxies to `http://backend:5000` via DNS resolution.
   - The Express server connects to the database via internal DNS.
4. **Database Container (Container: port 5432)**:
   - The PostgreSQL instance performs the query and returns results back up the chain.

## 2. Port Binding & Firewall Strategy

**Network Security Philosophy:** Give zero access unless absolutely requested.

- **Port 80 (HTTP):** **Opened/Bound to Host.** Essential for all user access. Nginx handles both React assets and backend proxying.
- **Port 5000 (Backend API):** We have chosen to expose this for the capstone debugging, but in absolute strict production, it wouldn't need to be exposed to the host system—only to the internal `hostel_net` docker network for Nginx to proxy. Nginx communicates with `http://backend:5000` internally.
- **Port 5432 (PostgreSQL):** Exposed only for Database debugging via PgAdmin/DBeaver. The backend container communicates with the `db` hostname internally, so we don't depend on opening this port to the public.

**Firewall Configuration Strategy for Production:**
`sudo ufw allow 80/tcp`
`sudo ufw default deny incoming`
`sudo ufw default allow outgoing`

## 3. Serverful vs Serverless (Conceptual Comparison)

As part of our deployment strategy, an evaluation between the two architectural frameworks was noted:

| Aspect | Serverful (Our Docker Strategy) | Serverless (e.g., AWS Lambda) |
| :--- | :--- | :--- |
| **Control** | Full control over the container, reverse proxy (Nginx), and PostgreSQL orchestration. | Less control. Provider manages operating system and runtime execution environments. |
| **State** | Can maintain persistent connections and background tasks (Daemon-like processes). | Ephemeral. Each execution spins up and spins down meaning persistent DB connections need pooling via Proxy. |
| **Costs** | Predictable monthly overhead (cost of VPS/Server instance). | "Pay per execution", potentially very cheap for low traffic, but can spike unexpectedly. |
| **Latency** | Millisecond responses as containers are constantly running. | Cold-start latency if a function is invoked after a long idle period. |

## 4. Docker and Nginx Explanations

### Docker Build Philosophy
- **Node Backend (`backend/Dockerfile`)**: Copies the logic, installs dependencies, exposes `5000` and ensures `npm start` manages the execution via `node`.
- **Nginx Frontend & Proxy (`nginx/Dockerfile`)**:
    - **Stage 1 (Build)**: A throwaway container with `node:20` compiles the Vite-based React project down to static HTML/JS/CSS assets.
    - **Stage 2 (Run)**: Takes a minimal `nginx:alpine` image, copies the resultant assets to `/usr/share/nginx/html`, and overrides the default Nginx configuration (`default.conf`) with our custom reverse proxying rules.

### Nginx Routing Config
The custom Nginx configuration relies on checking prefixes:
- `location /` specifies a `try_files` rule that enforces Single Page Application (SPA) routing. All unknown frontend routes redirect to `index.html`.
- `location /api/` triggers a `proxy_pass http://backend:5000`. Crucially, Nginx modifies HTTP headers (such as `Host`, `X-Real-IP`, `X-Forwarded-For`) to ensure the Node Express instance knows the origin IP of the true request.
