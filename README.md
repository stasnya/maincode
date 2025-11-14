## Docker deployment лог

### Перевірка Docker
```bash
docker run hello-world
```

**Результат:**
```text
latest: Pulling from library/hello-world
17eec7bbc9d7: Pull complete
Digest: sha256:56433a6be3fda188089fb548eae3d91df3ed0d6589f7c2656121b911198df065
Status: Downloaded newer image for hello-world:latest

Hello from Docker!
This message shows that your installation appears to be working correctly.
```

---

### Побудова Docker-образу API
```bash
docker build -t music-catalog-api:1.0.0 ./backend
```

**Скорочений лог:**
```text
[+] Building 1.5s (11/11) FINISHED
 => exporting to image
 => => naming to docker.io/library/music-catalog-api:1.0.0
 => => unpacking to docker.io/library/music-catalog-api:1.0.0
```

---

### Запуск проєкту через docker compose
```bash
docker compose up -d --build
```

**Скорочений лог:**
```text
[+] Building 5.7s (28/28) FINISHED
[+] Running 5/5
 ✔ maincode-api Built
 ✔ maincode-web Built
 ✔ Network maincode_default Created
 ✔ Container music_catalog_api Started
 ✔ Container music_catalog_web Started
```

---

### Зупинка та видалення контейнерів
```bash
docker compose down
```

**Лог:**
```text
[+] Running 3/3
 ✔ Container music_catalog_web Removed
 ✔ Container music_catalog_api Removed
 ✔ Network maincode_default Removed
```

---

### Перевірка здоров’я API
```bash
curl http://localhost:5000/api/health
```

**Відповідь:**
```json
{"status":"ok"}
```