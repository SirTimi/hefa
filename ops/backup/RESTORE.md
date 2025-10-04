# Restore

pg_restore -d "postgresql://postgres:Teo365@host:5432/hefa?schema=public" -c -j 4 hefa_YYYYMMDD_HHMMSS.dump
