#!/bin/sh
# Temporary local verification for scripts/list-build-services.sh
PATH="/usr/bin:/bin:/c/Program Files/Docker/Docker/resources/bin"
export PATH

OUT=/c/Users/User/Downloads/restpoint/.verify-out.txt
: > "$OUT"

echo "== which awk/docker ==" >> "$OUT"
command -v awk >> "$OUT" 2>&1
command -v docker >> "$OUT" 2>&1

echo "== dev services ==" >> "$OUT"
sh scripts/list-build-services.sh >> "$OUT" 2>&1
echo "dev_exit=$?" >> "$OUT"

echo "== prod services ==" >> "$OUT"
sh scripts/list-build-services.sh docker-compose.prod.yml >> "$OUT" 2>&1
echo "prod_exit=$?" >> "$OUT"

echo "== prod image-list ==" >> "$OUT"
sh scripts/list-build-services.sh docker-compose.prod.yml --image-list >> "$OUT" 2>&1
echo "imagelist_exit=$?" >> "$OUT"

echo "== dev service count ==" >> "$OUT"
sh scripts/list-build-services.sh | wc -l >> "$OUT" 2>&1

echo "== prod service count ==" >> "$OUT"
sh scripts/list-build-services.sh docker-compose.prod.yml | wc -l >> "$OUT" 2>&1

echo "== florist present? ==" >> "$OUT"
sh scripts/list-build-services.sh docker-compose.prod.yml | grep -c '^florist-service$' >> "$OUT" 2>&1

echo "== infra excluded (expect 0)? ==" >> "$OUT"
sh scripts/list-build-services.sh docker-compose.prod.yml | grep -cE '^(mariadb|redis|rabbitmq)$' >> "$OUT" 2>&1

echo "== dockerfiles mode (prod) ==" >> "$OUT"
sh scripts/list-build-services.sh docker-compose.prod.yml dockerfiles >> "$OUT" 2>&1

echo "== dockerfiles all exist? (expect 0 failures) ==" >> "$OUT"
FAILN=0
for f in $(sh scripts/list-build-services.sh docker-compose.prod.yml dockerfiles); do
  [ -f "$f" ] || { echo "MISSING: $f" >> "$OUT"; FAILN=$((FAILN+1)); }
done
echo "missing_count=$FAILN" >> "$OUT"

echo "== empty-list guard: bogus compose file (expect exit 1) ==" >> "$OUT"
sh scripts/list-build-services.sh /nonexistent-file.yml >> "$OUT" 2>&1
echo "bogus_exit=$?" >> "$OUT"

echo "== dev dockerfiles exist? (expect 0 failures) ==" >> "$OUT"
FAILD=0
for f in $(sh scripts/list-build-services.sh docker-compose.yml dockerfiles); do
  [ -f "$f" ] || { echo "MISSING-DEV: $f" >> "$OUT"; FAILD=$((FAILD+1)); }
done
echo "missing_dev_count=$FAILD" >> "$OUT"

echo "== mode-first arg order works? ==" >> "$OUT"
sh scripts/list-build-services.sh dockerfiles docker-compose.prod.yml | wc -l >> "$OUT" 2>&1
