/*
  Base inicial de autenticacion para Reembolsos BUAP (SQL Server)
  - Login por ID de trabajador o matricula
  - Roles: admin, trabajador
  - Solo admin crea nuevos usuarios (controlado en backend)
  - Politica de contrasena: minimo 8 alfanumericos (controlado en backend)
*/

SET XACT_ABORT ON;
GO

BEGIN TRY
  BEGIN TRANSACTION;

  IF OBJECT_ID('dbo.roles', 'U') IS NULL
  BEGIN
    CREATE TABLE dbo.roles (
      role_id        TINYINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
      role_code      VARCHAR(20) NOT NULL,
      role_name      NVARCHAR(80) NOT NULL,
      created_at     DATETIME2(0) NOT NULL CONSTRAINT DF_roles_created_at DEFAULT SYSUTCDATETIME(),
      CONSTRAINT UQ_roles_role_code UNIQUE (role_code)
    );
  END;

  IF OBJECT_ID('dbo.users', 'U') IS NULL
  BEGIN
    CREATE TABLE dbo.users (
      user_id              BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
      username             VARCHAR(30) NOT NULL,
      full_name            NVARCHAR(140) NOT NULL,
      password_hash        VARCHAR(255) NOT NULL,
      role_id              TINYINT NOT NULL,
      is_active            BIT NOT NULL CONSTRAINT DF_users_is_active DEFAULT 1,
      is_blocked           BIT NOT NULL CONSTRAINT DF_users_is_blocked DEFAULT 0,
      failed_attempts      SMALLINT NOT NULL CONSTRAINT DF_users_failed_attempts DEFAULT 0,
      last_login_at        DATETIME2(0) NULL,
      created_by_user_id   BIGINT NULL,
      created_at           DATETIME2(0) NOT NULL CONSTRAINT DF_users_created_at DEFAULT SYSUTCDATETIME(),
      updated_at           DATETIME2(0) NOT NULL CONSTRAINT DF_users_updated_at DEFAULT SYSUTCDATETIME(),
      deleted_at           DATETIME2(0) NULL,
      CONSTRAINT FK_users_roles FOREIGN KEY (role_id) REFERENCES dbo.roles(role_id),
      CONSTRAINT FK_users_created_by FOREIGN KEY (created_by_user_id) REFERENCES dbo.users(user_id)
    );

    CREATE UNIQUE INDEX UX_users_username_active
      ON dbo.users (username)
      WHERE deleted_at IS NULL;

    CREATE INDEX IX_users_role_id ON dbo.users(role_id);
    CREATE INDEX IX_users_created_by_user_id ON dbo.users(created_by_user_id);
  END;

  IF OBJECT_ID('dbo.auth_login_attempts', 'U') IS NULL
  BEGIN
    CREATE TABLE dbo.auth_login_attempts (
      login_attempt_id     BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
      user_id              BIGINT NULL,
      username_entered     VARCHAR(30) NOT NULL,
      ip_address           VARCHAR(64) NULL,
      user_agent           NVARCHAR(400) NULL,
      is_success           BIT NOT NULL,
      failure_reason       NVARCHAR(160) NULL,
      attempted_at         DATETIME2(0) NOT NULL CONSTRAINT DF_auth_login_attempts_attempted_at DEFAULT SYSUTCDATETIME(),
      CONSTRAINT FK_auth_login_attempts_users FOREIGN KEY (user_id) REFERENCES dbo.users(user_id)
    );

    CREATE INDEX IX_auth_login_attempts_username_attempted_at
      ON dbo.auth_login_attempts (username_entered, attempted_at DESC);

    CREATE INDEX IX_auth_login_attempts_user_id_attempted_at
      ON dbo.auth_login_attempts (user_id, attempted_at DESC);
  END;

  IF OBJECT_ID('dbo.auth_sessions', 'U') IS NULL
  BEGIN
    CREATE TABLE dbo.auth_sessions (
      session_id           UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_auth_sessions_id DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
      user_id              BIGINT NOT NULL,
      refresh_token_hash   VARCHAR(255) NOT NULL,
      issued_at            DATETIME2(0) NOT NULL CONSTRAINT DF_auth_sessions_issued_at DEFAULT SYSUTCDATETIME(),
      expires_at           DATETIME2(0) NOT NULL,
      revoked_at           DATETIME2(0) NULL,
      revoke_reason        NVARCHAR(160) NULL,
      created_ip           VARCHAR(64) NULL,
      created_user_agent   NVARCHAR(400) NULL,
      CONSTRAINT FK_auth_sessions_users FOREIGN KEY (user_id) REFERENCES dbo.users(user_id),
      CONSTRAINT UQ_auth_sessions_refresh_token_hash UNIQUE (refresh_token_hash)
    );

    CREATE INDEX IX_auth_sessions_user_id ON dbo.auth_sessions(user_id);
    CREATE INDEX IX_auth_sessions_expires_at ON dbo.auth_sessions(expires_at);
  END;

  IF OBJECT_ID('dbo.admin_user_actions', 'U') IS NULL
  BEGIN
    CREATE TABLE dbo.admin_user_actions (
      action_id            BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
      admin_user_id        BIGINT NOT NULL,
      target_user_id       BIGINT NOT NULL,
      action_code          VARCHAR(30) NOT NULL,
      action_note          NVARCHAR(300) NULL,
      created_at           DATETIME2(0) NOT NULL CONSTRAINT DF_admin_user_actions_created_at DEFAULT SYSUTCDATETIME(),
      CONSTRAINT FK_admin_user_actions_admin FOREIGN KEY (admin_user_id) REFERENCES dbo.users(user_id),
      CONSTRAINT FK_admin_user_actions_target FOREIGN KEY (target_user_id) REFERENCES dbo.users(user_id)
    );

    CREATE INDEX IX_admin_user_actions_admin_user_id ON dbo.admin_user_actions(admin_user_id, created_at DESC);
    CREATE INDEX IX_admin_user_actions_target_user_id ON dbo.admin_user_actions(target_user_id, created_at DESC);
  END;

  IF NOT EXISTS (SELECT 1 FROM dbo.roles WHERE role_code = 'admin')
  BEGIN
    INSERT INTO dbo.roles (role_code, role_name)
    VALUES ('admin', N'Administrador');
  END;

  IF NOT EXISTS (SELECT 1 FROM dbo.roles WHERE role_code = 'trabajador')
  BEGIN
    INSERT INTO dbo.roles (role_code, role_name)
    VALUES ('trabajador', N'Trabajador');
  END;

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0
    ROLLBACK TRANSACTION;
  THROW;
END CATCH;
GO

/*
  Seed sugerido (ejecutar manualmente con hash real Argon2/bcrypt):

  DECLARE @admin_role_id TINYINT = (SELECT role_id FROM dbo.roles WHERE role_code = 'admin');

  INSERT INTO dbo.users (username, full_name, password_hash, role_id)
  VALUES ('ADMIN001', N'Administrador Inicial', '<HASH_REAL_AQUI>', @admin_role_id);
*/
