# Spiritual Gifts Assessment

A simple, friendly web app for discovering and learning about spiritual gifts, built around the
**LifeWay Spiritual Gifts Survey** (80 statements, 16 gifts, © 2003 LifeWay Christian Resources, revised 2022).

Users can **learn** about the 16 gifts, **take the 80-question survey** on a 1–5 scale, and see their
results as a clear ranked chart with their top gifts highlighted — plus a reflection section to record
how they sense God may want them to serve.

## Tech

- **Backend:** FastAPI (Python) serving a static single-page frontend + `/health`
- **Frontend:** vanilla HTML/CSS/JS — no build step
- **Container:** Debian slim Python image, multi-arch friendly

## Scoring

Each of the 16 gifts is scored from 5 survey items, each answered 1–5, for a gift total of **0–25**
(matching the survey's graphing scale). Higher totals indicate apparent strength.

> Survey © 2003 LifeWay Christian Resources, revised 2022.

## Run locally

```bash
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload      # http://127.0.0.1:8000
```

## Build the container

```bash
docker build -t spiritual-gifts .
docker run -p 8000:8000 spiritual-gifts
```

## Deploy to the k3s lab

This deploys into the `spiritual-gifts` namespace on the lab k3s cluster using the local registry
(`registry.registry.svc:5000`) and a traefik ingress.

1. **Build & push the image** (kaniko, in-cluster — mirrors the pantrywise pattern):

   ```bash
   kubectl apply -f k8s/build-job.yaml     # into `registry` ns; pushes :latest
   kubectl wait --for=condition=complete job/spiritual-gifts-build -n registry --timeout=300s
   ```

2. **Deploy the app:**

   ```bash
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/deployment.yaml
   kubectl apply -f k8s/service.yaml
   kubectl apply -f k8s/ingress.yaml
   ```

3. Access it at **http://spiritual-gifts.k3s.lab.danielsson.us.com** on the lab network.

### Tailscale access

The app is also exposed on the tailnet via the Tailscale operator (ingressClass `tailscale`):

```bash
kubectl apply -f k8s/tailscale-ingress.yaml
```

It becomes reachable at
**https://spiritual-gifts-spiritual-gifts-ts-ingress.tail7f3c08.ts.net**
(MagicDNS, port 443).

> The lab cluster's Tailscale operator is pinned to **v1.80.0** because newer
> versions require `ValidatingAdmissionPolicy` (Kubernetes ≥ 1.31), which k3s v1.26.5
> does not provide.

### Manifests

| File | Purpose |
|------|---------|
| `k8s/namespace.yaml` | `spiritual-gifts` namespace |
| `k8s/build-job.yaml` | kaniko image build (clone → build → push) |
| `k8s/deployment.yaml` | Deployment (1 replica, probes, resource limits) |
| `k8s/service.yaml` | Service `web:80 → 8000` |
| `k8s/ingress.yaml` | traefik ingress → `spiritual-gifts.k3s.lab.danielsson.us.com` |
| `k8s/tailscale-ingress.yaml` | Tailscale ingress → MagicDNS hostname |