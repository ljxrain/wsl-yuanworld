@echo off
chcp 65001
echo ========================================
echo PostgreSQL 数据库导出工具
echo ========================================
echo.

REM 测试不同的端口
set PGPATH=D:\Program Files\PostgreSQL\17\bin
set PGPASSWORD=postgres
set OUTFILE=d:\laozhang api claude  codegooglestudiou\yuan_world_data.sql

echo 测试PostgreSQL连接...
echo.

REM 先测试5432端口
echo [1/2] 尝试端口 5432...
"%PGPATH%\psql.exe" -U postgres -h localhost -p 5432 -d yuan_world -c "SELECT COUNT(*) FROM users;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo     ✓ 端口 5432 连接成功！
    set PGPORT=5432
    goto :export
)

REM 再测试5433端口
echo [2/2] 尝试端口 5433...
"%PGPATH%\psql.exe" -U postgres -h localhost -p 5433 -d yuan_world -c "SELECT COUNT(*) FROM users;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo     ✓ 端口 5433 连接成功！
    set PGPORT=5433
    goto :export
)

echo.
echo ✗ 连接失败！无法连接到PostgreSQL
echo.
echo 请检查：
echo 1. PostgreSQL服务是否运行
echo 2. 用户名密码是否正确（postgres/postgres）
echo 3. 数据库yuan_world是否存在
echo.
pause
exit /b 1

:export
echo.
echo ========================================
echo 开始导出数据...
echo ========================================
echo 端口: %PGPORT%
echo 数据库: yuan_world
echo 输出: %OUTFILE%
echo.

"%PGPATH%\pg_dump.exe" -U postgres -h localhost -p %PGPORT% -d yuan_world --no-owner --no-privileges -f "%OUTFILE%" 2>&1

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✓ 导出成功！
    echo ========================================
    dir "%OUTFILE%"
) else (
    echo.
    echo ✗ 导出失败！错误代码: %ERRORLEVEL%
)

echo.
pause
