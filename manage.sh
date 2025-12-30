#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Determine docker-compose command
if command -v docker-compose &> /dev/null; then
  DOCKER_COMPOSE="docker-compose"
else
  DOCKER_COMPOSE="docker compose"
fi

# Check if we need sudo for docker
if ! docker info &> /dev/null 2>&1; then
  # Try with sudo
  if sudo docker info &> /dev/null 2>&1; then
    echo -e "${YELLOW}Note: Using sudo for Docker commands${NC}"
    echo -e "${YELLOW}To avoid this, log out and back in after Docker installation${NC}"
    echo
    DOCKER_COMPOSE="sudo $DOCKER_COMPOSE"
  fi
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Управление магазином Мотыля${NC}"
echo -e "${BLUE}========================================${NC}"
echo

# Меню
echo -e "${GREEN}Выберите действие:${NC}"
echo "1) Посмотреть статус контейнеров"
echo "2) Посмотреть логи"
echo "3) Перезапустить приложение"
echo "4) Остановить приложение"
echo "5) Запустить приложение"
echo "6) Полная пересборка"
echo "7) Создать резервную копию БД"
echo "8) Выход"
echo

read -p "Введите номер (1-8): " choice

case $choice in
  1)
    echo -e "${YELLOW}Статус контейнеров:${NC}"
    $DOCKER_COMPOSE ps
    ;;
  2)
    echo -e "${YELLOW}Логи (Ctrl+C для выхода):${NC}"
    $DOCKER_COMPOSE logs -f
    ;;
  3)
    echo -e "${YELLOW}Перезапуск...${NC}"
    $DOCKER_COMPOSE restart
    echo -e "${GREEN}Приложение перезапущено!${NC}"
    ;;
  4)
    echo -e "${YELLOW}Остановка...${NC}"
    $DOCKER_COMPOSE down
    echo -e "${GREEN}Приложение остановлено!${NC}"
    ;;
  5)
    echo -e "${YELLOW}Запуск...${NC}"
    $DOCKER_COMPOSE up -d
    echo -e "${GREEN}Приложение запущено!${NC}"
    ;;
  6)
    echo -e "${YELLOW}Полная пересборка...${NC}"
    $DOCKER_COMPOSE down
    $DOCKER_COMPOSE up -d --build
    echo -e "${GREEN}Пересборка завершена!${NC}"
    ;;
  7)
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    echo -e "${YELLOW}Создание резервной копии: $BACKUP_FILE${NC}"
    $DOCKER_COMPOSE exec -T postgres pg_dump -U motyluser motylshop > "$BACKUP_FILE"
    echo -e "${GREEN}Резервная копия сохранена: $BACKUP_FILE${NC}"
    ;;
  8)
    echo -e "${GREEN}До свидания!${NC}"
    exit 0
    ;;
  *)
    echo -e "${YELLOW}Неверный выбор!${NC}"
    ;;
esac
