@echo off
echo 正在从Windows PostgreSQL导出数据...
cd /d "D:\Program Files\PostgreSQL\17\bin"
set PGPASSWORD=postgres
pg_dump.exe -U postgres -h localhost -p 5432 -d yuan_world --no-owner --no-privileges -f "d:\laozhang api claude  codegooglestudiou\yuan_world_data.sql"
echo 导出完成！文件保存在: d:\laozhang api claude  codegooglestudiou\yuan_world_data.sql
pause
