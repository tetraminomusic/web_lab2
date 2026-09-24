#!/bin/bash

BASE_URL="http://localhost:8080/fcgi-bin/hello-world.jar"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

TOTAL=0
PASSED=0
FAILED=0

run_test() {
  local name="$1"
  local query="$2"
  local expected_status="$3"
  local expected_inside="$4"
  
  TOTAL=$((TOTAL + 1))
  
  response=$(curl -s -w "\n%{http_code}" "${BASE_URL}${query}")
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" != "$expected_status" ]; then
    echo -e "${RED}[FAIL]${NC} $name"
    echo "   Ожидался статус: $expected_status, получен: $http_code"
    echo "   Ответ: $body"
    FAILED=$((FAILED + 1))
    return
  fi
  
  if [ "$expected_status" == "200" ] && [ "$expected_inside" != "none" ]; then
    if echo "$body" | grep -q "\"inside\":${expected_inside}"; then
      echo -e "${GREEN}[PASS]${NC} $name (inside=${expected_inside})"
      PASSED=$((PASSED + 1))
    else
      echo -e "${RED}[FAIL]${NC} $name"
      echo "   Ожидалось: inside=${expected_inside}"
      echo "   Ответ сервера: $body"
      FAILED=$((FAILED + 1))
    fi
  else
    echo -e "${GREEN}[PASS]${NC} $name (Статус: $http_code)"
    PASSED=$((PASSED + 1))
  fi
}

echo -e "${BOLD}ЗАПУСК ТЕСТОВ СЕРВЕРА${NC}\n"

echo -e "${BOLD}--- 1. Геометрические границы (R=3) ---${NC}"
run_test "Центр координат (0, 0)" "?x=0&y=0&r=3" "200" "true"
run_test "1 Четверть: Граница круга на X (3, 0)" "?x=3&y=0&r=3" "200" "true"
run_test "1 Четверть: Граница круга на Y (0, 3)" "?x=0&y=3&r=3" "200" "true"
run_test "1 Четверть: Внутри круга (1, 1)" "?x=1&y=1&r=3" "200" "true"
run_test "1 Четверть: Вылет за пределы круга (3, 3)" "?x=3&y=3&r=3" "200" "false"

run_test "2 Четверть: (-1, 1)" "?x=-1&y=1&r=3" "200" "false"
run_test "2 Четверть: (-3, 3)" "?x=-3&y=3&r=3" "200" "false"

run_test "3 Четверть: Точка у границы квадрата (-3, -2.99)" "?x=-3&y=-2.99&r=3" "200" "true"
run_test "3 Четверть: Внутри квадрата (-1, -1)" "?x=-1&y=-1&r=3" "200" "true"

run_test "4 Четверть: Вершина треугольника на X (1, 0)" "?x=1&y=0&r=3" "200" "true"
run_test "4 Четверть: Точка у вершины Y (0, -2.99)" "?x=0&y=-2.99&r=3" "200" "true"
run_test "4 Четверть: Точка на прямой (1, -1)" "?x=1&y=-1&r=3" "200" "true"
run_test "4 Четверть: Вылет за треугольник (1, -2)" "?x=1&y=-2&r=3" "200" "false"

echo -e "\n${BOLD}--- 2. Проверка валидации данных ---${NC}"
run_test "Y на границе -3 (запрещено)" "?x=0&y=-3.0&r=3" "400" "none"
run_test "Y ниже границы (y=-3.1)" "?x=-1&y=-3.1&r=3" "400" "none"
run_test "Y на границе 5 (запрещено)" "?x=0&y=5&r=3" "400" "none"
run_test "Y за пределами (y=5.1)" "?x=0&y=5.1&r=3" "400" "none"
run_test "Y за пределами (y=-10)" "?x=0&y=-10&r=3" "400" "none"
run_test "X не из множества (x=1.5)" "?x=1.5&y=0&r=3" "400" "none"
run_test "X за пределами (x=10)" "?x=10&y=0&r=3" "400" "none"
run_test "Радиус R=0" "?x=0&y=0&r=0" "400" "none"
run_test "Радиус R=-3" "?x=0&y=0&r=-3" "400" "none"
run_test "Строка вместо числа (x=abc)" "?x=abc&y=1&r=3" "400" "none"
run_test "Дробное число через запятую (y=1,5)" "?x=0&y=1,5&r=3" "200" "true"

echo -e "\n${BOLD}--- 3. Запрос истории ---${NC}"
run_test "Пустой запрос" "" "200" "none"

echo -e "\n=============================================="
echo -e "${BOLD}ИТОГИ ТЕСТИРОВАНИЯ:${NC}"
echo -e "Всего проверок: $TOTAL"
echo -e "Успешно:        ${GREEN}$PASSED${NC}"
if [ $FAILED -gt 0 ]; then
  echo -e "Провалено:      ${RED}$FAILED${NC}"
else
  echo -e "Провалено:      0"
  echo -e "\n${GREEN}${BOLD}СЕРВЕР ПОЛНОСТЬЮ ПРОШЕЛ ВСЕ ТЕСТЫ!${NC}"
fi
echo "=============================================="
