// 通用返回格式
function result(code = 0, data = null, msg = "") {
  return Response.json(
    { code, data, msg },
    {
      headers: getCorsHeaders(),
    }
  );
}

// 跨域请求头
function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  };
}

// 处理 OPTIONS 预检请求
function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}

// 鉴权
async function checkAuth(request, env) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const validToken = env.API_TOKEN || "test-token-123";
  return token === validToken;
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const { path } = params;
  const method = request.method;

  // 跨域预检直接返回
  if (method === "OPTIONS") return handleOptions();

  // 白名单
  const openPaths = ["", "hello", "login"];
  const needAuth = !openPaths.includes(path);

  if (needAuth) {
    const ok = await checkAuth(request, env);
    if (!ok) return result(401, null, "请先登录");
  }

  try {
    // /api
    if (!path) {
      return result(0, { name: "CF Pages API" }, "ok");
    }

    // /api/hello
    if (path === "hello") {
      return result(0, { msg: "hello world" });
    }

    // /api/login
    if (path === "login" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      const { username, password } = body;

      if (username === "admin" && password === "123456") {
        return result(0, { token: env.API_TOKEN || "test-token-123" }, "登录成功");
      }
      return result(403, null, "账号或密码错误");
    }

    // /api/user/info
    if (path === "user/info") {
      return result(0, {
        id: 1,
        nickname: "测试用户",
      });
    }

    return result(404, null, "接口不存在");
  } catch (err) {
    return result(500, null, "服务器错误：" + err.message);
  }
}