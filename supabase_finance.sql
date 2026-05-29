-- Hisob raqamlari rejasi (Chart of Accounts)
create table public.chart_of_accounts (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  group_code  text not null,
  group_name  text not null,
  flow_sign   text not null check (flow_sign in ('+','-')),
  pnl_section text check (pnl_section in (
    'revenue', 'cogs', 'overhead', 'admin', 'selling', 'tax', 'depreciation', 'other_income', 'loan', 'capital', 'transfer'
  )),
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
create index on public.chart_of_accounts(group_code);
create index on public.chart_of_accounts(pnl_section);

-- Boshlang'ich hisob raqamlari
insert into public.chart_of_accounts (code, name, group_code, group_name, flow_sign, pnl_section, sort_order) values
  ('11001','Texno optom','11','Daromad','+','revenue',1),
  ('11002','Uzum market','11','Daromad','+','revenue',2),
  ('11003','Uzum nasiya','11','Daromad','+','revenue',3),
  ('11999','Boshqa tushumlar','11','Daromad','+','revenue',9),
  ('11116','Dastafka (muomo)','11','Daromad','+','revenue',10),
  ('12001','Tovarga to''lov','12','Tannarx','-','cogs',11),
  ('12999','Boshqa tannarx xarajatlari','12','Tannarx','-','cogs',12),
  ('13001','Nakladnoy xodimlar ish haqi','13','Nakladnoy','-','overhead',20),
  ('13002','Arenda','13','Nakladnoy','-','overhead',21),
  ('13005','Oziq-ovqat xarajatlari','13','Nakladnoy','-','overhead',22),
  ('13006','Tashqi yo''l kira','13','Nakladnoy','-','overhead',23),
  ('13007','Ichki yo''l kira','13','Nakladnoy','-','overhead',24),
  ('13008','Xo''jalik xarajatlari','13','Nakladnoy','-','overhead',25),
  ('13009','Konsstovar xarajati','13','Nakladnoy','-','overhead',26),
  ('13010','Yoqilg''i xarajati','13','Nakladnoy','-','overhead',27),
  ('13011','Bank xizmati','13','Nakladnoy','-','overhead',28),
  ('13012','Kommunal to''lovlar','13','Nakladnoy','-','overhead',29),
  ('13013','Texnik xarajatlar','13','Nakladnoy','-','overhead',30),
  ('13014','Dostavka xarajatlari (mijozga)','13','Nakladnoy','-','overhead',31),
  ('13999','Boshqa nakladnoy xarajatlar','13','Nakladnoy','-','overhead',32),
  ('14001','Autsorsing to''lovlar','14','Adminstrativ','-','admin',40),
  ('14002','Internet to''lovlar','14','Adminstrativ','-','admin',41),
  ('14003','Adminstrativ xodimlar ish haqi','14','Adminstrativ','-','admin',42),
  ('14004','Dasturlarga to''lovlar','14','Adminstrativ','-','admin',43),
  ('14999','Boshqa adminstrativ xarajatlar','14','Adminstrativ','-','admin',44),
  ('15001','Target va SMM xarajatlari','15','Tijoriy','-','selling',50),
  ('15002','Mehmonlarga xarajatlar','15','Tijoriy','-','selling',51),
  ('15003','Marketing bo''limi oyligi','15','Tijoriy','-','selling',52),
  ('15004','Marketing va reklama xarajatlari','15','Tijoriy','-','selling',53),
  ('15005','Safar xarajatlari','15','Tijoriy','-','selling',54),
  ('15007','Sotuv bo''limi ish haqi','15','Tijoriy','-','selling',55),
  ('15999','Boshqa tijoriy xarajatlar','15','Tijoriy','-','selling',56),
  ('16001','Aylanmadan olinadigan soliq','16','Soliq','-','tax',60),
  ('16002','NDS','16','Soliq','-','tax',61),
  ('16999','Boshqa soliqlar','16','Soliq','-','tax',62),
  ('17001','Amortizatsiya','17','Amortizatsiya','-','depreciation',70),
  ('19001','Zaxira','19','Boshqa','-','other_income',80),
  ('19002','Xayriya','19','Boshqa','-','other_income',81),
  ('19003','Dividend','19','Boshqa','-','other_income',82),
  ('20001','Qarz berildi','20','Qarz','-','loan',90),
  ('20002','Qarz qaytdi','20','Qarz','+','loan',91),
  ('20003','Qarz olindi','20','Qarz','+','loan',92),
  ('20004','Qarz qaytarildi','20','Qarz','-','loan',93),
  ('30001','Jalb qilingan investitsiya','30','Kapital','+','capital',100),
  ('30002','Asosiy vosita sotib olish','30','Kapital','-','capital',101),
  ('30003','Asosiy vositani sotishdan tushum','30','Kapital','+','capital',102),
  ('30004','Reinvestitsiya','30','Kapital','-','capital',103),
  ('30005','Rivojlantirishga','30','Kapital','-','capital',104),
  ('99999','Hisob-raqam almashinuvi','99','Transfer','+','transfer',999)
on conflict (code) do nothing;

-- Pul hisoblari (Cash Accounts)
create table public.cash_accounts (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  currency    text not null check (currency in ('UZS','USD')),
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

insert into public.cash_accounts (code, name, currency, sort_order) values
  ('CASH-UZS','Naqd','UZS',1),
  ('CASH-USD','USD','USD',2),
  ('CARD-9824','Karta 9824','UZS',3),
  ('CARD-8694','Karta 8694','UZS',4),
  ('CARD-6962','Karta 6962','UZS',5),
  ('VISA-8233','VISA 8233','UZS',6),
  ('CARD-6414','Karta 6414','UZS',7),
  ('CARD-4868','Karta 4868','UZS',8),
  ('SLOT-1','Bo''sh joy 1','UZS',9),
  ('SLOT-2','Bo''sh joy 2','UZS',10)
on conflict (code) do nothing;

-- Kassa tranzaksiyalari (Pul harakatlari)
create table public.cash_transactions (
  id                uuid primary key default gen_random_uuid(),
  txn_date          date not null,
  income            numeric(18,2) not null default 0,
  expense           numeric(18,2) not null default 0,
  exchange_rate     numeric(12,2),
  cash_account_id   uuid not null references public.cash_accounts(id),
  account_code      text not null references public.chart_of_accounts(code),
  supplier_id       uuid references public.suppliers(id),
  customer_name     text,
  employee_id       uuid references public.profiles(id),
  comment           text,
  sales_channel_paid text,
  income_uzs        numeric(18,2) not null generated always as (
    case when exchange_rate is null then income else income * exchange_rate end
  ) stored,
  expense_uzs       numeric(18,2) not null generated always as (
    case when exchange_rate is null then expense else expense * exchange_rate end
  ) stored,
  created_by        uuid references public.profiles(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  ref_table         text,
  ref_id            uuid
);
create index on public.cash_transactions(txn_date);
create index on public.cash_transactions(cash_account_id);
create index on public.cash_transactions(account_code);
create index on public.cash_transactions(supplier_id);
create index on public.cash_transactions(date_trunc('month', txn_date));

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger trg_cash_txn_updated before update on public.cash_transactions
  for each row execute function public.touch_updated_at();

-- Kassa nazorati (Daily balance)
create table public.cash_daily_balance (
  id              uuid primary key default gen_random_uuid(),
  txn_date        date not null,
  cash_account_id uuid not null references public.cash_accounts(id),
  actual_balance  numeric(18,2) not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (txn_date, cash_account_id)
);
create index on public.cash_daily_balance(txn_date);

-- View: Joriy qoldiqlar
create or replace view public.v_cash_running_balance as
select
  ct.cash_account_id,
  ca.name as account_name,
  ca.currency,
  date_trunc('day', ct.txn_date) as day,
  sum(ct.income - ct.expense)
    over (partition by ct.cash_account_id order by ct.txn_date
          rows between unbounded preceding and current row) as running_balance_native,
  sum(ct.income_uzs - ct.expense_uzs)
    over (partition by ct.cash_account_id order by ct.txn_date
          rows between unbounded preceding and current row) as running_balance_uzs
from public.cash_transactions ct
join public.cash_accounts ca on ca.id = ct.cash_account_id;

-- View: Oylik PNL
create or replace view public.v_pnl_monthly as
select
  date_trunc('month', ct.txn_date) as month,
  ct.account_code,
  coa.pnl_section,
  coa.name as account_name,
  sum(ct.income_uzs) as income_uzs,
  sum(ct.expense_uzs) as expense_uzs,
  sum(ct.income_uzs - ct.expense_uzs) as net_uzs
from public.cash_transactions ct
join public.chart_of_accounts coa on coa.code = ct.account_code
group by 1, 2, 3, 4;

-- Xodimlar
create table public.employees (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid references public.profiles(id),
  full_name       text not null,
  department      text not null check (department in ('Sotuv','Marketing','Sklad','Admin','Boshqaruv')),
  base_salary     numeric(18,2) not null default 0,
  hire_date       date,
  fire_date       date,
  is_active       boolean not null default true,
  phone           text,
  notes           text,
  created_at      timestamptz not null default now()
);

insert into public.employees (full_name, department, base_salary, is_active) values
  ('Farzona','Sotuv',2500000,true),
  ('Begoyim','Sotuv',2500000,true),
  ('Ixtiyor','Marketing',4000000,true),
  ('Abdulaziz','Boshqaruv',10000000,true),
  ('Shahzod','Sklad',4200000,true),
  ('Sardor Xursanov','Sklad',4200000,true),
  ('Zafar','Admin',3000000,true),
  ('Asliddin','Sklad',4200000,true);

-- Ish haqi (Payroll)
create table public.payroll_periods (
  id           uuid primary key default gen_random_uuid(),
  year         int not null,
  month        int not null check (month between 1 and 12),
  workdays     int not null default 26,
  status       text not null default 'draft' check (status in ('draft','closed','paid')),
  closed_at    timestamptz,
  paid_at      timestamptz,
  created_at   timestamptz not null default now(),
  unique (year, month)
);

create table public.payroll_lines (
  id              uuid primary key default gen_random_uuid(),
  period_id       uuid not null references public.payroll_periods(id) on delete cascade,
  employee_id     uuid not null references public.employees(id),
  base_salary     numeric(18,2) not null,
  workdays        int not null,
  absent_days     int not null default 0,
  worked_days     int not null generated always as (workdays - absent_days) stored,
  daily_rate      numeric(18,2) not null,
  calculated_pay  numeric(18,2) not null,
  kpi_bonus       numeric(18,2) not null default 0,
  total_payable   numeric(18,2) not null generated always as (calculated_pay + kpi_bonus) stored,
  paid_amount     numeric(18,2) not null default 0,
  outstanding     numeric(18,2) not null generated always as (calculated_pay + kpi_bonus - paid_amount) stored,
  notes           text,
  unique (period_id, employee_id)
);

-- Hisoblanmalar (Accruals / KPI)
create table public.accruals (
  id              uuid primary key default gen_random_uuid(),
  accrual_date    date not null,
  employee_id     uuid not null references public.employees(id),
  department      text,
  amount          numeric(18,2) not null,
  reason          text,
  comment         text,
  is_paid         boolean not null default false,
  paid_at         timestamptz,
  cash_txn_id     uuid references public.cash_transactions(id),
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now()
);
create index on public.accruals(employee_id, accrual_date);

-- Majburiyatlar (Obligations)
create table public.obligations (
  id              uuid primary key default gen_random_uuid(),
  due_date        date not null,
  account_code    text not null references public.chart_of_accounts(code),
  amount_uzs      numeric(18,2) not null,
  amount_usd      numeric(18,2),
  is_recurring    boolean not null default true,
  recurrence      text default 'monthly' check (recurrence in ('monthly','quarterly','yearly')),
  description     text,
  is_paid         boolean not null default false,
  paid_at         timestamptz,
  cash_txn_id     uuid references public.cash_transactions(id),
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now()
);

-- Asosiy vositalar (Fixed Assets)
create table public.fixed_assets (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  category        text,
  acquisition_date date,
  acquisition_cost numeric(18,2) not null,
  useful_life_months int not null default 60,
  monthly_depreciation numeric(18,2) generated always as (
    acquisition_cost / nullif(useful_life_months,0)
  ) stored,
  current_book_value numeric(18,2),
  status          text not null default 'active' check (status in ('active','sold','disposed')),
  sold_date       date,
  sold_amount     numeric(18,2),
  notes           text,
  created_at      timestamptz not null default now()
);

-- Mijozlar qarzi (Kanal prodaj) view
create or replace view public.v_customer_debt_by_channel as
with sold as (
  select
    so.sales_channel,
    coalesce(sum(so.total_uzs_price), 0) as total_sold
  from public.sales_orders so
  where so.status not in ('Rad etildi','Vozvrat qilindi')
  group by so.sales_channel
),
paid as (
  select
    sales_channel_paid as sales_channel,
    sum(income_uzs) as total_paid
  from public.cash_transactions
  where sales_channel_paid is not null
  group by sales_channel_paid
)
select
  s.sales_channel,
  s.total_sold,
  coalesce(p.total_paid,0) as total_paid,
  s.total_sold - coalesce(p.total_paid,0) as debt
from sold s
left join paid p on p.sales_channel = s.sales_channel;

-- RLS (Row Level Security) qoidalari
alter table public.chart_of_accounts enable row level security;
alter table public.cash_accounts enable row level security;
alter table public.cash_transactions enable row level security;
alter table public.cash_daily_balance enable row level security;
alter table public.employees enable row level security;
alter table public.payroll_periods enable row level security;
alter table public.payroll_lines enable row level security;
alter table public.accruals enable row level security;
alter table public.obligations enable row level security;
alter table public.fixed_assets enable row level security;

-- Yordamchi funksiya: foydalanuvchi moliyaga ruxsati bormi
create or replace function public.is_finance_user() returns boolean
language sql security definer set search_path = public as $$
  select true;
  -- Hozircha is_finance_user barchasiga true, chunki frontend 'role' tekshirmoqda
  -- Yoki pastdagi kabi qat'iy yozsa bo'ladi:
  -- select exists(select 1 from public.profiles where id = auth.uid() and role in ('admin','buxgalter'));
$$;

-- O'qish huquqi
create policy "finance_read_coa" on public.chart_of_accounts for select using (true);
create policy "finance_read_ca" on public.cash_accounts for select using (true);
create policy "finance_read_tx" on public.cash_transactions for select using (true);
create policy "finance_read_bal" on public.cash_daily_balance for select using (true);
create policy "finance_read_emp" on public.employees for select using (true);
create policy "finance_read_pp" on public.payroll_periods for select using (true);
create policy "finance_read_pl" on public.payroll_lines for select using (true);
create policy "finance_read_acc" on public.accruals for select using (true);
create policy "finance_read_ob" on public.obligations for select using (true);
create policy "finance_read_fa" on public.fixed_assets for select using (true);

-- Yozish huquqi (hozircha ruxsat, RLS dan osonroq frontend dan to'samiz)
create policy "finance_write_coa" on public.chart_of_accounts for all using (true) with check (true);
create policy "finance_write_ca" on public.cash_accounts for all using (true) with check (true);
create policy "finance_write_tx" on public.cash_transactions for all using (true) with check (true);
create policy "finance_write_bal" on public.cash_daily_balance for all using (true) with check (true);
create policy "finance_write_emp" on public.employees for all using (true) with check (true);
create policy "finance_write_pp" on public.payroll_periods for all using (true) with check (true);
create policy "finance_write_pl" on public.payroll_lines for all using (true) with check (true);
create policy "finance_write_acc" on public.accruals for all using (true) with check (true);
create policy "finance_write_ob" on public.obligations for all using (true) with check (true);
create policy "finance_write_fa" on public.fixed_assets for all using (true) with check (true);
