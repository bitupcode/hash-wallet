# HashWallet / HashTrade — План реализации MVP

## Контекст

Создаём кликабельный web-прототип (MVP) внутреннего портала Оператора цифрового депозитария и интерфейса Подписанта (Signer) для демонстрации бизнес-процессов хранения и перевода Bitcoin (BTC) с использованием технологии MPC. Всё работает на мок-данных (in-memory + localStorage persist). Никаких реальных подключений к блокчейну, Keycloak или BitOk.

---

## Стек технологий

| Компонент | Выбор |
|-----------|-------|
| Framework | Next.js (App Router) |
| UI | shadcn/ui + Tailwind CSS |
| State | Zustand + localStorage persist |
| Icons | Lucide React |
| Toasts | Sonner |
| Package manager | npm |
| Язык кода | TypeScript |
| Язык UI | Русский |
| Тема | Светлая, монохромные тёмные кнопки |

---

## Фаза 0: Настройка окружения

### Шаг 0.1: Проверить/установить Node.js
```bash
brew install node  # если не установлен
```

---

## Фаза 1: Скаффолдинг проекта

### Шаг 1.1: Создать Next.js проект
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

### Шаг 1.2: Установить зависимости
```bash
npm install zustand lucide-react sonner
```

### Шаг 1.3: Инициализировать shadcn/ui
```bash
npx shadcn@latest init
npx shadcn@latest add button card dialog input label table badge select tabs separator tooltip textarea pagination dropdown-menu alert skeleton
```

### Шаг 1.4: Настроить тему
**Файл:** `src/app/globals.css`
- Светлая тема (по умолчанию shadcn/ui)
- Монохромные тёмные кнопки
- Utility-класс для debug-элементов (dashed orange border)

### Шаг 1.5: Создать типы данных
**Файл:** `src/types/index.ts`

```typescript
// Интерфейсы: Address, Transaction, MpcSession, AuditLogEntry
// Типы: Role = "operator" | "signer1" | "signer2"
// Константы: NETWORK_FEE = 0.0005, MPC_DEADLINE_MINUTES = 5,
//            REQUIRED_SIGNATURES = 2, TOTAL_SIGNERS = 3
// Маппинг ролей: { operator: "Оператор", signer1: "Signer 1", signer2: "Signer 2" }
```

---

## Фаза 2: State Management (Zustand Stores)

### Шаг 2.1: Утилиты
**Файл:** `src/lib/utils.ts` (расширить сгенерированный shadcn)

Функции:
- `generateBtcAddress()` — случайная строка 34 символа, Base58, начинается с "1"
- `generateTxHash()` — случайная hex-строка 64 символа
- `generateId()` — crypto.randomUUID()
- `truncateAddress(addr)` — "1BvBM...VN2"
- `formatBtc(amount)` — формат до 8 знаков
- `mockDelay(ms?)` — Promise, 1000-3000ms
- `generateKytScore()` — случайное число 1-100

### Шаг 2.2: Мок-данные (seed)
**Файл:** `src/lib/mock-data.ts`

- 8 адресов (MAIN + TRANSIT, балансы 0.1-5.0 BTC, русские имена)
- 12 транзакций в разных статусах (2 DRAFT, 3 WAITING_MPC, 2 MPC_SIGNING, 3 COMPLETED, 1 REJECTED, 1 FAILED)
- MpcSession для WAITING_MPC и MPC_SIGNING транзакций
- 15-20 записей AuditLog

### Шаг 2.3: Auth Store
**Файл:** `src/store/auth-store.ts`
- `currentRole: Role` (default: "operator")
- `setRole(role)` — переключение роли
- persist в localStorage (key: `hashwallet-auth`)

### Шаг 2.4: Address Store
**Файл:** `src/store/address-store.ts`
- `addresses: Address[]`
- `createAddress(name, type)` — генерация адреса + audit log
- `addBalance(id, amount)` — debug-действие
- persist в localStorage (key: `hashwallet-addresses`)

### Шаг 2.5: Transaction Store
**Файл:** `src/store/transaction-store.ts`

Ключевая бизнес-логика:

**createTransaction(params):**
1. Валидация: amount > 0, amount + fee <= balance, fromAddress !== toAddress
2. Авто-определение типа: toAddress есть в системе → INTERNAL, иначе EXTERNAL
3. Создать Transaction со статусом WAITING_MPC
4. Создать MpcSession (deadline = now + 5 мин)
5. Баланс НЕ списывается (только при COMPLETED)
6. Записать audit log

**cancelTransaction(id):**
1. Проверить: signersApproved.length === 0 && signersRejected.length === 0
2. Статус → REJECTED
3. Audit log

**signTransaction(txId, signer, approve):**
1. Добавить signer в approved или rejected
2. Если `approved.length >= 2` → COMPLETED, списать баланс, сгенерировать txHash
3. Если `rejected.length > 1` (невозможно набрать кворум) → REJECTED
4. При первом голосе: статус → MPC_SIGNING
5. Audit log

**checkDeadlines():**
- Для каждой TX в WAITING_MPC/MPC_SIGNING: если deadline прошёл → FAILED
- Запускается каждые 10 секунд через setInterval в root layout

### Шаг 2.6: Audit Store
**Файл:** `src/store/audit-store.ts`
- `logs: AuditLogEntry[]`
- `addLog(entry)` — append-only
- persist в localStorage (key: `hashwallet-audit`)

### Шаг 2.7: Экспорты и инициализация
**Файл:** `src/store/index.ts`
- Re-export всех stores
- `useInitializeStores()` hook — загрузка seed при первом запуске

---

## Фаза 3: Layout и навигация

### Шаг 3.1: Каркас приложения

**Файлы:**
- `src/components/layout/app-shell.tsx` — Sidebar (260px) + Header (64px) + Content
- `src/components/layout/sidebar.tsx` — Фиксированное боковое меню:
  - Operator: "Адреса" (`/addresses`), "История операций" (`/history`), "Журнал аудита" (`/audit`)
  - Signer: "Очередь подписания" (`/signer/transactions`), "Журнал аудита" (`/audit`)
- `src/components/layout/header.tsx` — Заголовок с переключателем ролей:
  - 3 кнопки-табы: [Оператор] | [Signer 1] | [Signer 2]
  - Активная роль выделена (variant="default"), остальные outline
  - При смене роли → router.push на главную страницу роли
- `src/components/layout/debug-panel.tsx` — Debug-панель (видна, dashed orange border):
  - "Сбросить данные" (clear localStorage + reload)
  - "Проверить дедлайны" (ручной запуск checkDeadlines)

### Шаг 3.2: Root redirect
**Файл:** `src/app/page.tsx`
- Redirect на `/addresses`

**Файл:** `src/app/layout.tsx`
- Подключить `<Toaster />` (sonner)
- Подключить `<AppShell>`
- Запустить `useInitializeStores()` и `setInterval(checkDeadlines, 10000)`

---

## Фаза 4: Экраны Оператора — Адреса

### Шаг 4.1: Список адресов (`/addresses`)

**Файлы:**
- `src/app/addresses/page.tsx`
- `src/components/addresses/address-table.tsx` — Таблица: Адрес (сокращённый + копировать), Имя, Тип (badge), Сеть, Баланс, Дата
- `src/components/addresses/address-search.tsx` — Поиск (debounce 300ms)
- `src/components/addresses/create-address-dialog.tsx` — Модалка: Имя + Тип (MAIN/TRANSIT) + Сеть (BITCOIN, disabled)

**Общие компоненты:**
- `src/components/common/copy-button.tsx` — Копирование в буфер + toast "Скопировано"
- `src/components/common/btc-address.tsx` — Сокращённый адрес + copy button

**Детали:**
- Сортировка колонок: Имя, Баланс, Дата (клик на заголовок)
- Пагинация: 10 строк на страницу
- Строки кликабельны → `/addresses/[id]`
- Skeleton при загрузке
- Empty state при отсутствии адресов
- Диалог подтверждения при создании

### Шаг 4.2: Детали адреса (`/addresses/[id]`)

**Файлы:**
- `src/app/addresses/[id]/page.tsx`
- `src/components/addresses/address-detail.tsx` — Карточка с полной информацией
- `src/components/addresses/address-transactions.tsx` — Мини-таблица последних 5 транзакций

**Детали:**
- Breadcrumb: Адреса > [Имя адреса]
- Крупное отображение баланса
- Кнопка "Сделать перевод" (disabled если баланс < fee)
- Кнопка "[Debug: Add 1 BTC]" (dashed orange border)
- 404 если адрес не найден

### Шаг 4.3: Визард перевода (модальное окно, 3 шага)

**Файл:** `src/components/addresses/transfer-wizard.tsx`

**Шаг 1 — Ввод данных:**
- Адрес получателя (input + dropdown из существующих)
- Сумма (BTC) + кнопка "MAX" (balance - fee)
- Комментарий (textarea)
- Отображение: адрес отправителя, доступный баланс, комиссия (0.0005 BTC)
- Валидации: amount > 0, amount + fee <= balance, получатель !== отправитель

**Шаг 2 — Проверка KYT (авто):**
- Спиннер "Проверка BitOk KYT..." (задержка ~2 сек)
- Результат: score 1-20% → зелёный "Низкий риск", score 21-100% → красный Warning
- Warning НЕ блокирует перевод

**Шаг 3 — Подтверждение:**
- Сводка: от, кому, сумма, комиссия, итого, KYT score, тип (INTERNAL/EXTERNAL), комментарий
- Кнопка "Подтвердить перевод" с диалогом подтверждения
- При подтверждении: задержка → создание TX → toast → закрытие

---

## Фаза 5: Экраны Оператора — История операций

### Шаг 5.1: История транзакций (`/history`)

**Файлы:**
- `src/app/history/page.tsx`
- `src/components/transactions/transaction-table.tsx` — Таблица: ID, Тип (badge), От, Кому, Сумма, Статус (цветной badge), Дата
- `src/components/transactions/transaction-filters.tsx` — Расширенные фильтры:
  - Поиск (по хэшу, адресу, комментарию)
  - Статус (dropdown: все / конкретный)
  - Тип (INTERNAL / EXTERNAL / Все)
  - Диапазон дат (from/to)
- `src/components/transactions/transaction-detail-modal.tsx` — Модалка деталей:
  - Полная информация о TX
  - TX Hash (если COMPLETED, с copy + ссылка на Btcscan)
  - KYT score
  - MPC session (кто проголосовал, дедлайн)
  - Комментарий
  - "Отменить" (только для WAITING_MPC без голосов, только для Оператора)

**Общий компонент:**
- `src/components/common/status-badge.tsx` — Цветные бейджи:
  - DRAFT: серый
  - WAITING_MPC: жёлтый
  - MPC_SIGNING: синий
  - COMPLETED: зелёный
  - REJECTED: красный
  - FAILED: тёмно-красный

---

## Фаза 6: Экраны Подписанта (Signer)

### Шаг 6.1: Очередь подписания (`/signer/transactions`)

**Файлы:**
- `src/app/signer/transactions/page.tsx`
- `src/components/signer/signer-queue.tsx` — Таблица: TX в WAITING_MPC и MPC_SIGNING
- `src/components/signer/signer-transaction-detail.tsx` — Детали с голосованием:
  - Полная информация о TX
  - Progress bar: X/2 подписей
  - Список подписантов со статусами: Signer 1 ✔, Signer 2 ✘, Signer 3 ⏳
  - Обратный отсчёт дедлайна (live)
  - Кнопки "Подтвердить" (зелёная) / "Отклонить" (красная) с диалогами подтверждения
  - Кнопки disabled если текущий signer уже проголосовал

**Компонент:**
- `src/components/common/deadline-timer.tsx` — Таймер обратного отсчёта (MM:SS), красный при <60 сек

---

## Фаза 7: Журнал аудита

### Шаг 7.1: Страница аудита (`/audit`)

**Файлы:**
- `src/app/audit/page.tsx`
- `src/components/audit/audit-table.tsx` — Таблица: Время, Актор, Действие, Тип, ID, Детали
- Обратная хронология, пагинация 20 строк, поиск

---

## Фаза 8: Полировка

### Шаг 8.1: Toast-уведомления
Проверить все действия выдают toasts:
- "Адрес успешно создан"
- "Транзакция создана и ожидает подписания"
- "Вы подтвердили/отклонили транзакцию"
- "Транзакция завершена/отменена"
- "Баланс пополнен на 1 BTC"
- "Скопировано"
- "Транзакция истекла по таймауту"

### Шаг 8.2: Loading states
**Файл:** `src/components/common/table-skeleton.tsx`
- Skeleton-строки для всех таблиц при загрузке

### Шаг 8.3: Empty states
**Файл:** `src/components/common/empty-state.tsx`
- Иконка + заголовок + описание + опциональная кнопка действия

### Шаг 8.4: Confirmation dialogs
**Файл:** `src/components/common/confirm-dialog.tsx`
- Переиспользуемый компонент подтверждения (title, description, variant: default/destructive)
- Используется для ВСЕХ действий

### Шаг 8.5: Финальная проверка edge cases
- Запрет self-send (fromAddress === toAddress)
- Валидация баланса (amount + 0.0005 <= balance)
- Кнопка MAX (balance - 0.0005)
- Отмена Оператором только без голосов
- Трешхолд 2/3 при смешанных голосах
- Auto-FAILED по дедлайну
- INTERNAL/EXTERNAL авто-определение
- Смена роли → навигация на правильную страницу
- Persist работает при перезагрузке
- Debug reset очищает localStorage

---

## Структура файлов

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── addresses/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   ├── history/
│   │   └── page.tsx
│   ├── signer/
│   │   └── transactions/
│   │       └── page.tsx
│   └── audit/
│       └── page.tsx
├── components/
│   ├── ui/                           # shadcn/ui (авто)
│   ├── layout/
│   │   ├── app-shell.tsx
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── debug-panel.tsx
│   ├── addresses/
│   │   ├── address-table.tsx
│   │   ├── address-search.tsx
│   │   ├── address-detail.tsx
│   │   ├── address-transactions.tsx
│   │   ├── create-address-dialog.tsx
│   │   └── transfer-wizard.tsx
│   ├── transactions/
│   │   ├── transaction-table.tsx
│   │   ├── transaction-filters.tsx
│   │   └── transaction-detail-modal.tsx
│   ├── signer/
│   │   ├── signer-queue.tsx
│   │   └── signer-transaction-detail.tsx
│   ├── audit/
│   │   └── audit-table.tsx
│   └── common/
│       ├── btc-address.tsx
│       ├── copy-button.tsx
│       ├── status-badge.tsx
│       ├── deadline-timer.tsx
│       ├── table-skeleton.tsx
│       ├── empty-state.tsx
│       └── confirm-dialog.tsx
├── store/
│   ├── index.ts
│   ├── auth-store.ts
│   ├── address-store.ts
│   ├── transaction-store.ts
│   └── audit-store.ts
├── lib/
│   ├── utils.ts
│   └── mock-data.ts
└── types/
    └── index.ts
```

**Итого: ~55 файлов** (включая shadcn/ui компоненты)

---

## Ключевые архитектурные решения

1. **Списание баланса:** Только при COMPLETED (не при создании TX). Упрощает отмену/reject/fail — не нужна логика возврата.

2. **Кросс-store коммуникация:** `transaction-store` читает/пишет балансы через `useAddressStore.getState()`. Zustand поддерживает этот паттерн.

3. **Audit logging:** Каждая мутация в store вызывает `useAuditStore.getState().addLog(...)`. Логирование рядом с бизнес-действием.

4. **Проверка дедлайнов:** `setInterval` в root layout каждые 10 секунд. Таймер обратного отсчёта обновляется каждую секунду (свой interval).

5. **Определение типа TX:** При создании проверяем `toAddress` в address store. Есть → INTERNAL, нет → EXTERNAL. Вычисляется один раз.

6. **Нет routing guards:** Все роуты доступны, sidebar скрывает нерелевантные ссылки. Кнопки approve/reject проверяют роль в компоненте.

---

## Верификация

### Сценарий 1: Полный цикл перевода
1. Зайти как Оператор
2. Создать новый адрес (MAIN)
3. Debug: пополнить баланс на 1 BTC
4. Инициировать перевод на внешний адрес
5. Проверить KYT Warning (если score > 20%)
6. Подтвердить перевод
7. Переключиться на Signer 1 → одобрить
8. Переключиться на Signer 2 → одобрить
9. Проверить: TX в статусе COMPLETED, баланс уменьшился, txHash сгенерирован

### Сценарий 2: Отклонение
1. Создать TX
2. Signer 1 отклоняет
3. Signer 2 отклоняет
4. TX → REJECTED, баланс не изменился

### Сценарий 3: Таймаут
1. Создать TX
2. Подождать 5 минут (или ускорить через debug)
3. TX → FAILED

### Сценарий 4: Отмена Оператором
1. Создать TX
2. Оператор нажимает "Отменить" (до любых голосов)
3. TX → REJECTED

### Сценарий 5: Persist
1. Создать адреса и TX
2. Перезагрузить страницу
3. Данные на месте
