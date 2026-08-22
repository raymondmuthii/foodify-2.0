const jsonServer = require("json-server");
const cors = require("cors");
const path = require("path");
const { router: authRouter } = require("./auth");

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, "db", "db.json"));
const middlewares = jsonServer.defaults();

server.use(cors());
server.use(jsonServer.bodyParser);
server.use(middlewares);

// Auth endpoints (signup / login / logout / me) — SQLite backed
server.use("/api/auth", authRouter);

// Existing recipe data (json-server, backed by db/db.json)
server.use(router);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`JSON Server is running on http://localhost:${PORT}`);
});
