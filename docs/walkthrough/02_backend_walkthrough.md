# 后端业务模块 Walkthrough

> 对应 TODO.md §2「后端业务」

## 完成项

- NestJS 11 + Mongoose 8 基础脚手架
- 全局组件链（JwtAuthGuard / ResponseInterceptor / HttpExceptionFilter）
- ConfigModule + 三段 config（app / database / jwt）
- User 模块（Schema + Service）
- Auth 模块（register / login + JwtStrategy）
- Task 模块（get-list / create / update / delete）
- DefaultException + class-validator DTO 校验

## 启动流程

```bash
# 1. 复制环境变量
cp apps/backend/.env.example apps/backend/.env

# 2. 确保 MongoDB 在 27017 端口运行

# 3. 启动开发模式（自动先 build shared）
pnpm dev:backend
```

## 请求生命周期

```
Client Request
  → ValidationPipe（DTO 白名单校验）
    → JwtAuthGuard（检查 @Public 或验证 Bearer Token）
      → Controller（解析入参，调用 Service）
        → Service（业务逻辑，操作 Mongoose Model）
          → 返回数据
        ← ResponseInterceptor 包装为 { code: 0, data, message: 'success' }
      ← 或 HttpExceptionFilter 包装为 { code: <status>, data: null, message }
```

## 模块依赖关系

```
AppModule
├── ConfigModule（全局，加载 app/database/jwt 三段配置）
├── MongooseModule（全局，连接 MongoDB）
├── UserModule
│   └── UserService（findByUsername / findById / createUser）
├── AuthModule
│   ├── 依赖 UserModule
│   ├── JwtModule（异步注册，读取 jwt config）
│   ├── PassportModule
│   ├── AuthService（register / login + bcrypt + JWT 签发）
│   └── JwtStrategy（validate 只映射 userId，不查库）
└── TaskModule
    └── TaskService（getList / getDetail / createTask / updateTask / deleteTask）
```

## 接口清单

| 接口 | 鉴权 | 入参 DTO |
|---|---|---|
| `POST /api/auth/register` | @Public | RegisterDto（username 3-32, password 6-64） |
| `POST /api/auth/login` | @Public | LoginDto（username, password） |
| `POST /api/task/get-list` | JWT | QueryTaskDto（status?, priority?） |
| `POST /api/task/create` | JWT | CreateTaskDto（title, content?, status?, priority?, dueDate?） |
| `POST /api/task/update` | JWT | UpdateTaskDto（taskId + 同 Create 可选字段） |
| `POST /api/task/delete` | JWT | DeleteTaskDto（taskId） |

## 关键设计选择

1. **全部 POST + 短划线动宾** — 对齐 AGENTS.md 第 4 条
2. **JwtStrategy.validate 不查库** — 避免每请求一次 DB 查询，存在性由 Service 按需验证
3. **DefaultException** — 业务异常统一出口，Filter 统一格式化
4. **ValidationPipe whitelist + forbidNonWhitelisted** — 未声明字段直接 400

## 涉及文件

```
apps/backend/
├── src/main.ts
├── src/app.module.ts
├── src/config/{app,database,jwt}.config.ts
├── src/common/
│   ├── exceptions/default.exception.ts
│   ├── filters/http-exception.filter.ts
│   ├── interceptors/response.interceptor.ts
│   ├── guards/jwt-auth.guard.ts
│   └── decorators/{public,current-user}.decorator.ts
└── src/modules/
    ├── user/{schemas/user.schema.ts, user.service.ts, user.module.ts}
    ├── auth/{dto/*, strategies/jwt.strategy.ts, auth.*.ts}
    └── task/{dto/*, schemas/task.schema.ts, task.*.ts}
```

---

*完成日期：2026-05-25*
