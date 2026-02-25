

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."client_type" AS ENUM (
    'REGISTERED',
    'FINAL'
);


ALTER TYPE "public"."client_type" OWNER TO "postgres";


CREATE TYPE "public"."commission_type" AS ENUM (
    'TOTAL_PERCENTAGE',
    'BY_UNIT',
    'NONE'
);


ALTER TYPE "public"."commission_type" OWNER TO "postgres";


CREATE TYPE "public"."discount_type_enum" AS ENUM (
    'percentage',
    'fixed_amount'
);


ALTER TYPE "public"."discount_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."final_payment_method" AS ENUM (
    'CASH',
    'CREDIT_CARD',
    'DEBIT_CARD',
    'BANK_TRANSFER',
    'CRYPTO'
);


ALTER TYPE "public"."final_payment_method" OWNER TO "postgres";


CREATE TYPE "public"."logic_type" AS ENUM (
    'QUANTITY_DISCOUNT',
    'SPECIAL',
    'LIMITED_OFFER'
);


ALTER TYPE "public"."logic_type" OWNER TO "postgres";


CREATE TYPE "public"."movement_status" AS ENUM (
    'PENDING',
    'IN_TRANSIT',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE "public"."movement_status" OWNER TO "postgres";


CREATE TYPE "public"."movement_type" AS ENUM (
    'TRANSFER',
    'SALE',
    'WASTE',
    'INITIAL_LOAD'
);


ALTER TYPE "public"."movement_type" OWNER TO "postgres";


COMMENT ON TYPE "public"."movement_type" IS 'SALE and INITIAL_LOAD are unuser for now.';



CREATE TYPE "public"."order_status" AS ENUM (
    'NEW',
    'PROCESSING',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
    'RETURNED',
    'DELIVERING'
);


ALTER TYPE "public"."order_status" OWNER TO "postgres";


CREATE TYPE "public"."order_type" AS ENUM (
    'DIRECT_SALE',
    'CREDIT_ORDER',
    'RESERVATION',
    'ONLINE_PICKUP',
    'DELIVERY'
);


ALTER TYPE "public"."order_type" OWNER TO "postgres";


CREATE TYPE "public"."payment_direction" AS ENUM (
    'OUT',
    'IN'
);


ALTER TYPE "public"."payment_direction" OWNER TO "postgres";


CREATE TYPE "public"."payment_method" AS ENUM (
    'CASH',
    'CREDIT_CARD',
    'DEBIT_CARD',
    'BANK_TRANSFER',
    'ON_CREDIT',
    'CRYPTO',
    'OVERPAYMENT',
    'CHECK'
);


ALTER TYPE "public"."payment_method" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'PENDING',
    'PAID',
    'PARTIALLY_PAID',
    'REFUNDED',
    'PARTIALLY_REFUNDED'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."payment_type" AS ENUM (
    'ORDER',
    'CREDIT_CARD',
    'PROVIDER_PAYMENT',
    'SALARY_PAYMENT',
    'CLIENT_PAYMENT'
);


ALTER TYPE "public"."payment_type" OWNER TO "postgres";


CREATE TYPE "public"."price_type" AS ENUM (
    'MINOR',
    'MAYOR'
);


ALTER TYPE "public"."price_type" OWNER TO "postgres";


CREATE TYPE "public"."product_status_enum" AS ENUM (
    'draft',
    'active',
    'inactive',
    'out_of_stock',
    'discontinued'
);


ALTER TYPE "public"."product_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."promotion_type_enum" AS ENUM (
    'product',
    'category',
    'store',
    'shipping'
);


ALTER TYPE "public"."promotion_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."sell_measurement_mode" AS ENUM (
    'QUANTITY',
    'WEIGHT'
);


ALTER TYPE "public"."sell_measurement_mode" OWNER TO "postgres";


CREATE TYPE "public"."sell_type" AS ENUM (
    'UNIT',
    'WEIGHT'
);


ALTER TYPE "public"."sell_type" OWNER TO "postgres";


CREATE TYPE "public"."stock_type" AS ENUM (
    'STORE',
    'WASTE',
    'NOT_ASSIGNED',
    'SOLD',
    'TRANSFORMED',
    'STOCKROOM'
);


ALTER TYPE "public"."stock_type" OWNER TO "postgres";


CREATE TYPE "public"."tax_condition_type" AS ENUM (
    'VAT_REGISTERED_RESPONSIBLE',
    'VAT_EXEMPT_SUBJECT',
    'FINAL_CONSUMER',
    'MONOTAX_RESPONSIBLE',
    'UNCATEGORIZED_SUBJECT',
    'FOREIGN_SUPPLIER',
    'FOREIGN_CLIENT',
    'VAT_LIBERATED_LAW_19640',
    'SOCIAL_MONOTAX',
    'VAT_NOT_REACHED',
    'PROMOTED_INDEPENDENT_MONOTAX_WORKER'
);


ALTER TYPE "public"."tax_condition_type" OWNER TO "postgres";


CREATE TYPE "public"."transaction_type" AS ENUM (
    'INVOICE',
    'PAYMENT',
    'REFUND'
);


ALTER TYPE "public"."transaction_type" OWNER TO "postgres";


CREATE TYPE "public"."unit_type_enum" AS ENUM (
    'weight',
    'volume',
    'quantity',
    'length',
    'area',
    'custom'
);


ALTER TYPE "public"."unit_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."user_role_enum" AS ENUM (
    'OWNER',
    'MANAGER',
    'SUPERADMIN',
    'EMPLOYEE'
);


ALTER TYPE "public"."user_role_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_stock"("p_lot" "jsonb", "p_stocks" "jsonb", "p_lot_containers_location" "jsonb", "p_organization_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_lot_id bigint;
  v_result jsonb := '{}'::jsonb;

  /* ============================================================
     Oversell flow
     ============================================================ */
  v_checked jsonb;
  v_lot_checked jsonb;
  v_stocks_checked jsonb;
  v_lc_checked jsonb;

begin
  /* ============================================================
     Detect if any stock must compensate oversell
     ============================================================ */

  if exists (
    select 1
    from jsonb_array_elements(p_stocks) s
    where coalesce((s->>'has_to_compensate')::boolean, false) = true
  ) then

    v_checked := public.compensate_over_sell_lots(
      p_lot,
      p_stocks,
      p_lot_containers_location,
      p_organization_id
    );

  else

    v_checked := jsonb_build_object(
      'lot', p_lot,
      'stocks', p_stocks,
      'lot_containers_location', p_lot_containers_location,
      'continue', true
    );

  end if;

  if (v_checked->>'continue')::boolean is not true then
    return jsonb_build_object(
      'lot_id', null,
      'skipped', true
    );
  end if;

  v_lot_checked := v_checked->'lot';
  v_stocks_checked := v_checked->'stocks';
  v_lc_checked := v_checked->'lot_containers_location';


  ---------------------------------------------------------------------------
  -- 1️⃣ Insert lot
  ---------------------------------------------------------------------------
  insert into lots (
    load_order_id,
    product_id,
    product_presentation_id,
    expiration_date,
    expiration_date_notification,
    is_expired,
    provider_id,
    initial_stock_quantity,
    is_sold_out,
    download_total_cost,
    download_cost_per_unit,
    download_cost_per_bulk,
    purchase_cost_total,
    purchase_cost_per_unit,
    purchase_cost_per_bulk,
    final_cost_total,
    final_cost_per_unit,
    final_cost_per_bulk,
    delivery_cost_total,
    delivery_cost_per_unit,
    delivery_cost_per_bulk,
    productor_commission_type,
    productor_commission_percentage,
    productor_commission_unit_value,
    purchasing_agent_id,
    purchasing_agent_commision_type,
    purchasing_agent_commision_percentage,
    purchasing_agent_commision_unit_value,
    extra_cost_total
  )
  values (
    (v_lot_checked->>'load_order_id')::bigint,
    (v_lot_checked->>'product_id')::bigint,
    (v_lot_checked->>'product_presentation_id')::bigint,
    nullif(v_lot_checked->>'expiration_date','')::date,
    coalesce((v_lot_checked->>'expiration_date_notification')::boolean, false),
    coalesce((v_lot_checked->>'is_expired')::boolean, false),
    nullif(v_lot_checked->>'provider_id','')::bigint,
    (v_lot_checked->>'initial_stock_quantity')::numeric,
    coalesce((v_lot_checked->>'is_sold_out')::boolean, false),
    (v_lot_checked->>'download_total_cost')::numeric,
    (v_lot_checked->>'download_cost_per_unit')::numeric,
    (v_lot_checked->>'download_cost_per_bulk')::numeric,
    (v_lot_checked->>'purchase_cost_total')::numeric,
    (v_lot_checked->>'purchase_cost_per_unit')::numeric,
    (v_lot_checked->>'purchase_cost_per_bulk')::numeric,
    (v_lot_checked->>'final_cost_total')::numeric,
    (v_lot_checked->>'final_cost_per_unit')::numeric,
    (v_lot_checked->>'final_cost_per_bulk')::numeric,
    (v_lot_checked->>'delivery_cost_total')::numeric,
    (v_lot_checked->>'delivery_cost_per_unit')::numeric,
    (v_lot_checked->>'delivery_cost_per_bulk')::numeric,
    coalesce((v_lot_checked->>'productor_commission_type')::commission_type, 'NONE'),
    (v_lot_checked->>'productor_commission_percentage')::numeric,
    (v_lot_checked->>'productor_commission_unit_value')::numeric,
    (v_lot_checked->>'purchasing_agent_id')::bigint,
    coalesce((v_lot_checked->>'purchasing_agent_commision_type')::commission_type, 'NONE'),
    (v_lot_checked->>'purchasing_agent_commision_percentage')::numeric,
    (v_lot_checked->>'purchasing_agent_commision_unit_value')::numeric,
    (v_lot_checked->>'extra_total_cost')::numeric
  )
  returning lot_id into v_lot_id;


  ---------------------------------------------------------------------------
  -- 2️⃣ Normalize lot_containers_location
  ---------------------------------------------------------------------------
  create temp table tmp_lc as
  select
    nullif(lc->>'lot_container_id','')::bigint as lot_container_id,
    (lc->>'quantity')::numeric               as quantity,
    nullif(lc->>'location_id','')::bigint    as location_id,
    nullif(lc->>'client_id','')::bigint      as client_id,
    nullif(lc->>'provider_id','')::bigint    as provider_id
  from jsonb_array_elements(v_lc_checked) lc;


  ---------------------------------------------------------------------------
  -- 3️⃣ Insert stocks
  ---------------------------------------------------------------------------
  with inserted_stock as (
    insert into stock (
      lot_id,
      product_id,
      location_id,
      quantity,
      min_notification,
      max_notification,
      stock_type,
      reserved_for_transferring_quantity,
      reserved_for_selling_quantity,
      transformed_from_product_id,
      transformed_to_product_id,
      updated_at
    )
    select
      v_lot_id,
      (s->>'product_id')::bigint,
      nullif(s->>'location_id','')::bigint,
      (s->>'quantity')::numeric,
      (s->>'min_notification')::numeric,
      (s->>'max_notification')::numeric,
      (s->>'stock_type')::stock_type,
      (s->>'reserved_for_transferring_quantity')::numeric,
      (s->>'reserved_for_selling_quantity')::numeric,
      nullif(s->>'transformed_from_product_id','')::bigint,
      nullif(s->>'transformed_to_product_id','')::bigint,
      now()
    from jsonb_array_elements(v_stocks_checked) s
    returning stock_id, location_id, stock_type
  )


  ---------------------------------------------------------------------------
  -- 4️⃣ Insert lot_containers_stock
  ---------------------------------------------------------------------------
  insert into lot_containers_stock (
    organization_id,
    stock_id,
    lot_container_id,
    quantity,
    created_at,
    location_id,
    client_id,
    provider_id
  )
  select
    p_organization_id,

    case
      when lc.location_id is not null then (
        select stock_id
        from inserted_stock s
        where s.location_id = lc.location_id
        limit 1
      )
      else (
        select stock_id
        from inserted_stock s
        where s.stock_type = 'NOT_ASSIGNED'
        limit 1
      )
    end,

    lc.lot_container_id,
    lc.quantity,
    now(),
    lc.location_id,
    lc.client_id,
    lc.provider_id
  from tmp_lc lc;

  drop table tmp_lc;


  ---------------------------------------------------------------------------
  -- 5️⃣ Result
  ---------------------------------------------------------------------------
  return jsonb_build_object('lot_id', v_lot_id);

exception
  when others then
    raise;
end;
$$;


ALTER FUNCTION "public"."add_stock"("p_lot" "jsonb", "p_stocks" "jsonb", "p_lot_containers_location" "jsonb", "p_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_stock_to_location"("p_lot_id" bigint, "p_product_id" bigint, "p_location_id" bigint, "p_quantity" numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_existing_stock_id bigint;
begin
  ---------------------------------------------------------------------------
  -- 1️⃣ Buscar stock existente
  ---------------------------------------------------------------------------
  select stock_id
  into v_existing_stock_id
  from stock
  where lot_id = p_lot_id
    and location_id = p_location_id
  for update;

  ---------------------------------------------------------------------------
  -- 2️⃣ Si existe → sumar
  ---------------------------------------------------------------------------
  if found then
    update stock
    set quantity = quantity + p_quantity
    where stock_id = v_existing_stock_id;

  ---------------------------------------------------------------------------
  -- 3️⃣ Si no existe → crear nuevo stock
  ---------------------------------------------------------------------------
  else
    insert into stock (
      product_id,
      lot_id,
      location_id,
      quantity,
      created_at
    )
    values (
      p_product_id,
      p_lot_id,
      p_location_id,
      p_quantity,
      now()
    );
  end if;
end;
$$;


ALTER FUNCTION "public"."add_stock_to_location"("p_lot_id" bigint, "p_product_id" bigint, "p_location_id" bigint, "p_quantity" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_client_credit_adjustment"("p_client_id" bigint, "p_amount" numeric, "p_credit_direction" "text") RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_available_credit numeric;
  v_new_balance numeric;
begin
  -- 1️⃣ Validaciones básicas
  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than 0';
  end if;

  if p_credit_direction not in ('POSITIVE', 'NEGATIVE') then
    raise exception 'Invalid credit_direction: %', p_credit_direction;
  end if;

  -- 2️⃣ Lockear cliente y obtener crédito disponible
  select available_credit
  into v_available_credit
  from clients
  where client_id = p_client_id
  for update;

  if not found then
    raise exception 'Client not found (id=%)', p_client_id;
  end if;

  -- 3️⃣ Validar crédito suficiente si es NEGATIVE
  if p_credit_direction = 'NEGATIVE'
     and v_available_credit < p_amount then
    raise exception
      'Insufficient available credit. Available: %, Required: %',
      v_available_credit,
      p_amount;
  end if;

  -- 4️⃣ Aplicar ajuste
  update clients
  set
    current_balance =
      case
        when p_credit_direction = 'POSITIVE'
          then coalesce(current_balance,0) + p_amount
        else
          coalesce(current_balance,0) - p_amount
      end,
    available_credit =
      case
        when p_credit_direction = 'POSITIVE'
          then coalesce(available_credit,0) + p_amount
        else
          available_credit - p_amount
      end,
    last_transaction_date = now()
  where client_id = p_client_id
  returning current_balance into v_new_balance;

  -- 5️⃣ Retornar nuevo balance
  return v_new_balance;
end;
$$;


ALTER FUNCTION "public"."apply_client_credit_adjustment"("p_client_id" bigint, "p_amount" numeric, "p_credit_direction" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_transformation_stock"("p_is_origin" boolean, "p_stock_id" bigint, "p_quantity" numeric, "p_location_id" bigint, "p_lot" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    v_origin_lot_id bigint;

    v_existing_lot_id bigint;
    v_existing_stock_id bigint;

    v_new_lot_id bigint;
    v_new_stock_id bigint;
begin
    -------------------------------------------------------------------
    -- Obtener lote origen desde stock
    -------------------------------------------------------------------
    select lot_id
    into v_origin_lot_id
    from stock
    where stock_id = p_stock_id;


    -------------------------------------------------------------------
    -- 🟥 ORIGEN → restar stock
    -------------------------------------------------------------------
    if p_is_origin is true then

        update stock
        set quantity = coalesce(quantity,0) - coalesce(p_quantity,0)
        where stock_id = p_stock_id;

        return jsonb_build_object(
            'lot_id', v_origin_lot_id,
            'stock_id', p_stock_id,
            'quantity_applied', -p_quantity
        );
    end if;


    -------------------------------------------------------------------
    -- 🔍 Buscar lote destino existente desde este origen
    -------------------------------------------------------------------

    select l.lot_id, s.stock_id
    into v_existing_lot_id, v_existing_stock_id
    from lot_traces t
    join lots l on l.lot_id = t.lot_to_id
    join stock s on s.lot_id = l.lot_id
    where t.lot_from_id = v_origin_lot_id
      and l.product_id = (p_lot->>'product_id')::bigint
      and l.product_presentation_id = (p_lot->>'product_presentation_id')::bigint
      and s.location_id = p_location_id
    limit 1;


    -------------------------------------------------------------------
    -- 🟢 Si EXISTE → sumar stock
    -------------------------------------------------------------------
    if v_existing_stock_id is not null then

        update stock
        set quantity = quantity + p_quantity
        where stock_id = v_existing_stock_id;

        return jsonb_build_object(
            'lot_id', v_existing_lot_id,
            'stock_id', v_existing_stock_id,
            'quantity_applied', p_quantity,
            'reused_lot', true
        );
    end if;


    -------------------------------------------------------------------
    -- 🆕 Si NO existe → crear lote nuevo
    -------------------------------------------------------------------

    insert into lots (
        product_id,
        provider_id,
        product_presentation_id,
        expiration_date,
        expiration_date_notification,
        initial_stock_quantity,
        final_cost_per_unit,
        final_cost_per_bulk,
        final_cost_total
    )
    values (
        (p_lot->>'product_id')::bigint,
        (p_lot->>'provider_id')::bigint,
        (p_lot->>'product_presentation_id')::bigint,
        (p_lot->>'expiration_date')::timestamptz,
        (p_lot->>'expiration_date_notification')::boolean,
        p_quantity,
        (p_lot->>'final_cost_per_unit')::numeric,
        (p_lot->>'final_cost_per_bulk')::numeric,
        (p_lot->>'final_cost_total')::numeric
    )
    returning lot_id into v_new_lot_id;


    insert into stock (
        lot_id,
        quantity,
        stock_type,
        product_id,
        location_id
    )
    values (
        v_new_lot_id,
        p_quantity,
        'STORE',
        (p_lot->>'product_id')::bigint,
        p_location_id
    )
    returning stock_id into v_new_stock_id;


    -------------------------------------------------------------------
    -- 🔗 Crear traza
    -------------------------------------------------------------------
    perform public.create_lot_trace(
        v_origin_lot_id,
        v_new_lot_id
    );


    -------------------------------------------------------------------
    -- 📤 Respuesta
    -------------------------------------------------------------------
    return jsonb_build_object(
        'lot_id', v_new_lot_id,
        'stock_id', v_new_stock_id,
        'quantity_applied', p_quantity,
        'reused_lot', false
    );

end;
$$;


ALTER FUNCTION "public"."apply_transformation_stock"("p_is_origin" boolean, "p_stock_id" bigint, "p_quantity" numeric, "p_location_id" bigint, "p_lot" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_transformation_stock"("p_is_origin" boolean, "p_origin_stock_id" bigint, "p_stock_id" bigint, "p_quantity" numeric, "p_location_id" bigint, "p_lot" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    v_origin_lot_id bigint;

    v_existing_lot_id bigint;
    v_existing_stock_id bigint;

    v_new_lot_id bigint;
    v_new_stock_id bigint;
begin
    -------------------------------------------------------------------
    -- 🎯 Lote origen SIEMPRE desde origin_stock_id
    -------------------------------------------------------------------
    select lot_id
    into v_origin_lot_id
    from stock
    where stock_id = p_origin_stock_id;

    if v_origin_lot_id is null then
        raise exception 'Origin lot not found for stock_id %', p_origin_stock_id;
    end if;


    -------------------------------------------------------------------
    -- 🟥 ORIGEN
    -------------------------------------------------------------------
    if p_is_origin is true then

        update stock
        set quantity = quantity - p_quantity
        where stock_id = p_origin_stock_id;

        return jsonb_build_object(
            'lot_id', v_origin_lot_id,
            'stock_id', p_origin_stock_id,
            'quantity_applied', -p_quantity
        );
    end if;


    -------------------------------------------------------------------
    -- 🔍 Buscar lote destino ya existente desde este origen
    -------------------------------------------------------------------
    select l.lot_id, s.stock_id
    into v_existing_lot_id, v_existing_stock_id
    from lot_traces t
    join lots l on l.lot_id = t.lot_to_id
    join stock s on s.lot_id = l.lot_id
    where t.lot_from_id = v_origin_lot_id
      and l.product_id = (p_lot->>'product_id')::bigint
      and l.product_presentation_id = (p_lot->>'product_presentation_id')::bigint
      and s.location_id = p_location_id
    limit 1;


    -------------------------------------------------------------------
    -- 🟢 Reusar lote
    -------------------------------------------------------------------
    if v_existing_stock_id is not null then

        update stock
        set quantity = quantity + p_quantity
        where stock_id = v_existing_stock_id;

        return jsonb_build_object(
            'lot_id', v_existing_lot_id,
            'stock_id', v_existing_stock_id,
            'quantity_applied', p_quantity,
            'reused_lot', true
        );
    end if;


    -------------------------------------------------------------------
    -- 🆕 Crear lote nuevo
    -------------------------------------------------------------------
    insert into lots (
        product_id,
        provider_id,
        product_presentation_id,
        expiration_date,
        expiration_date_notification,
        initial_stock_quantity,
        final_cost_per_unit,
        final_cost_per_bulk,
        final_cost_total
    )
    values (
        (p_lot->>'product_id')::bigint,
        (p_lot->>'provider_id')::bigint,
        (p_lot->>'product_presentation_id')::bigint,
        (p_lot->>'expiration_date')::timestamptz,
        (p_lot->>'expiration_date_notification')::boolean,
        p_quantity,
        (p_lot->>'final_cost_per_unit')::numeric,
        (p_lot->>'final_cost_per_bulk')::numeric,
        (p_lot->>'final_cost_total')::numeric
    )
    returning lot_id into v_new_lot_id;


    insert into stock (
        lot_id,
        quantity,
        stock_type,
        product_id,
        location_id
    )
    values (
        v_new_lot_id,
        p_quantity,
        'STORE',
        (p_lot->>'product_id')::bigint,
        p_location_id
    )
    returning stock_id into v_new_stock_id;


    -------------------------------------------------------------------
    -- 🔗 Crear traza REAL
    -------------------------------------------------------------------
    perform public.create_lot_trace(
        v_origin_lot_id,
        v_new_lot_id
    );


    return jsonb_build_object(
        'lot_id', v_new_lot_id,
        'stock_id', v_new_stock_id,
        'quantity_applied', p_quantity,
        'reused_lot', false
    );

end;
$$;


ALTER FUNCTION "public"."apply_transformation_stock"("p_is_origin" boolean, "p_origin_stock_id" bigint, "p_stock_id" bigint, "p_quantity" numeric, "p_location_id" bigint, "p_lot" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_stock_to_location"("p_from_stock_data" "jsonb", "p_stock_movement" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_from_stock_id bigint := (p_from_stock_data->>'stock_id')::bigint;

  v_product_id bigint; -- ✅ source of truth: stock origen
  v_stock record;
  v_to_stock record;

  v_stock_movement_id bigint;
  v_quantity numeric := (p_stock_movement->>'quantity')::numeric;
  v_to_location_id bigint := (p_stock_movement->>'to_location_id')::bigint;
begin

  ---------------------------------------------------------------------------
  -- 🔍 TRACE input raw
  ---------------------------------------------------------------------------
  raise notice 'assign_stock_to_location INPUT from_stock=%', p_from_stock_data;
  raise notice 'assign_stock_to_location INPUT movement=%', p_stock_movement;

  ---------------------------------------------------------------------------
  -- 1️⃣ Obtener stock origen
  ---------------------------------------------------------------------------
  select *
  into v_stock
  from stock
  where stock_id = v_from_stock_id
  for update;

  if not found then
    raise exception 'Stock not found (id=%)', v_from_stock_id;
  end if;

  -- ✅ product_id real viene del stock origen, no del frontend
  v_product_id := v_stock.product_id;

  ---------------------------------------------------------------------------
  -- 2️⃣ Insertar movimiento
  ---------------------------------------------------------------------------
  insert into stock_movements (
    lot_id,
    movement_type,
    quantity,
    from_location_id,
    to_location_id,
    created_at
  )
  values (
    v_stock.lot_id,
    'TRANSFER',
    v_quantity,
    v_stock.location_id,
    v_to_location_id,
    now()
  )
  returning stock_movement_id into v_stock_movement_id;

  ---------------------------------------------------------------------------
  -- 3️⃣ Restar stock origen
  ---------------------------------------------------------------------------
  perform subtract_stock_quantity(v_from_stock_id, v_quantity);

  ---------------------------------------------------------------------------
  -- 4️⃣ Sumar o compensar stock destino (OVERSALE SAFE)
  ---------------------------------------------------------------------------
  select *
  into v_to_stock
  from stock
  where lot_id = v_stock.lot_id
    and product_id = v_product_id
    and location_id = v_to_location_id
  for update;

  if found then
    update stock
    set
      quantity = quantity + greatest(0, v_quantity - v_to_stock.over_sell_quantity),
      over_sell_quantity = greatest(0, v_to_stock.over_sell_quantity - v_quantity),
      updated_at = now()
    where stock_id = v_to_stock.stock_id;
  else
    insert into stock (
      lot_id,
      product_id,
      location_id,
      quantity,
      over_sell_quantity,
      updated_at
    )
    values (
      v_stock.lot_id,
      v_product_id,
      v_to_location_id,
      v_quantity,
      0,
      now()
    );
  end if;

  return jsonb_build_object('success', true, 'stock_movement_id', v_stock_movement_id);
end;
$$;


ALTER FUNCTION "public"."assign_stock_to_location"("p_from_stock_data" "jsonb", "p_stock_movement" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancel_order"("p_order" "jsonb", "p_order_items" "jsonb", "p_notification" "jsonb") RETURNS TABLE("order_id" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_order_id bigint;
  v_item jsonb;
  v_order_lot_id bigint;
  v_quantity numeric;
begin
  ---------------------------------------------------------------------------
  -- 1) Actualizar la orden
  ---------------------------------------------------------------------------
  v_order_id := (p_order->>'order_id')::bigint;

  update public.orders o
  set
    client_type   = (p_order->>'client_type')::client_type,
    client_id     = nullif(p_order->>'client_id','')::bigint,
    provider_id   = nullif(p_order->>'provider_id','')::bigint,
    order_type    = (p_order->>'order_type')::order_type,
    order_status = 'CANCELLED'::order_status,
    subtotal      = (p_order->>'subtotal')::numeric,
    discount      = coalesce((p_order->>'discount')::numeric,0),
    tax           = coalesce((p_order->>'tax')::numeric,0),
    total_amount  = (p_order->>'total_amount')::numeric,
    currency      = (p_order->>'currency')::text,
    notes         = concat_ws(' | ', coalesce(o.notes,''), 'Orden cancelada el ' || now()::text),
    delivery_date = nullif(p_order->>'delivery_date','')::timestamptz,
    updated_at    = now()
  where o.order_id = v_order_id;

  if not found then
    raise exception 'No existe la orden con order_id=%', v_order_id;
  end if;

  ---------------------------------------------------------------------------
  -- 2) Insertar los ítems de la orden (sin lógica adicional)
  ---------------------------------------------------------------------------
  for v_item in
    select * from jsonb_array_elements(p_order_items)
  loop
    v_order_lot_id := (v_item->>'lot_id')::bigint;
    v_quantity := (v_item->>'quantity')::numeric;

    insert into public.order_items (
      order_id, product_id, lot_id, price_id,
      quantity, price, subtotal, discount, tax, total_price, created_at
    )
    values (
      v_order_id,
      (v_item->>'product_id')::bigint,
      v_order_lot_id,
      nullif(v_item->>'price_id','')::bigint,
      v_quantity,
      (v_item->>'price')::numeric,
      (v_item->>'subtotal')::numeric,
      coalesce((v_item->>'discount')::numeric,0),
      coalesce((v_item->>'tax')::numeric,0),
      (v_item->>'total_price')::numeric,
      now()
    );
  end loop;

  ---------------------------------------------------------------------------
  -- 3) Insertar notificación (incluye store_id)
  ---------------------------------------------------------------------------
  insert into public.notifications (
    created_at,
    is_read,
    organization_id,
    title,
    message,
    order_id,
    canceled_by,
    store_id
  )
  values (
    now(),
    false,
    (p_notification->>'organization_id')::uuid,
    (p_notification->>'title')::text,
    (p_notification->>'message')::text,
    v_order_id,
    nullif(p_notification->>'canceled_by','')::uuid,
    nullif(p_notification->>'store_id','')::bigint
  );

  ---------------------------------------------------------------------------
  -- 4) Retornar resultado
  ---------------------------------------------------------------------------
  return query select v_order_id;
end;
$$;


ALTER FUNCTION "public"."cancel_order"("p_order" "jsonb", "p_order_items" "jsonb", "p_notification" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_product_has_stock_by_short_code"("p_short_code" bigint, "p_business_owner_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_product_id bigint;
  v_has_stock boolean;
begin
  -- Buscar el producto del business_owner con ese short_code
  select p.product_id
  into v_product_id
  from products p
  where p.short_code = p_short_code
    and p.business_owner_id = p_business_owner_id
  limit 1;

  if v_product_id is null then
    return false; -- No existe el producto → no tiene stock
  end if;

  -- Verificar si existe al menos un lote no agotado
  select exists (
    select 1
    from lots l
    where l.product_id = v_product_id
      and l.is_sold_out = false
  )
  into v_has_stock;

  return v_has_stock;
end;
$$;


ALTER FUNCTION "public"."check_product_has_stock_by_short_code"("p_short_code" bigint, "p_business_owner_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_product_has_stock_by_short_code"("p_short_code" bigint, "p_business_owner_id" "uuid", "p_product_id" bigint DEFAULT NULL::bigint) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_product_id bigint;
  v_has_stock boolean;
begin
  -- Si se pasa un product_id, usarlo directamente
  if p_product_id is not null then
    v_product_id := p_product_id;
  else
    -- Buscar el producto del business_owner con ese short_code
    select p.product_id
    into v_product_id
    from products p
    where p.short_code = p_short_code
      and p.business_owner_id = p_business_owner_id
    limit 1;
  end if;

  if v_product_id is null then
    return false; -- No existe el producto → no tiene stock
  end if;

  -- Verificar si existe al menos un lote no agotado
  select exists (
    select 1
    from lots l
    where l.product_id = v_product_id
      and l.is_sold_out = false
  )
  into v_has_stock;

  return v_has_stock;
end;
$$;


ALTER FUNCTION "public"."check_product_has_stock_by_short_code"("p_short_code" bigint, "p_business_owner_id" "uuid", "p_product_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_product_stock_by_short_code"("p_short_code" bigint, "p_business_owner_id" "uuid") RETURNS TABLE("product_id" bigint, "product_name" "text", "has_stock" boolean, "lots" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_product_id bigint;
begin
  -- Buscar el producto del business_owner con ese short_code
  select p.product_id
  into v_product_id
  from products p
  where p.short_code = p_short_code
    and p.business_owner_id = p_business_owner_id
  limit 1;

  if v_product_id is null then
    raise exception 'No product found with short_code % for this business owner', p_short_code;
  end if;

  -- Retornar datos del producto y sus lotes
  return query
  select
    p.product_id,
    p.product_name,
    exists (
      select 1
      from lots l
      where l.product_id = p.product_id
        and l.is_sold_out = false
    ) as has_stock,
    (
      select jsonb_agg(jsonb_build_object(
        'lot_id', l.lot_id,
        'is_sold_out', l.is_sold_out,
        'current_stock_quantity', l.current_stock_quantity
      ))
      from lots l
      where l.product_id = p.product_id
    ) as lots
  from products p
  where p.product_id = v_product_id;

end;
$$;


ALTER FUNCTION "public"."check_product_stock_by_short_code"("p_short_code" bigint, "p_business_owner_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."compensate_over_sell_lots"("p_lot" "jsonb", "p_stocks" "jsonb", "p_lot_containers_location" "jsonb", "p_organization_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_last_stock_id bigint;
  v_last_lot_id bigint;
  v_over_sell_qty numeric;

  v_location_id bigint;

  v_new_quantity numeric;
  v_original_quantity numeric;
  v_compensated_this numeric;
  v_compensated_total numeric := 0;

  v_stock jsonb;
  v_stock_arr jsonb := '[]'::jsonb;

begin
  --------------------------------------------------------------------
  -- 1️⃣ Location principal del stock entrante
  --------------------------------------------------------------------
  v_location_id :=
    nullif(p_stocks->0->>'location_id','')::bigint;

  --------------------------------------------------------------------
  -- 2️⃣ Traer último oversell real (puede no devolver fila)
  --------------------------------------------------------------------
  select
    stock_id,
    lot_id,
    over_sell_quantity
  into
    v_last_stock_id,
    v_last_lot_id,
    v_over_sell_qty
  from public.get_last_over_sell_stock(
    (p_lot->>'product_id')::bigint,
    (p_lot->>'product_presentation_id')::bigint,
    v_location_id
  );

  --------------------------------------------------------------------
  -- 3️⃣ Si NO hay oversell → seguir normal
  --------------------------------------------------------------------
  if v_last_stock_id is null then
    return jsonb_build_object(
      'lot', p_lot,
      'stocks', p_stocks,
      'lot_containers_location', p_lot_containers_location,
      'continue', true
    );
  end if;

  --------------------------------------------------------------------
  -- 4️⃣ Compensar oversell contra stocks entrantes
  --------------------------------------------------------------------
  for v_stock in
    select * from jsonb_array_elements(p_stocks)
  loop
    v_original_quantity := (v_stock->>'quantity')::numeric;
    v_new_quantity := v_original_quantity;
    v_compensated_this := 0;

    if v_over_sell_qty > 0 then
      v_compensated_this := least(v_original_quantity, v_over_sell_qty);

      v_new_quantity := v_original_quantity - v_compensated_this;
      v_over_sell_qty := v_over_sell_qty - v_compensated_this;

      v_compensated_total := v_compensated_total + v_compensated_this;
    end if;

    v_stock_arr :=
      v_stock_arr ||
      jsonb_build_array(
        jsonb_set(v_stock, '{quantity}', to_jsonb(v_new_quantity))
      );
  end loop;

  --------------------------------------------------------------------
  -- 4.5️⃣ Persistir compensación en BD
  --------------------------------------------------------------------
  if v_compensated_total > 0 then

    update stock
    set
      over_sell_quantity = greatest(
        coalesce(over_sell_quantity, 0) - v_compensated_total,
        0
      ),
      updated_at = now()
    where stock_id = v_last_stock_id;

    update lots
    set
      initial_stock_quantity =
        coalesce(initial_stock_quantity, 0) + v_compensated_total
    where lot_id = v_last_lot_id;

  end if;

  --------------------------------------------------------------------
  -- 5️⃣ Si todo el stock entrante fue absorbido → cortar
  --------------------------------------------------------------------
  if not exists (
    select 1
    from jsonb_array_elements(v_stock_arr) s
    where (s->>'quantity')::numeric > 0
  ) then
    return jsonb_build_object(
      'lot', p_lot,
      'stocks', v_stock_arr,
      'lot_containers_location', p_lot_containers_location,
      'continue', false
    );
  end if;

  --------------------------------------------------------------------
  -- 6️⃣ Recalcular quantity real del nuevo lote
  --------------------------------------------------------------------
  return jsonb_build_object(
    'lot',
      jsonb_set(
        p_lot,
        '{initial_stock_quantity}',
        to_jsonb(
          (
            select sum((s->>'quantity')::numeric)
            from jsonb_array_elements(v_stock_arr) s
          )
        )
      ),
    'stocks', v_stock_arr,
    'lot_containers_location', p_lot_containers_location,
    'continue', true
  );

end;
$$;


ALTER FUNCTION "public"."compensate_over_sell_lots"("p_lot" "jsonb", "p_stocks" "jsonb", "p_lot_containers_location" "jsonb", "p_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_load_order"("p_load_order" "jsonb", "p_units" "jsonb", "p_organization_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_load_order_id bigint;
  v_unit jsonb;
  v_lot jsonb;
  v_stocks jsonb;
  v_lot_containers_location jsonb;
  v_add_stock_result jsonb;

  v_results jsonb := '[]'::jsonb;
begin
  ---------------------------------------------------------------------------
  -- 1️⃣ Insertar LOAD ORDER (header)
  ---------------------------------------------------------------------------

  insert into load_orders (
    organization_id,
    load_order_number,
    provider_id,
    delivery_date,
    receptor_id,
    receptor_other,
    transporter_data,
    invoice_number,
    observations,
    total_download_cost,
    status,
    created_at,
    updated_at
  )
  values (
    p_organization_id,
    nullif(p_load_order->>'load_order_number','')::numeric,
    nullif(p_load_order->>'provider_id','')::bigint,
    nullif(p_load_order->>'delivery_date','')::date,
    nullif(p_load_order->>'receptor_id','')::uuid,
    p_load_order->>'receptor_other',
    p_load_order->'transporter_data',
    nullif(p_load_order->>'invoice_number','')::numeric,
    p_load_order->>'observations',
    coalesce((p_load_order->>'total_download_cost')::numeric, 0),
    coalesce((p_load_order->>'status')::text, 'PENDING'),
    now(),
    now()
  )
  returning load_order_id
  into v_load_order_id;

  ---------------------------------------------------------------------------
  -- 2️⃣ Iterar UNITS (1 unidad = 1 add_stock)
  ---------------------------------------------------------------------------

  for v_unit in
    select * from jsonb_array_elements(p_units)
  loop
    -------------------------------------------------------------------------
    -- 2.1 Extraer componentes
    -------------------------------------------------------------------------

    v_lot := v_unit->'lot';
    v_stocks := v_unit->'stocks';
    v_lot_containers_location := v_unit->'lot_containers_location';

    -------------------------------------------------------------------------
    -- 2.2 Inyectar load_order_id en el LOT
    -------------------------------------------------------------------------

    v_lot := jsonb_set(
      v_lot,
      '{load_order_id}',
      to_jsonb(v_load_order_id),
      true
    );

    -------------------------------------------------------------------------
    -- 2.3 Ejecutar add_stock
    -------------------------------------------------------------------------

    v_add_stock_result := public.add_stock(
      v_lot,
      v_stocks,
      v_lot_containers_location,
      p_organization_id
    );

    -------------------------------------------------------------------------
    -- 2.4 Acumular resultado
    -------------------------------------------------------------------------

    v_results := v_results || jsonb_build_object(
      'lot_id', v_add_stock_result->>'lot_id'
    );
  end loop;

  ---------------------------------------------------------------------------
  -- 3️⃣ Retorno final
  ---------------------------------------------------------------------------

  return jsonb_build_object(
    'load_order_id', v_load_order_id,
    'lots', v_results
  );

exception
  when others then
    raise;
end;
$$;


ALTER FUNCTION "public"."create_load_order"("p_load_order" "jsonb", "p_units" "jsonb", "p_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_load_order_with_lots_and_prices"("p_load_order" "jsonb", "p_lots" "jsonb") RETURNS TABLE("load_order_id" bigint, "lots_inserted" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_load_order_id bigint;
  v_lots jsonb := '[]'::jsonb;
  v_prices jsonb := '[]'::jsonb;
begin
  ---------------------------------------------------------------------------
  -- 1) INSERT load_orders
  --    Mapea 1:1 con tu type LoadOrder. Campos opcionales con nullif().
  ---------------------------------------------------------------------------
  insert into load_orders (
  business_owner_id,
  load_order_number,
  provider_id,
  delivery_date,
  receptor_other,          -- 👈 ahora sí va en columnas
  receptor_id,             -- 👈 uuid nullable
  transporter_data,
  invoice_number,
  status
)
  values (
  /* Si querés usar el uid real del usuario y no confiar en el payload: */
  coalesce(nullif(p_load_order->>'business_owner_id','')::uuid, auth.uid()),

  (p_load_order->>'load_order_number')::bigint,               -- o ::text si preferís textual
  nullif(p_load_order->>'provider_id','')::bigint,
  (p_load_order->>'delivery_date')::date,

  nullif(p_load_order->>'receptor_other',''),                 -- 👈 texto o NULL
  nullif(p_load_order->>'receptor_id','')::uuid,              -- 👈 uuid o NULL

  case
    when p_load_order ? 'transporter_data' then (p_load_order->'transporter_data')::jsonb
    else null
  end,
  nullif(p_load_order->>'invoice_number','')::numeric,
  coalesce(p_load_order->>'status', 'pending')
)
returning load_orders.load_order_id into v_load_order_id;

  ---------------------------------------------------------------------------
  -- 2) INSERT lots
  --    p_lots: cada elemento DEBE traer "client_key".
  ---------------------------------------------------------------------------
  with lot_rows as (
     select
    (x->>'client_key')::text                       as client_key,
    (x->>'product_id')::bigint                     as product_id,
    nullif(x->>'lot_number','')::bigint            as lot_number,
    nullif(x->>'expiration_date','')::date         as expiration_date,
    (x->>'expiration_date_notification')::boolean  as expiration_date_notification,
    nullif(x->>'provider_id','')::bigint           as provider_id,
    (x->>'has_lot_container')::boolean             as has_lot_container,
    (x->>'is_parent_lot')::boolean                 as is_parent_lot,
    nullif(x->>'parent_lot_id','')::bigint         as parent_lot_id,
    (x->>'lot_control')::boolean                   as lot_control,
    (x->>'initial_stock_quantity')::numeric        as initial_stock_quantity,

     (x->>'bulk_quantity_equivalence')::numeric           as bulk_quantity_equivalence,

   (x->>'download_total_cost')::numeric           as download_total_cost,
   (x->>'download_cost_per_unit')::numeric        as download_cost_per_unit,
   (x->>'download_cost_per_bulk')::numeric        as download_cost_per_bulk,

   (x->>'purchase_cost_total')::numeric           as purchase_cost_total,
   (x->>'purchase_cost_per_unit')::numeric        as purchase_cost_per_unit,
   (x->>'purchase_cost_per_bulk')::numeric        as purchase_cost_per_bulk,

   (x->>'final_cost_total')::numeric              as final_cost_total,
   (x->>'final_cost_per_unit')::numeric           as final_cost_per_unit,
   (x->>'final_cost_per_bulk')::numeric           as final_cost_per_bulk,


    (x->>'is_sold_out')::boolean                   as is_sold_out,
    (x->>'is_expired')::boolean                    as is_expired,

    -- PRODUCTOR COMMISSIONS
(x->>'productor_commission_type')::commission_type           as productor_commission_type,
(x->>'productor_commission_percentage')::numeric        as productor_commission_percentage,
(x->>'productor_commission_unit_value')::numeric        as productor_commission_unit_value,

(x->>'purchasing_agent_id')::numeric           as purchasing_agent_id,
(x->>'purchasing_agent_commision_type')::commission_type           as purchasing_agent_commision_type,
(x->>'purchasing_agent_commision_percentage')::numeric        as purchasing_agent_commision_percentage,
(x->>'purchasing_agent_commision_unit_value')::numeric        as purchasing_agent_commision_unit_value
  from jsonb_array_elements(p_lots) as x
  ),
 ins_lots as (
  insert into lots (
    load_order_id,
    product_id,
    lot_number,
    expiration_date,
    expiration_date_notification,
    provider_id,
    has_lot_container,
    is_parent_lot,
    parent_lot_id,
    lot_control,
    initial_stock_quantity,
    bulk_quantity_equivalence,

    current_stock_quantity,
    is_sold_out,
    is_expired,

    download_total_cost,
    download_cost_per_unit,
    download_cost_per_bulk,

    purchase_cost_total,
    purchase_cost_per_unit,
    purchase_cost_per_bulk,

    final_cost_total,
    final_cost_per_unit,
    final_cost_per_bulk,

    productor_commission_type,
    productor_commission_percentage,
    productor_commission_unit_value,

    purchasing_agent_id,
    purchasing_agent_commision_type,
    purchasing_agent_commision_percentage,
    purchasing_agent_commision_unit_value
  )
  select
    v_load_order_id,
    product_id,
    lot_number,
    expiration_date,
    expiration_date_notification,
    provider_id,
    has_lot_container,
    is_parent_lot,
    parent_lot_id,
    lot_control,
    initial_stock_quantity,
    bulk_quantity_equivalence,

    initial_stock_quantity as current_stock_quantity,
    is_sold_out,
    is_expired,

    download_total_cost,
    download_cost_per_unit,
    download_cost_per_bulk,

    purchase_cost_total,
    purchase_cost_per_unit,
    purchase_cost_per_bulk,

    final_cost_total,
    final_cost_per_unit,
    final_cost_per_bulk,
  coalesce(productor_commission_type, 'NONE'::commission_type) as productor_commission_type,
    productor_commission_percentage,
    productor_commission_unit_value,

    purchasing_agent_id,
      coalesce(purchasing_agent_commision_type, 'NONE'::commission_type) as purchasing_agent_commision_type,
    purchasing_agent_commision_percentage,
    purchasing_agent_commision_unit_value
    from lot_rows
    returning lot_id, product_id, initial_stock_quantity, lot_number, expiration_date, expiration_date_notification, provider_id,  has_lot_container, is_parent_lot, parent_lot_id, lot_control, is_sold_out, is_expired
  ),


  -- 👇 Nuevo bloque para STOCK
  ins_stock as (
    insert into stock (
      lot_id,
      product_id,     
      current_quantity,
      min_notification,
      max_notification,
      stock_type,
      transformed_from_product_id,
      transformed_to_product_id,
      last_updated
    )
    select
      lot_id,
      product_id,               -- 👈 viene de ins_lots
      initial_stock_quantity,     -- current_quantity
      null,                       -- min_notification
      null,                       -- max_notification
      'NOT ASSIGNED'::stock_type, -- stock_type
      null,                       -- transformed_from_product_id
      null,                       -- transformed_to_product_id
      null                        -- last_updated
    from ins_lots
    returning stock_id, lot_id, current_quantity, stock_type
  ),




  -- Emparejamos los INSERT con client_key preservando el orden de aparición
  lot_rows_numbered as (
    select client_key, row_number() over () as rn
    from lot_rows
  ),
  ins_lots_numbered as (
    select *, row_number() over () as rn
    from ins_lots
  ),
  ins_lots_with_keys as (
    select
      l.client_key,
      i.*
    from lot_rows_numbered l
    join ins_lots_numbered i using (rn)
  ),

   ins_lot_containers as (
  insert into lot_containers_location (
    business_owner_id,
    lot_id,
    lot_container_id,
    quantity,
    created_at,
    store_id,
    stock_room_id,
    client_id,
    provider_id,
    stock_id
  )
  select
    coalesce(nullif(p_load_order->>'business_owner_id','')::uuid, auth.uid()),
    il.lot_id,
    (c->>'lot_container_id')::bigint,
    (c->>'quantity')::bigint,
    now(),
    null,
    null,
    null,
    il.provider_id,
    s.stock_id   -- ✅ ahora sí existe
  from ins_lots_with_keys il
  join ins_stock s on s.lot_id = il.lot_id   -- 👈 añadimos esta unión
  join lateral (
    select jsonb_array_elements(x->'lot_containers') as c
    from jsonb_array_elements(p_lots) x
    where (x->>'client_key') = il.client_key
      and x ? 'lot_containers'
      and jsonb_typeof(x->'lot_containers') = 'array'
  ) as containers on true
)


  select jsonb_agg(
    jsonb_build_object(
      'client_key', client_key,
      'lot_id', lot_id,
      'product_id', product_id,
      'lot_number', lot_number,
      'expiration_date', expiration_date,
      'expiration_date_notification', expiration_date_notification,
      'provider_id', provider_id,
      'has_lot_container', has_lot_container,
      'is_parent_lot', is_parent_lot,
      'parent_lot_id', parent_lot_id,
      'lot_control', lot_control,
      'initial_stock_quantity', initial_stock_quantity,
      'is_sold_out', is_sold_out,
      'is_expired', is_expired
    )
  )
  into v_lots
  from ins_lots_with_keys;

  


  ---------------------------------------------------------------------------
  -- 3) INSERT prices
  --    p_prices: cada elemento usa "lot_client_key" para mapear al lot real.
  ---------------------------------------------------------------------------
  --with price_rows as (
   -- select
   --   (x->>'lot_client_key')::text                  as lot_client_key,   -- requerido
  --    (x->>'price_number')::int                     as price_number,
   --   (x->>'unit_price')::numeric                   as unit_price,
  --    (x->>'units_per_price')::numeric              as units_per_price,
  --    (x->>'profit_percentage')::numeric            as profit_percentage,
   --   upper(x->>'price_type')::price_type                     as price_type,        -- 'MINOR' | 'MAYOR'
  --    (x->>'logic_type')::logic_type                      as logic_type,   
  --    nullif(x->>'observations','')::text           as observations,
  --    (x->>'is_limited_offer')::boolean             as is_limited_offer,
   --   (x->>'is_active')::boolean                    as is_active,
  --    nullif(x->>'valid_from','')::timestamptz      as valid_from,
   --   nullif(x->>'valid_until','')::timestamptz     as valid_until
  --  from jsonb_array_elements(p_prices) as x
 -- ),
 -- mapped as (
  --  select
 --     pr.*,
  --    (elem->>'lot_id')::bigint as lot_id
 --   from price_rows pr
   -- join jsonb_array_elements(v_lots) elem
   --   on pr.lot_client_key = (elem->>'client_key')
  --),
  --ins_prices as (
  --  insert into prices (
    --  lot_id,
   --   price_number,
   --   unit_price,
   --   units_per_price,
   --   profit_percentage,
   --   price_type,
  --    logic_type,
    --  observations,
   --   is_limited_offer,
  --    is_active,
    --  valid_from,
   --   valid_until
 --   )
 --   select
 --     lot_id,
  --    price_number,
    --  unit_price,
   --   units_per_price,
   --   profit_percentage,
    --  price_type,
   --   logic_type,
   --   observations,
   --   is_limited_offer,
    --  is_active,
  --    valid_from,
     -- valid_until
 --   from mapped
   -- returning price_id, lot_id, price_number, unit_price, units_per_price,
       --       profit_percentage, price_type, logic_type, observations,
       --       is_limited_offer, is_active, valid_from, valid_until,
      --        created_at, updated_at
 -- )
 -- select jsonb_agg(
  --  jsonb_build_object(
  --    'price_id', price_id,
   --   'lot_id', lot_id,
  --    'price_number', price_number,
   --   'unit_price', unit_price,
  --    'units_per_price', units_per_price,
  --    'profit_percentage', profit_percentage,
   --   'price_type', price_type,
   --   'logic_type', logic_type,
   --   'observations', observations,
  --    'is_limited_offer', is_limited_offer,
  --    'is_active', is_active,
   --   'valid_from', valid_from,
  --    'valid_until', valid_until,
  --    'created_at', created_at,
      --'updated_at', updated_at
   -- )
  --)
 -- into v_prices
  --from ins_prices;

  ---------------------------------------------------------------------------
  -- 4) Resultado
  ---------------------------------------------------------------------------
  return query
    select v_load_order_id, coalesce(v_lots, '[]'::jsonb);

exception
  when others then
    -- Cualquier error hace que la función falle y Postgres ROLLBACKEA todo.
    raise;
end;
$$;


ALTER FUNCTION "public"."create_load_order_with_lots_and_prices"("p_load_order" "jsonb", "p_lots" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_lot_trace"("p_lot_from_id" bigint, "p_lot_to_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
    insert into lot_traces (
        lot_from_id,
        lot_to_id,
        created_at
    )
    values (
        p_lot_from_id,
        p_lot_to_id,
        now()
    );
end;
$$;


ALTER FUNCTION "public"."create_lot_trace"("p_lot_from_id" bigint, "p_lot_to_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_order"("p_order" "jsonb", "p_order_items" "jsonb", "p_client_transaction" "jsonb" DEFAULT NULL::"jsonb") RETURNS TABLE("order_id" bigint, "order_items" "jsonb", "client_transaction_id" bigint, "stock_movements" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_order_id bigint;
  v_client_transaction_id bigint;
  v_stock_movements jsonb := '[]'::jsonb;
  v_item jsonb;
  v_stock_id bigint;
  v_stock_movement_id bigint;
begin
  ---------------------------------------------------------------------------
  -- 1) Insertar la orden
  ---------------------------------------------------------------------------
  insert into orders (
    organization_id,
    client_id,
    provider_id,
    order_number,
    order_type,
    status,
    payment_method,
    subtotal,
    discount,
    tax,
    total_amount,
    currency,
    notes,
    delivery_date,
    created_at
  )
  values (
    (p_order->>'organization_id')::bigint,
    nullif(p_order->>'client_id','')::bigint,
    nullif(p_order->>'provider_id','')::bigint,
    p_order->>'order_number',
    p_order->>'order_type',
    coalesce(p_order->>'status','PENDING'),
    p_order->>'payment_method',
    (p_order->>'subtotal')::numeric,
    (p_order->>'discount')::numeric,
    (p_order->>'tax')::numeric,
    (p_order->>'total_amount')::numeric,
    p_order->>'currency',
    p_order->>'notes',
    coalesce((p_order->>'delivery_date')::timestamptz, now()),
    now()
  )
  returning order_id into v_order_id;

  ---------------------------------------------------------------------------
  -- 2) Insertar los order_items, actualizar stock y registrar movimientos
  ---------------------------------------------------------------------------
  for v_item in
    select * from jsonb_array_elements(p_order_items)
  loop
    -- Insertar el order_item
    insert into order_items (
      order_id,
      product_id,
      lot_id,
      price_id,
      quantity,
      unit_price,
      total_price,
      created_at
    )
    values (
      v_order_id,
      (v_item->>'product_id')::bigint,
      (v_item->>'lot_id')::bigint,
      nullif(v_item->>'price_id','')::bigint,
      (v_item->>'quantity')::numeric,
      (v_item->>'unit_price')::numeric,
      (v_item->>'total_price')::numeric,
      now()
    );

    -- Actualizar stock (descontar cantidad del lote en la ubicación actual)
    update stock
    set current_quantity = current_quantity - (v_item->>'quantity')::numeric,
        last_updated = now()
    where lot_id = (v_item->>'lot_id')::bigint
    returning stock_id into v_stock_id;

    -- Insertar movimiento de stock
    insert into stock_movements (
      lot_id,
      movement_type,
      quantity,
      from_location_id,
      to_location_id,
      should_notify_owner,
      created_at
    )
    values (
      (v_item->>'lot_id')::bigint,
      'SALE',
      (v_item->>'quantity')::numeric,
      (v_item->>'from_location_id')::bigint,  -- opcional en tu payload
      null,                                   -- no se transfiere a otra locación
      false,
      now()
    )
    returning stock_movement_id into v_stock_movement_id;

    v_stock_movements := v_stock_movements || jsonb_build_object(
      'stock_movement_id', v_stock_movement_id,
      'lot_id', (v_item->>'lot_id')::bigint,
      'quantity', (v_item->>'quantity')::numeric
    );
  end loop;

  ---------------------------------------------------------------------------
  -- 3) Insertar la transacción del cliente (si aplica)
  ---------------------------------------------------------------------------
  if p_client_transaction is not null then
    insert into client_transactions (
      client_id,
      order_id,
      transaction_type,
      amount,
      description,
      created_at
    )
    values (
      (p_client_transaction->>'client_id')::bigint,
      v_order_id,
      p_client_transaction->>'transaction_type',
      (p_client_transaction->>'amount')::numeric,
      p_client_transaction->>'description',
      now()
    )
    returning transaction_id into v_client_transaction_id;
  end if;

  ---------------------------------------------------------------------------
  -- 4) Retornar resultado
  ---------------------------------------------------------------------------
  return query
  select v_order_id, p_order_items, v_client_transaction_id, v_stock_movements;
end;
$$;


ALTER FUNCTION "public"."create_order"("p_order" "jsonb", "p_order_items" "jsonb", "p_client_transaction" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_organization_with_owner"("p_user_id" "uuid", "p_email" "text", "p_organization_name" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_org_id uuid;
begin
  --------------------------------------------------
  -- 1️⃣ Crear organización (con o sin nombre)
  --------------------------------------------------
  insert into organizations (organization_name)
  values (
    coalesce(p_organization_name, '')
  )
  returning organization_id
  into v_org_id;

  --------------------------------------------------
  -- 2️⃣ Crear usuario OWNER asociado
  --------------------------------------------------
  insert into users (
    id,
    email,
    role,
    organization_id
  )
  values (
    p_user_id,
    p_email,
    'OWNER',
    v_org_id
  );

  --------------------------------------------------
  -- 3️⃣ Retornar organization_id
  --------------------------------------------------
  return v_org_id;
end;
$$;


ALTER FUNCTION "public"."create_organization_with_owner"("p_user_id" "uuid", "p_email" "text", "p_organization_name" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "order_id" bigint NOT NULL,
    "location_id" bigint,
    "client_id" bigint,
    "provider_id" bigint,
    "order_number" bigint NOT NULL,
    "subtotal" numeric(12,2) DEFAULT 0 NOT NULL,
    "discount" numeric(12,2) DEFAULT 0 NOT NULL,
    "tax" numeric(12,2) DEFAULT 0 NOT NULL,
    "total_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "currency" character varying(3) DEFAULT 'ARS'::character varying,
    "notes" "text",
    "delivery_date" timestamp without time zone,
    "created_at" timestamp with time zone,
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    "client_type" "public"."client_type",
    "payment_status" "public"."payment_status",
    "order_status" "public"."order_status" DEFAULT 'NEW'::"public"."order_status",
    "order_type" "public"."order_type",
    "organization_id" "uuid",
    "terminal_session_id" bigint
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_simple_order"("p_organization_id" "uuid", "p_location_id" bigint, "p_client_id" bigint) RETURNS "public"."orders"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_order orders;
  v_order_number bigint;
begin
  -- Generar número correlativo para la tienda
  v_order_number := generate_order_number(p_location_id);

  -- Insertar orden mínima
  insert into orders (
    organization_id,
    location_id,
    client_id,
    order_number,
    created_at
  )
  values (
    p_organization_id,
    p_location_id,
    p_client_id,
    v_order_number,
    now()
  )
  returning * into v_order;

  return v_order;
end;
$$;


ALTER FUNCTION "public"."create_simple_order"("p_organization_id" "uuid", "p_location_id" bigint, "p_client_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_stock_movement_waste"("p_lot_id" bigint, "p_stock_id" bigint, "p_movement_type" "public"."movement_type", "p_quantity" numeric, "p_from_location_id" bigint, "p_to_location_id" bigint, "p_should_notify_owner" boolean, "p_created_by" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_stock_movement_id bigint;
begin
  -- 1️⃣ Aplicar merma (reduce stock)
  perform public.update_stock_waste(
    p_stock_id,
    p_quantity
  );

  -- 2️⃣ Registrar movimiento
  v_stock_movement_id := public.insert_stock_movement(
    p_lot_id,
    p_stock_id,
    p_movement_type,
    p_quantity,
    p_from_location_id,
    p_to_location_id,
    p_should_notify_owner,
    p_created_by
  );

  return jsonb_build_object(
    'success', true,
    'stock_movement_id', v_stock_movement_id
  );
end;
$$;


ALTER FUNCTION "public"."create_stock_movement_waste"("p_lot_id" bigint, "p_stock_id" bigint, "p_movement_type" "public"."movement_type", "p_quantity" numeric, "p_from_location_id" bigint, "p_to_location_id" bigint, "p_should_notify_owner" boolean, "p_created_by" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_transformation"("p_transformation_data" "jsonb", "p_transformation_items" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    v_transformation_id bigint;
    v_items jsonb;
begin
    ------------------------------------------------------
    -- 1) Crear header
    ------------------------------------------------------
    v_transformation_id := public.transformation_header(p_transformation_data);

    ------------------------------------------------------
    -- 2) Procesar TODOS los transformation_items
    ------------------------------------------------------
    v_items := public.transformation_items(
        v_transformation_id,
        p_transformation_items
    );

    ------------------------------------------------------
    -- 3) Respuesta final
    ------------------------------------------------------
    return jsonb_build_object(
        'transformation_id', v_transformation_id,
        'items', v_items
    );
end;
$$;


ALTER FUNCTION "public"."create_transformation"("p_transformation_data" "jsonb", "p_transformation_items" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_organization_id"() RETURNS "uuid"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select u.organization_id
  from public.users u
  where u.id = auth.uid();
$$;


ALTER FUNCTION "public"."current_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_delivery_order_item"("p_order_item_id" bigint, "p_stock_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_quantity numeric;
  v_over_sell_quantity numeric;
  v_total_reserved numeric;
begin
  ------------------------------------------------------------------
  -- 📋 Obtener cantidades del order_item
  ------------------------------------------------------------------
  select quantity, over_sell_quantity
  into v_quantity, v_over_sell_quantity
  from order_items
  where order_item_id = p_order_item_id;

  if not found then
    raise exception 'Order item % no encontrado', p_order_item_id;
  end if;

  v_total_reserved := v_quantity + v_over_sell_quantity;

  ------------------------------------------------------------------
  -- ❌ Actualizar status a CANCELLED
  ------------------------------------------------------------------
  update order_items
  set status = 'CANCELLED',
      updated_at = now()
  where order_item_id = p_order_item_id;

  ------------------------------------------------------------------
  -- 🔓 Descontar reserved_for_selling_quantity  ------------------------------------------------------------------
  update stock
  set reserved_for_selling_quantity = coalesce(reserved_for_selling_quantity, 0) - v_total_reserved,
      updated_at = now()
  where stock_id = p_stock_id;
end;
$$;


ALTER FUNCTION "public"."delete_delivery_order_item"("p_order_item_id" bigint, "p_stock_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deliver_order"("p_order_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_items jsonb;
begin
  ------------------------------------------------------------------
  -- 📦 Obtener todos los order_items PENDING
  ------------------------------------------------------------------
  select jsonb_agg(
    jsonb_build_object(
      'order_item_id', oi.order_item_id,
      'stock_id', oi.stock_id,
      'quantity', oi.quantity,
      'over_sell_quantity', oi.over_sell_quantity
    )
  )
  into v_items
  from order_items oi
  where oi.order_id = p_order_id
    and oi.status = 'PENDING';

  ------------------------------------------------------------------
  -- ✅ Actualizar order_items a COMPLETED
  ------------------------------------------------------------------
  update order_items
  set status = 'COMPLETED',
      updated_at = now()
  where order_id = p_order_id
    and status = 'PENDING';

  ------------------------------------------------------------------
  -- 🚚 Actualizar orden a DELIVERED
  ------------------------------------------------------------------
  update orders
  set order_status = 'DELIVERED',
      updated_at = now()
  where order_id = p_order_id;

  ------------------------------------------------------------------
  -- 📊 Procesar stock para cada item
  ------------------------------------------------------------------
  if v_items is not null then
    perform process_delivered_items_stock(v_items);
  end if;
end;
$$;


ALTER FUNCTION "public"."deliver_order"("p_order_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_order_number"("p_location_id" bigint) RETURNS bigint
    LANGUAGE "plpgsql"
    AS $$
declare
  v_next_number bigint;
begin
  -- Insertar fila si no existe para ese store
  insert into store_order_sequences (store_id, last_number)
  values (p_location_id, 0)
  on conflict (store_id) do nothing;

  -- Incrementar y devolver
  update store_order_sequences
  set last_number = last_number + 1
  where store_id = p_location_id
  returning last_number into v_next_number;

  -- Si es la primera vez → devolverá 1
  return v_next_number;
end;
$$;


ALTER FUNCTION "public"."generate_order_number"("p_location_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_last_over_sell_stock"("p_product_id" bigint, "p_product_presentation_id" bigint, "p_location_id" bigint) RETURNS TABLE("stock_id" bigint, "lot_id" bigint, "over_sell_quantity" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  return query
  select
    s.stock_id,
    s.lot_id,
    coalesce(s.over_sell_quantity, 0)
  from stock s
  join lots l on l.lot_id = s.lot_id
  where l.product_id = p_product_id
    and l.product_presentation_id = p_product_presentation_id
    and s.location_id = p_location_id
  order by l.created_at desc
  limit 1;
end;
$$;


ALTER FUNCTION "public"."get_last_over_sell_stock"("p_product_id" bigint, "p_product_presentation_id" bigint, "p_location_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_lot_ancestors"("p_lot_id" bigint) RETURNS TABLE("lot_from_id" bigint, "lot_to_id" bigint, "level" integer)
    LANGUAGE "sql"
    AS $$
with recursive parents as (
    select
        lt.lot_from_id,
        lt.lot_to_id,
        1 as level
    from lot_traces lt
    where lt.lot_to_id = p_lot_id

    union all

    select
        lt.lot_from_id,
        lt.lot_to_id,
        p.level + 1
    from lot_traces lt
    join parents p
      on lt.lot_to_id = p.lot_from_id
)
select * from parents;
$$;


ALTER FUNCTION "public"."get_lot_ancestors"("p_lot_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_lot_descendants"("p_lot_id" bigint) RETURNS TABLE("root_lot" bigint, "lot_from_id" bigint, "lot_to_id" bigint, "level" integer)
    LANGUAGE "sql"
    AS $$
with recursive tree as (
    select
        lt.lot_from_id as root_lot,
        lt.lot_from_id,
        lt.lot_to_id,
        1 as level
    from lot_traces lt
    where lt.lot_from_id = p_lot_id

    union all

    select
        t.root_lot,
        lt.lot_from_id,
        lt.lot_to_id,
        t.level + 1
    from lot_traces lt
    join tree t
      on lt.lot_from_id = t.lot_to_id
)
select * from tree;
$$;


ALTER FUNCTION "public"."get_lot_descendants"("p_lot_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_lot_lineage"("p_lot_id" bigint) RETURNS TABLE("lot_from_id" bigint, "lot_to_id" bigint, "direction" "text", "level" integer)
    LANGUAGE "sql"
    AS $$
select lot_from_id, lot_to_id, 'down' as direction, level
from public.get_lot_descendants(p_lot_id)

union all

select lot_from_id, lot_to_id, 'up' as direction, level
from public.get_lot_ancestors(p_lot_id);
$$;


ALTER FUNCTION "public"."get_lot_lineage"("p_lot_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_lot_performance"("p_lot_id" bigint) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    v_lots bigint[];
    v_sales jsonb;
    v_stock jsonb;
    v_transfers jsonb;
    v_transformations jsonb;
begin
    -------------------------------------------------------------------
    -- 1️⃣ Universo de lotes
    -------------------------------------------------------------------
    select array_agg(lot_id)
    into v_lots
    from public.get_lot_universe(p_lot_id);

    -------------------------------------------------------------------
    -- 2️⃣ Ventas
    -------------------------------------------------------------------
    select jsonb_agg(row_to_json(s))
    into v_sales
    from (
        select
            oi.lot_id,
            oi.location_id,
            oi.product_presentation_id,
            sum(oi.quantity) as quantity_sold,
            sum(oi.total) as total_amount
        from order_items oi
        where oi.lot_id = any(v_lots)
        group by oi.lot_id, oi.location_id, oi.product_presentation_id
    ) s;

    -------------------------------------------------------------------
    -- 3️⃣ Stock actual
    -------------------------------------------------------------------
    select jsonb_agg(row_to_json(st))
    into v_stock
    from (
        select
            lot_id,
            location_id,
            sum(quantity) as current_quantity
        from stock
        where lot_id = any(v_lots)
        group by lot_id, location_id
    ) st;

    -------------------------------------------------------------------
    -- 4️⃣ Transformaciones (árbol puro)
    -------------------------------------------------------------------
    select jsonb_agg(row_to_json(t))
    into v_transformations
    from (
        select *
        from lot_traces
        where lot_from_id = any(v_lots)
           or lot_to_id = any(v_lots)
    ) t;

    -------------------------------------------------------------------
    -- 5️⃣ Transferencias / movimientos
    -------------------------------------------------------------------
    select jsonb_agg(row_to_json(m))
    into v_transfers
    from (
        select
            sm.lot_id,
            sm.from_location_id,
            sm.to_location_id,
            sm.quantity,
            sm.created_at
        from stock_movements sm
        where sm.lot_id = any(v_lots)
    ) m;

    -------------------------------------------------------------------
    -- 📤 Resultado final
    -------------------------------------------------------------------
    return jsonb_build_object(
        'root_lot_id', p_lot_id,
        'lots_involved', v_lots,
        'sales', coalesce(v_sales, '[]'),
        'current_stock', coalesce(v_stock, '[]'),
        'transformations', coalesce(v_transformations, '[]'),
        'transfers', coalesce(v_transfers, '[]')
    );
end;
$$;


ALTER FUNCTION "public"."get_lot_performance"("p_lot_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_lot_universe"("p_lot_id" bigint) RETURNS TABLE("lot_id" bigint)
    LANGUAGE "sql"
    AS $$
with recursive down_tree as (
    select lt.lot_to_id as lot_id
    from lot_traces lt
    where lt.lot_from_id = p_lot_id

    union all

    select lt.lot_to_id
    from lot_traces lt
    join down_tree d on lt.lot_from_id = d.lot_id
),
up_tree as (
    select lt.lot_from_id as lot_id
    from lot_traces lt
    where lt.lot_to_id = p_lot_id

    union all

    select lt.lot_from_id
    from lot_traces lt
    join up_tree u on lt.lot_to_id = u.lot_id
)
select p_lot_id as lot_id
union
select lot_id from down_tree
union
select lot_id from up_tree;
$$;


ALTER FUNCTION "public"."get_lot_universe"("p_lot_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_stock_with_location_pi_and_pi"("p_product_id" bigint, "p_product_presentation_id" bigint, "p_location_id" bigint) RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_stock_id bigint;
  v_lot_id bigint;
begin
  ------------------------------------------------------------------
  -- 🔍 Buscar último stock existente
  ------------------------------------------------------------------
  select s.stock_id
  into v_stock_id
  from stock s
  join lots l on l.lot_id = s.lot_id
  where l.product_id = p_product_id
    and l.product_presentation_id = p_product_presentation_id
    and s.location_id = p_location_id
  order by l.created_at desc
  limit 1;

  ------------------------------------------------------------------
  -- ✅ Si existe → retornar
  ------------------------------------------------------------------
  if v_stock_id is not null then
    return v_stock_id;
  end if;

  ------------------------------------------------------------------
  -- 🆕 Si no existe → crear lote + stock
  ------------------------------------------------------------------
  insert into lots (product_id, product_presentation_id, created_at)
  values (p_product_id, p_product_presentation_id, now())
  returning lot_id into v_lot_id;

  insert into stock (lot_id, location_id, quantity, reserved_for_selling_quantity, created_at)
  values (v_lot_id, p_location_id, 0, 0, now())
  returning stock_id into v_stock_id;

  return v_stock_id;
end;
$$;


ALTER FUNCTION "public"."get_or_create_stock_with_location_pi_and_pi"("p_product_id" bigint, "p_product_presentation_id" bigint, "p_location_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_products_stock_status_by_short_code"("p_short_code" bigint, "p_organization_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_result jsonb;
begin
  -- Generar JSON con todos los productos activos que usan ese short_code
  select jsonb_agg(
    jsonb_build_object(
      'product_id', p.product_id,
      'product_name', p.product_name,
      'is_sold_out', not exists (
        select 1
        from lots l
        where l.product_id = p.product_id
          and l.is_sold_out = false
      )
    )
  )
  into v_result
  from products p
  where p.short_code = p_short_code
    and p.organization_id = p_organization_id
    and p.deleted_at is null;  -- ✅ solo productos activos

  -- Si no hay productos, devolver array vacío
  if v_result is null then
    v_result := '[]'::jsonb;
  end if;

  return v_result;
end;
$$;


ALTER FUNCTION "public"."get_products_stock_status_by_short_code"("p_short_code" bigint, "p_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_sales_history_by_product_or_lot"("p_product_id" bigint DEFAULT NULL::bigint, "p_lot_id" bigint DEFAULT NULL::bigint) RETURNS TABLE("order_id" bigint, "order_date" timestamp without time zone, "client_id" bigint, "lot_id" bigint, "product_id" bigint, "product_name" "text", "quantity" numeric, "price" numeric, "total" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  return query
  select
    o.order_id,
    o.created_at as order_date,
    o.client_id,
    oi.lot_id,
    l.product_id,
    p.product_name::text as product_name, -- 👈 casteo a text
    oi.quantity,
    oi.price,
    (oi.quantity * oi.price) as total
  from order_items oi
  join orders o on oi.order_id = o.order_id
  join lots l on oi.lot_id = l.lot_id
  join products p on l.product_id = p.product_id
  where (p_product_id is null or l.product_id = p_product_id)
    and (p_lot_id is null or oi.lot_id = p_lot_id)
  order by o.created_at;
end;
$$;


ALTER FUNCTION "public"."get_sales_history_by_product_or_lot"("p_product_id" bigint, "p_lot_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_sales_history_by_product_or_lots"("p_product_id" bigint DEFAULT NULL::bigint, "p_lot_id" bigint DEFAULT NULL::bigint) RETURNS TABLE("order_id" bigint, "order_date" timestamp with time zone, "client_id" bigint, "lot_id" bigint, "product_id" bigint, "product_name" "text", "quantity" numeric, "price" numeric, "total" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  return query
  select
    o.order_id,
    o.created_at as order_date,
    o.client_id,
    oi.lot_id,
    l.product_id,
    p.product_name,
    oi.quantity,
    oi.price,                            
    (oi.quantity * oi.price) as total
  from order_items oi
  join orders o on oi.order_id = o.order_id
  join lots l on oi.lot_id = l.lot_id
  join products p on l.product_id = p.product_id
  where (p_product_id is null or l.product_id = p_product_id)
    and (p_lot_id is null or oi.lot_id = p_lot_id)
  order by o.created_at;
end;
$$;


ALTER FUNCTION "public"."get_sales_history_by_product_or_lots"("p_product_id" bigint, "p_lot_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_stock_sales_history"("p_product_id" bigint DEFAULT NULL::bigint, "p_lot_id" bigint DEFAULT NULL::bigint) RETURNS TABLE("stock_movement_id" bigint, "movement_date" timestamp with time zone, "lot_id" bigint, "product_id" bigint, "product_name" "text", "quantity" numeric, "price" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  return query
  select
    sm.stock_movement_id,
    sm.created_at as movement_date,
    sm.lot_id,
    l.product_id,
    p.product_name::text,
    sm.quantity,
    sm.price  -- 👈 agregado aquí
  from stock_movements sm
  join lots l on sm.lot_id = l.lot_id
  join products p on l.product_id = p.product_id
  where sm.movement_type = 'SALE'
    and (p_product_id is null or l.product_id = p_product_id)
    and (p_lot_id is null or sm.lot_id = p_lot_id)
  order by sm.created_at desc;
end;
$$;


ALTER FUNCTION "public"."get_stock_sales_history"("p_product_id" bigint, "p_lot_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_top_products_last_30_days"("p_organization_id" "uuid") RETURNS TABLE("name" "text", "sales" numeric)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select
    p.product_name as name,
    sum(oi.quantity) as sales
  from order_items oi
  join orders o
    on o.order_id = oi.order_id
  join products p
    on p.product_id = oi.product_id
  where
    o.organization_id = p_organization_id
    and oi.created_at >= now() - interval '30 days'
    and oi.status = 'COMPLETED'
    and oi.is_deleted = false
  group by
    p.product_id,
    p.product_name
  order by sales desc
  limit 10;
$$;


ALTER FUNCTION "public"."get_top_products_last_30_days"("p_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_top_products_last_month"("p_business_owner_id" "uuid") RETURNS TABLE("name" "text", "sales" numeric)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select
    p.product_name as name,
    sum(oi.quantity) as sales
  from orders o
  join order_items oi
    on oi.order_id = o.order_id
  join products p
    on p.product_id = oi.product_id
  where
    o.business_owner_id = p_business_owner_id
    and o.created_at >= date_trunc('month', now()) - interval '1 month'
    and o.created_at < date_trunc('month', now())
    and oi.status = 'COMPLETED'
  group by p.product_name
  order by sales desc
  limit 10;
$$;


ALTER FUNCTION "public"."get_top_products_last_month"("p_business_owner_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_stock_movement"("p_lot_id" bigint, "p_stock_id" bigint, "p_movement_type" "public"."movement_type", "p_quantity" numeric, "p_from_location_id" bigint, "p_to_location_id" bigint, "p_should_notify_owner" boolean, "p_created_by" "uuid") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_stock_movement_id bigint;
begin
  insert into stock_movements (
    lot_id,
    stock_id,
    movement_type,
    quantity,
    from_location_id,
    to_location_id,
    should_notify_owner,
    created_by,
    created_at
  )
  values (
    p_lot_id,
    p_stock_id,
    p_movement_type,
    p_quantity,
    p_from_location_id,
    p_to_location_id,
    coalesce(p_should_notify_owner, false),
    p_created_by,
    now()
  )
  returning stock_movement_id
  into v_stock_movement_id;

  return v_stock_movement_id;
end;
$$;


ALTER FUNCTION "public"."insert_stock_movement"("p_lot_id" bigint, "p_stock_id" bigint, "p_movement_type" "public"."movement_type", "p_quantity" numeric, "p_from_location_id" bigint, "p_to_location_id" bigint, "p_should_notify_owner" boolean, "p_created_by" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_delivered_items_stock"("p_items" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_item jsonb;
  v_order_item_id bigint;
  v_stock_id bigint;
  v_quantity numeric;
  v_over_sell_quantity numeric;
  v_total_reserved numeric;
  v_current_quantity numeric;
  v_remaining numeric;
begin
  ------------------------------------------------------------------
  -- 🔄 Iterar sobre cada item
  ------------------------------------------------------------------
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_order_item_id := (v_item->>'order_item_id')::bigint;
    v_stock_id := (v_item->>'stock_id')::bigint;
    v_quantity := (v_item->>'quantity')::numeric;
    v_over_sell_quantity := (v_item->>'over_sell_quantity')::numeric;
    v_total_reserved := v_quantity + v_over_sell_quantity;

    ------------------------------------------------------------------
    -- 📊 Obtener quantity actual del stock
    ------------------------------------------------------------------
    select quantity into v_current_quantity
    from stock
    where stock_id = v_stock_id;

    ------------------------------------------------------------------
    -- 🔓 Descontar reserved_for_selling_quantity
    ------------------------------------------------------------------
    update stock
    set reserved_for_selling_quantity = coalesce(reserved_for_selling_quantity, 0) - v_total_reserved,
        updated_at = now()
    where stock_id = v_stock_id;

    ------------------------------------------------------------------
    -- 📦 Descontar de quantity (lo que alcance)
    ------------------------------------------------------------------
    if v_current_quantity >= v_total_reserved then
      -- Alcanza: restar todo de quantity
      update stock
      set quantity = quantity - v_total_reserved,
          updated_at = now()
      where stock_id = v_stock_id;
    else
      -- No alcanza: quantity a 0, resto a over_sell
      v_remaining := v_total_reserved - v_current_quantity;
      
      update stock
      set quantity = 0,
          over_sell_quantity = coalesce(over_sell_quantity, 0) + v_remaining,
          updated_at = now()
      where stock_id = v_stock_id;
    end if;

  end loop;
end;
$$;


ALTER FUNCTION "public"."process_delivered_items_stock"("p_items" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."register_client_payments"("p_client_id" bigint, "p_payments" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_payment jsonb;
  v_new_balance numeric;
begin
  -- Validación básica
  if p_client_id is null then
    raise exception 'p_client_id cannot be null';
  end if;

  for v_payment in
    select * from jsonb_array_elements(p_payments)
  loop
    ------------------------------------------------------------------
    -- 1️⃣ Registrar el pago
    ------------------------------------------------------------------
    insert into payments(
      client_id,
      payment_method,
      amount,
      created_at,
      payment_direction,
      payment_type,
      terminal_session_id
    )
    values (
      p_client_id,
      (v_payment->>'payment_method')::payment_method,
      abs((v_payment->>'amount')::numeric),
      now(),
      (v_payment->>'payment_direction')::payment_direction,
      (v_payment->>'payment_type')::payment_type,
      (v_payment->>'terminal_session_id')::bigint

    );

    ------------------------------------------------------------------
    -- 🔴 ON_CREDIT → aumenta deuda
    ------------------------------------------------------------------
    if (v_payment->>'payment_method')::payment_method = 'ON_CREDIT' then

      v_new_balance := apply_client_credit_adjustment(
        p_client_id,
        abs((v_payment->>'amount')::numeric),
        'NEGATIVE'
      );

      insert into client_transactions(
        client_id,
        order_id,
        amount,
        description,
        transaction_type,
        transaction_date,
        payment_method,
        payment_status,
        balance_after_transaction,
        created_at
      )
      values (
        p_client_id,
        null,
        abs((v_payment->>'amount')::numeric),
        'Consumo a crédito',
        'PAYMENT',
        now(),
        'ON_CREDIT',
        'PENDING',
        v_new_balance,
        now()
      );

    ------------------------------------------------------------------
    -- 🟢 OVERPAYMENT → saldo a favor
    ------------------------------------------------------------------
    elsif (v_payment->>'payment_method')::payment_method = 'OVERPAYMENT' then

      v_new_balance := apply_client_credit_adjustment(
        p_client_id,
        abs((v_payment->>'amount')::numeric),
        'POSITIVE'
      );

      insert into client_transactions(
        client_id,
        order_id,
        amount,
        description,
        transaction_type,
        transaction_date,
        payment_method,
        payment_status,
        balance_after_transaction,
        created_at
      )
      values (
        p_client_id,
        null,
        abs((v_payment->>'amount')::numeric),
        'Saldo a favor',
        'PAYMENT',
        now(),
        'OVERPAYMENT',
        'PAID',
        v_new_balance,
        now()
      );

    ------------------------------------------------------------------
    -- ⚪ Pagos normales (CASH / CARD / etc.)
    ------------------------------------------------------------------
    else

      insert into client_transactions(
        client_id,
        order_id,
        amount,
        description,
        transaction_type,
        transaction_date,
        payment_method,
        payment_status,
        balance_after_transaction,
        created_at
      )
      select
        p_client_id,
        null,
        abs((v_payment->>'amount')::numeric),
        'Pago',
        'PAYMENT',
        now(),
        (v_payment->>'payment_method')::payment_method,
        'PAID',
        current_balance,
        now()
      from clients
      where client_id = p_client_id;

    end if;
  end loop;
end;
$$;


ALTER FUNCTION "public"."register_client_payments"("p_client_id" bigint, "p_payments" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."register_order"("p_order" "jsonb", "p_order_items" "jsonb", "p_order_payments" "jsonb") RETURNS TABLE("order_id" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_order_id bigint;
begin
  -- 1) HEADER
  v_order_id := public.register_order_header(p_order);

  -- 2) ITEMS (maneja stock)
  perform public.register_order_items(v_order_id, p_order_items);

  -- 3) PAYMENTS (maneja client_transactions)
  perform public.register_order_payments(v_order_id, p_order_payments);

  -- 4) RETURN
  return query select v_order_id;
end;
$$;


ALTER FUNCTION "public"."register_order"("p_order" "jsonb", "p_order_items" "jsonb", "p_order_payments" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."register_order_header"("p_order" "jsonb") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_order_id bigint;
  v_client_id bigint;
  v_location_id bigint;
begin
  v_order_id := (p_order->>'order_id')::bigint;
  v_location_id := (p_order->>'location_id')::bigint;

  update orders
  set
    organization_id = nullif(p_order->>'organization_id','')::uuid,
    location_id       = v_location_id,
    client_type       = (p_order->>'client_type')::client_type,
    client_id         = nullif(p_order->>'client_id','')::bigint,
    provider_id       = nullif(p_order->>'provider_id','')::bigint,
    order_number      = (p_order->>'order_number')::bigint,
    order_type        = (p_order->>'order_type')::order_type,
    order_status      = (p_order->>'order_status')::order_status,
    payment_status    = (p_order->>'payment_status')::payment_status,
    subtotal          = (p_order->>'subtotal')::numeric,
    discount          = coalesce((p_order->>'discount')::numeric,0),
    tax               = coalesce((p_order->>'tax')::numeric,0),
    total_amount      = (p_order->>'total_amount')::numeric,
    currency          = p_order->>'currency',
    notes             = p_order->>'notes',
    delivery_date     = nullif(p_order->>'delivery_date','')::timestamptz,
    updated_at        = now()
  where order_id = v_order_id
  returning client_id into v_client_id;

  if not found then
    raise exception 'No existe la orden con id=%', v_order_id;
  end if;

  return v_order_id;
end;
$$;


ALTER FUNCTION "public"."register_order_header"("p_order" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."register_order_items"("p_order_id" bigint, "p_items" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_item jsonb;
  v_quantity numeric;
  v_over_sell_quantity numeric;
  v_location_id bigint;
  v_new_qty numeric;
  v_status movement_status;
  v_lot_id bigint;
  v_stock_id bigint;
  v_order_item_id bigint;
  v_order_type order_type;
begin
 ------------------------------------------------------------------
  -- 🔹 Obtener location y order_type de la orden
  ------------------------------------------------------------------
  select o.location_id, o.order_type
  into v_location_id, v_order_type
  from orders o
  where o.order_id = p_order_id;

  ------------------------------------------------------------------
  -- 🔹 Recorrer items
  ------------------------------------------------------------------
  for v_item in
    select * from jsonb_array_elements(p_items)
  loop
    v_quantity := coalesce((v_item->>'quantity')::numeric, 0);
    v_over_sell_quantity := coalesce((v_item->>'over_sell_quantity')::numeric, 0);
    v_status := (v_item->>'status')::movement_status;
    v_lot_id := (v_item->>'lot_id')::bigint;
    v_stock_id := (v_item->>'stock_id')::bigint;

    ------------------------------------------------------------------
    -- 🟢 Insertar SIEMPRE el order_item (histórico)
    ------------------------------------------------------------------
    insert into order_items (
      order_id,
      product_id,
      product_presentation_id,
      stock_id,
      lot_id,
      quantity,
      over_sell_quantity,
      price,
      subtotal,
      discount,
      tax,
      total,
      logic_type,
      price_type,
      status,
      location_id,
      created_at
    )
    values (
      p_order_id,
      (v_item->>'product_id')::bigint,
      (v_item->>'product_presentation_id')::bigint,
      v_stock_id,
      v_lot_id,
      v_quantity,
      v_over_sell_quantity,
      (v_item->>'price')::numeric,
      (v_item->>'subtotal')::numeric,
      coalesce((v_item->>'discount')::numeric, 0),
      coalesce((v_item->>'tax')::numeric, 0),
      (v_item->>'total')::numeric,
      (v_item->>'logic_type')::logic_type,
      (v_item->>'price_type')::price_type,
      v_status,
      v_location_id,
      now()
    )
    returning order_item_id into v_order_item_id; 


    ------------------------------------------------------------------
    -- 🔒 GUARD PRINCIPAL
    -- ❌ Si está CANCELLED → NO tocar stock ni lotes
    ------------------------------------------------------------------
    if v_status = 'CANCELLED' then
      continue;
    end if;

   ------------------------------------------------------------------
if v_order_type = 'DELIVERY' then
  perform reserve_stock_for_delivery(
    v_order_item_id,
    (v_item->>'product_id')::bigint,
    (v_item->>'product_presentation_id')::bigint,
    v_location_id,
    v_stock_id,
    v_quantity,
    v_over_sell_quantity
  );
  continue; -- ✅ CORTAR FLUJO
end if;

if v_stock_id is null then

  -- si hay sobreventa, crear lote + stock
  if v_over_sell_quantity > 0 then
    select
      (r->>'lot_id')::bigint,
      (r->>'stock_id')::bigint
    into v_lot_id, v_stock_id
    from resolve_oversell_stock(
      (v_item->>'product_id')::bigint,
      (v_item->>'product_presentation_id')::bigint,
      v_location_id,
      v_over_sell_quantity
    ) r;

      -- ✅ ACTUALIZAR order_item con los IDs creados
    update order_items
    set lot_id = v_lot_id
    where order_item_id = v_order_item_id;
  end if;

  -- 🔥 CORTAR FLUJO: no tocar stock real
  continue;
end if;


    ------------------------------------------------------------------
    -- 🟢 Descontar stock real
    ------------------------------------------------------------------
    if v_quantity > 0 then
      update stock s
      set quantity = s.quantity - v_quantity,
          updated_at = now()
      where s.stock_id = v_stock_id
      returning s.quantity into v_new_qty;

      if v_new_qty < 0 then
        raise exception 'Stock insuficiente en stock_id=%', v_stock_id;
      end if;
    end if;

    ------------------------------------------------------------------
    -- 🔵 Acumular sobreventa
    ------------------------------------------------------------------
    if v_over_sell_quantity > 0 then
      update stock s
      set over_sell_quantity = coalesce(s.over_sell_quantity, 0) + v_over_sell_quantity,
          updated_at = now()
      where s.stock_id = v_stock_id;
    end if;

    ------------------------------------------------------------------
    -- ✔️ Actualizar sold-out del lote
    ------------------------------------------------------------------
    if v_lot_id is not null then
      perform update_lot_sold_out_status(v_lot_id);
    end if;

  end loop;
end;
$$;


ALTER FUNCTION "public"."register_order_items"("p_order_id" bigint, "p_items" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."register_order_payments"("p_order_id" bigint, "p_payments" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$

declare
  v_payment jsonb;
  v_client_id bigint;
  v_terminal_session_id bigint;
  v_new_balance numeric;
begin
  select client_id, terminal_session_id
  into v_client_id, v_terminal_session_id
  from orders
  where order_id = p_order_id;

  for v_payment in
    select * from jsonb_array_elements(p_payments)
  loop

    insert into payments(
      order_id,
      terminal_session_id,
      payment_method,
      amount,
      created_at,
      payment_direction,
      payment_type
    )
    values (
      p_order_id,
      v_terminal_session_id,
      (v_payment->>'payment_method')::payment_method,
      abs((v_payment->>'amount')::numeric),
      now(),
      (v_payment->>'payment_direction')::payment_direction,
      (v_payment->>'payment_type')::payment_type
    );
    if v_client_id is not null then

      ------------------------------------------------------------------
      -- 🔴 ON_CREDIT → aumenta deuda
      ------------------------------------------------------------------
     if (v_payment->>'payment_method')::payment_method = 'ON_CREDIT' then

  v_new_balance := apply_client_credit_adjustment(
    v_client_id,
    abs((v_payment->>'amount')::numeric),
    'NEGATIVE'
  );

  insert into client_transactions(
    client_id,
    order_id,
    amount,
    description,
    transaction_type,
    transaction_date,
    payment_method,
    payment_status,
    balance_after_transaction,
    created_at
  )
  values (
    v_client_id,
    p_order_id,
    abs((v_payment->>'amount')::numeric),
    concat('Consumo a crédito - orden #', p_order_id),
    'PAYMENT',
    now(),
    'ON_CREDIT',
    'PENDING',
    v_new_balance,
    now()
  );

      ------------------------------------------------------------------
      -- 🟢 OVERPAYMENT → reduce deuda / saldo a favor
      ------------------------------------------------------------------
     elsif (v_payment->>'payment_method')::payment_method = 'OVERPAYMENT' then

  v_new_balance := apply_client_credit_adjustment(
    v_client_id,
    abs((v_payment->>'amount')::numeric),
    'POSITIVE'
  );

  insert into client_transactions(
    client_id,
    order_id,
    amount,
    description,
    transaction_type,
    transaction_date,
    payment_method,
    payment_status,
    balance_after_transaction,
    created_at
  )
  values (
    v_client_id,
    p_order_id,
    abs((v_payment->>'amount')::numeric),
    concat('Saldo a favor - orden #', p_order_id),
    'PAYMENT',
    now(),
    'OVERPAYMENT',
    'PAID',
    v_new_balance,
    now()
  );


      ------------------------------------------------------------------
      -- ⚪ Pagos normales (CASH / CARD / etc.)
      ------------------------------------------------------------------
      else

        insert into client_transactions(
          client_id,
          order_id,
          amount,
          description,
          transaction_type,
          transaction_date,
          payment_method,
          payment_status,
          balance_after_transaction,
          created_at
        )
        select
          v_client_id,
          p_order_id,
          abs((v_payment->>'amount')::numeric),
          concat('Pago de orden #', p_order_id),
          'PAYMENT',
          now(),
          (v_payment->>'payment_method')::payment_method,
          'PAID',
          current_balance,
          now()
        from clients
        where client_id = v_client_id;

      end if;
    end if;
  end loop;
end;
$$;


ALTER FUNCTION "public"."register_order_payments"("p_order_id" bigint, "p_payments" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."register_payments"("p_order_id" bigint, "p_payments" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_payment jsonb;
  v_client_id bigint;
  v_new_balance numeric;
begin
  select client_id
  into v_client_id
  from orders
  where order_id = p_order_id;

  for v_payment in
    select * from jsonb_array_elements(p_payments)
  loop
    -- 1️⃣ Registrar el pago
    insert into payments(
      order_id,
      payment_method,
      amount,
      created_at,
      payment_direction,
      payment_type
    )
    values (
      p_order_id,
      (v_payment->>'payment_method')::payment_method,
      abs((v_payment->>'amount')::numeric),
      now(),
      (v_payment->>'payment_direction')::payment_direction,
       (v_payment->>'payment_type')::payment_type
    );

    if v_client_id is not null then

      ------------------------------------------------------------------
      -- 🔴 ON_CREDIT → aumenta deuda
      ------------------------------------------------------------------
     if (v_payment->>'payment_method')::payment_method = 'ON_CREDIT' then

  v_new_balance := apply_client_credit_adjustment(
    v_client_id,
    abs((v_payment->>'amount')::numeric),
    'NEGATIVE'
  );

  insert into client_transactions(
    client_id,
    order_id,
    amount,
    description,
    transaction_type,
    transaction_date,
    payment_method,
    payment_status,
    balance_after_transaction,
    created_at
  )
  values (
    v_client_id,
    p_order_id,
    abs((v_payment->>'amount')::numeric),
    concat('Consumo a crédito - orden #', p_order_id),
    'PAYMENT',
    now(),
    'ON_CREDIT',
    'PENDING',
    v_new_balance,
    now()
  );

      ------------------------------------------------------------------
      -- 🟢 OVERPAYMENT → reduce deuda / saldo a favor
      ------------------------------------------------------------------
     elsif (v_payment->>'payment_method')::payment_method = 'OVERPAYMENT' then

  v_new_balance := apply_client_credit_adjustment(
    v_client_id,
    abs((v_payment->>'amount')::numeric),
    'POSITIVE'
  );

  insert into client_transactions(
    client_id,
    order_id,
    amount,
    description,
    transaction_type,
    transaction_date,
    payment_method,
    payment_status,
    balance_after_transaction,
    created_at
  )
  values (
    v_client_id,
    p_order_id,
    abs((v_payment->>'amount')::numeric),
    concat('Saldo a favor - orden #', p_order_id),
    'PAYMENT',
    now(),
    'OVERPAYMENT',
    'PAID',
    v_new_balance,
    now()
  );


      ------------------------------------------------------------------
      -- ⚪ Pagos normales (CASH / CARD / etc.)
      ------------------------------------------------------------------
      else

        insert into client_transactions(
          client_id,
          order_id,
          amount,
          description,
          transaction_type,
          transaction_date,
          payment_method,
          payment_status,
          balance_after_transaction,
          created_at
        )
        select
          v_client_id,
          p_order_id,
          abs((v_payment->>'amount')::numeric),
          concat('Pago de orden #', p_order_id),
          'PAYMENT',
          now(),
          (v_payment->>'payment_method')::payment_method,
          'PAID',
          current_balance,
          now()
        from clients
        where client_id = v_client_id;

      end if;
    end if;
  end loop;
end;
$$;


ALTER FUNCTION "public"."register_payments"("p_order_id" bigint, "p_payments" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reserve_stock_for_delivery"("p_order_item_id" bigint, "p_product_id" bigint, "p_product_presentation_id" bigint, "p_location_id" bigint, "p_stock_id" bigint, "p_quantity" numeric, "p_over_sell_quantity" numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_stock_id bigint;
  v_lot_id bigint;
  v_total_to_reserve numeric;
begin
  ------------------------------------------------------------------
  -- 🔍 Obtener o crear stock
  ------------------------------------------------------------------
  if p_stock_id is null then
    v_stock_id := get_or_create_stock_with_location_pi_and_pi(
      p_product_id,
      p_product_presentation_id,
      p_location_id
    );
  else
    v_stock_id := p_stock_id;
  end if;

  ------------------------------------------------------------------
  -- 🔢 Calcular total a reservar
  ------------------------------------------------------------------
  v_total_to_reserve := p_quantity + p_over_sell_quantity;

  ------------------------------------------------------------------
  -- 🔒 Actualizar reserved_for_selling_quantity
  ------------------------------------------------------------------
  update stock s
  set reserved_for_selling_quantity = coalesce(s.reserved_for_selling_quantity, 0) + v_total_to_reserve,
      updated_at = now()
  where s.stock_id = v_stock_id
  returning s.lot_id into v_lot_id;

  ------------------------------------------------------------------
  -- ✅ Actualizar order_item con stock_id y lot_id
  ------------------------------------------------------------------
  update order_items
  set stock_id = v_stock_id,
      lot_id = v_lot_id
  where order_item_id = p_order_item_id;
end;
$$;


ALTER FUNCTION "public"."reserve_stock_for_delivery"("p_order_item_id" bigint, "p_product_id" bigint, "p_product_presentation_id" bigint, "p_location_id" bigint, "p_stock_id" bigint, "p_quantity" numeric, "p_over_sell_quantity" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."resolve_oversell_stock"("p_product_id" bigint, "p_product_presentation_id" bigint, "p_location_id" bigint, "p_over_sell_quantity" numeric) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_lot_id bigint;
  v_stock_id bigint;
begin
  ------------------------------------------------------------------
  -- 1️⃣ Buscar último lote existente
  ------------------------------------------------------------------
  select l.lot_id
  into v_lot_id
  from lots l
  where l.product_id = p_product_id
    and l.product_presentation_id = p_product_presentation_id
  order by l.created_at desc
  limit 1;

  ------------------------------------------------------------------
  -- 2️⃣ Si no existe lote → crear uno
  ------------------------------------------------------------------
  if v_lot_id is null then
    insert into lots (
      product_id,
      product_presentation_id,
      created_at
    )
    values (
      p_product_id,
      p_product_presentation_id,
      now()
    )
    returning lot_id into v_lot_id;
  end if;

  ------------------------------------------------------------------
  -- 3️⃣ Buscar stock del lote en la location
  ------------------------------------------------------------------
  select s.stock_id
  into v_stock_id
  from stock s
  where s.lot_id = v_lot_id
    and s.location_id = p_location_id
  limit 1;

  ------------------------------------------------------------------
  -- 4️⃣ Si no existe stock → crearlo
  ------------------------------------------------------------------
  if v_stock_id is null then
    insert into stock (
      lot_id,
      location_id,
      quantity,
      over_sell_quantity,
      created_at
    )
    values (
      v_lot_id,
      p_location_id,
      0,
      p_over_sell_quantity,
      now()
    )
    returning stock_id into v_stock_id;
  else
    update stock s
    set over_sell_quantity = coalesce(s.over_sell_quantity, 0) + p_over_sell_quantity,
        updated_at = now()
    where s.stock_id = v_stock_id;
  end if;

  ------------------------------------------------------------------
  -- ✔️ Return explícito (sin ambigüedad)
  ------------------------------------------------------------------
  return jsonb_build_object(
    'lot_id', v_lot_id,
    'stock_id', v_stock_id
  );
end;
$$;


ALTER FUNCTION "public"."resolve_oversell_stock"("p_product_id" bigint, "p_product_presentation_id" bigint, "p_location_id" bigint, "p_over_sell_quantity" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_current_timestamp_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."stock_from_transfer_item"("p_stock_id" bigint, "p_quantity" numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  ---------------------------------------------------------------------
  -- ❗ Restar directamente la cantidad transferida:
  --    - quantity
  --    - reserved_for_transfering_quantity
  -- ✔ Valores negativos permitidos (sin greatest())
  ---------------------------------------------------------------------

  update public.stock
  set
    quantity = coalesce(quantity, 0) - coalesce(p_quantity, 0),
    reserved_for_transferring_quantity = coalesce(reserved_for_transferring_quantity, 0) - coalesce(p_quantity, 0),
    updated_at = now()
  where stock_id = p_stock_id;
end;
$$;


ALTER FUNCTION "public"."stock_from_transfer_item"("p_stock_id" bigint, "p_quantity" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."stock_to_transfer_item"("p_stock_type" "public"."stock_type", "p_location_id" bigint, "p_quantity" numeric, "p_product_id" bigint, "p_lot_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_stock_id bigint;
begin
  ---------------------------------------------------------------------
  -- 🛑 Validación obligatoria
  ---------------------------------------------------------------------
  if p_location_id is null then
    raise exception
      '❌ stock_to_transfer_item: p_location_id cannot be NULL (product_id=%, lot_id=%)',
      p_product_id,
      p_lot_id
      using errcode = '23502'; -- not_null_violation
  end if;

  ---------------------------------------------------------------------
  -- 1️⃣ Buscar stock destino según (location_id, lot)
  ---------------------------------------------------------------------
  select stock_id
  into v_stock_id
  from public.stock
  where location_id = p_location_id
    and lot_id = p_lot_id
  limit 1;

  ---------------------------------------------------------------------
  -- 2️⃣ Si el stock destino existe → actualizar cantidades
  ---------------------------------------------------------------------
  if v_stock_id is not null then
    update public.stock
    set
      quantity = coalesce(quantity, 0) + coalesce(p_quantity, 0),

      -- 🔥 restar reservas existentes
      reserved_for_transferring_quantity =
        coalesce(reserved_for_transferring_quantity, 0) - coalesce(p_quantity, 0),

      updated_at = now()
    where stock_id = v_stock_id;

    return;
  end if;

  ---------------------------------------------------------------------
  -- 3️⃣ Si NO existe → crear stock destino
  ---------------------------------------------------------------------
  insert into public.stock (
    location_id,
    product_id,
    lot_id,
    quantity,
    reserved_for_transferring_quantity,
    created_at,
    updated_at
  )
  values (
    p_location_id,
    p_product_id,
    p_lot_id,
    coalesce(p_quantity, 0),

    -- 🔥 Nuevo stock → no tiene reservas previas
    0,

    now(),
    now()
  );
end;
$$;


ALTER FUNCTION "public"."stock_to_transfer_item"("p_stock_type" "public"."stock_type", "p_location_id" bigint, "p_quantity" numeric, "p_product_id" bigint, "p_lot_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."stock_to_transfer_item"("p_stock_type" "public"."stock_type", "p_store_id" bigint, "p_stock_room_id" bigint, "p_quantity" numeric, "p_product_id" bigint, "p_lot_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_stock_id bigint;
begin
  ---------------------------------------------------------------------
  -- 1️⃣ Buscar stock destino según (store, stock_room, stock_type, lot)
  ---------------------------------------------------------------------
  select stock_id
  into v_stock_id
  from public.stock
  where store_id = p_store_id
    and stock_room_id = p_stock_room_id
    and stock_type = p_stock_type
    and lot_id = p_lot_id
  limit 1;

  ---------------------------------------------------------------------
  -- 2️⃣ Si el stock destino existe → actualizar cantidades
  ---------------------------------------------------------------------
  if v_stock_id is not null then
    update public.stock
    set
      current_quantity = coalesce(current_quantity, 0) + coalesce(p_quantity, 0),

      -- 🔥 restar reservas existentes
      reserved_for_transfering_quantity =
        coalesce(reserved_for_transfering_quantity, 0) - coalesce(p_quantity, 0),

      updated_at = now()
    where stock_id = v_stock_id;

    return;
  end if;

  ---------------------------------------------------------------------
  -- 3️⃣ Si NO existe → crear stock destino
  ---------------------------------------------------------------------
  insert into public.stock (
    stock_type,
    store_id,
    stock_room_id,
    product_id,
    lot_id,
    current_quantity,
    reserved_for_transfering_quantity,
    created_at,
    updated_at
  )
  values (
    p_stock_type,
    p_store_id,
    p_stock_room_id,
    p_product_id,
    p_lot_id,
    coalesce(p_quantity, 0),

    -- 🔥 Nuevo stock → no tiene reservas previas
    0,

    now(),
    now()
  );
end;
$$;


ALTER FUNCTION "public"."stock_to_transfer_item"("p_stock_type" "public"."stock_type", "p_store_id" bigint, "p_stock_room_id" bigint, "p_quantity" numeric, "p_product_id" bigint, "p_lot_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."subtract_stock_quantity"("p_stock_id" bigint, "p_quantity" numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_quantity numeric;
begin
  update stock
  set quantity = quantity - p_quantity
  where stock_id = p_stock_id
  returning quantity into v_quantity;

  if not found then
    raise exception 'Stock not found (stock_id=%)', p_stock_id;
  end if;

  if v_quantity < 0 then
    raise exception 'Stock cannot be negative (stock_id=%)', p_stock_id;
  end if;
end;
$$;


ALTER FUNCTION "public"."subtract_stock_quantity"("p_stock_id" bigint, "p_quantity" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."transfer_order_header"("p_transfer_order" "jsonb") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_transfer_order_id bigint;
begin
  update transfer_orders
  set
    notes = p_transfer_order->>'notes',
    status = (p_transfer_order->>'status')::movement_status,
    updated_at = now()
  where transfer_order_id = (p_transfer_order->>'transfer_order_id')::bigint
  returning transfer_order_id into v_transfer_order_id;

  if v_transfer_order_id is null then
    raise exception 'Transfer order not found: %', p_transfer_order->>'transfer_order_id';
  end if;

  return v_transfer_order_id;
end;
$$;


ALTER FUNCTION "public"."transfer_order_header"("p_transfer_order" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."transfer_order_items"("p_transfer_order_id" bigint, "p_items" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_items jsonb := '[]'::jsonb;
  item jsonb;
  original_item jsonb;
  v_item_id bigint;
begin
  for item in select * from jsonb_array_elements(p_items)
  loop
    original_item := item;  
    v_item_id := nullif(original_item->>'transfer_order_item_id', '')::bigint;

    ---------------------------------------------------------------------
    -- UPDATE del transfer_order_item existente
    ---------------------------------------------------------------------
    update public.transfer_order_items
    set
      quantity = nullif(original_item->>'quantity','')::numeric,
      status = (original_item->>'status')::movement_status,
      is_transferred = coalesce((original_item->>'is_transferred')::boolean, false),
      stock_id = nullif(original_item->>'stock_id','')::bigint,
      updated_at = now()
    where transfer_order_item_id = v_item_id
    returning to_jsonb(public.transfer_order_items.*)
    into item;

    ---------------------------------------------------------------------
    -- 🔥 Restar la cantidad directamente del stock (sin cálculos)
    ---------------------------------------------------------------------
    perform public.stock_from_transfer_item(
      (item->>'stock_id')::bigint,
      (original_item->>'quantity')::numeric
    );
    
       ---------------------------------------------------------------------
    -- 🔥 Restar la cantidad directamente del stock (sin cálculos)
    ---------------------------------------------------------------------
   perform public.stock_to_transfer_item(
   (original_item->>'to_stock_type')::stock_type,
  (original_item->>'to_location_id')::bigint,
  (original_item->>'quantity')::numeric,
  (item->>'product_id')::bigint,
  (item->>'lot_id')::bigint
);

    ---------------------------------------------------------------------
    -- Movimiento de lot containers (si corresponde)
    ---------------------------------------------------------------------
   -- perform public.lot_containers_movements(
   --   v_item_id,
   --   original_item->'lot_containers_movements'
   -- );

    v_items := v_items || jsonb_build_array(item);
  end loop;

  return v_items;
end;
$$;


ALTER FUNCTION "public"."transfer_order_items"("p_transfer_order_id" bigint, "p_items" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."transfer_order_with_items"("p_transfer_order" "jsonb", "p_transfer_order_items" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_transfer_order_id bigint;
  v_items jsonb;
begin
  -- 1️⃣ Update the header
  v_transfer_order_id := public.transfer_order_header(p_transfer_order);

  -- 2️⃣ Update the items
  v_items := public.transfer_order_items(v_transfer_order_id, p_transfer_order_items);

  -- 3️⃣ Final response
  return jsonb_build_object(
    'transfer_order_id', v_transfer_order_id,
    'items', v_items
  );
end;
$$;


ALTER FUNCTION "public"."transfer_order_with_items"("p_transfer_order" "jsonb", "p_transfer_order_items" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."transfer_stock"("p_lot_id" bigint, "p_movement_type" "text", "p_quantity" numeric, "p_from_stock_room_id" bigint DEFAULT NULL::bigint, "p_to_stock_room_id" bigint DEFAULT NULL::bigint, "p_from_store_id" bigint DEFAULT NULL::bigint, "p_to_store_id" bigint DEFAULT NULL::bigint, "p_should_notify_owner" boolean DEFAULT false, "p_lot_containers_to_move" "jsonb" DEFAULT NULL::"jsonb", "p_created_by" "uuid" DEFAULT "auth"."uid"()) RETURNS TABLE("result_stock_movement_id" bigint, "from_stock_id" bigint, "to_stock_id" bigint, "new_from_quantity" numeric, "new_to_quantity" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_from_stock_id bigint;
  v_to_stock_id bigint;
  v_new_from_quantity numeric;
  v_new_to_quantity numeric;
  v_stock_movement_id_out bigint;
  v_before_total numeric;
  v_after_total numeric;
  v_product_id bigint;

  -- lot containers vars
  v_lot_containers_quantity numeric;
  v_lot_containers_auto boolean;
  v_lot_containers_location_id bigint;
  v_from_cont_loc_id bigint;
  v_to_cont_loc_id bigint;
  v_from_cont_qty numeric;
  v_to_cont_qty numeric;
  v_total_before_cont numeric;
  v_total_after_cont numeric;
begin
  ---------------------------------------------------------------------------
  -- 0) Capturar stock total antes (para validación)
  ---------------------------------------------------------------------------
  select coalesce(sum(current_quantity), 0)
  into v_before_total
  from stock
  where lot_id = p_lot_id;

  ---------------------------------------------------------------------------
  -- 1) Restar del stock origen
  ---------------------------------------------------------------------------
  if p_from_stock_room_id is not null or p_from_store_id is not null then
    update stock
    set current_quantity = current_quantity - p_quantity,
        last_updated = now()
    where lot_id = p_lot_id
      and coalesce(stock_room_id, -1) = coalesce(p_from_stock_room_id, -1)
      and coalesce(store_id, -1) = coalesce(p_from_store_id, -1)
    returning stock_id, current_quantity, product_id
    into v_from_stock_id, v_new_from_quantity, v_product_id;

    if not found then
      raise exception 'Stock origen no encontrado para lot_id=% (store_id=% / stock_room_id=%)',
        p_lot_id, p_from_store_id, p_from_stock_room_id;
    end if;
  else
    update stock
    set current_quantity = current_quantity - p_quantity,
        last_updated = now()
    where lot_id = p_lot_id
      and stock_type = 'NOT ASSIGNED'::stock_type
    returning stock_id, current_quantity, product_id
    into v_from_stock_id, v_new_from_quantity, v_product_id;

    if not found then
      raise exception 'Stock NOT ASSIGNED inexistente para lot_id=%', p_lot_id;
    end if;
  end if;

  if v_new_from_quantity < 0 then
    raise exception 'Cantidad insuficiente en stock origen (stock_id=%, disponible<solicitado)', v_from_stock_id;
  end if;

  ---------------------------------------------------------------------------
  -- 2) Sumar al stock destino
  ---------------------------------------------------------------------------
  if p_to_stock_room_id is not null or p_to_store_id is not null then
    update stock
    set current_quantity = current_quantity + p_quantity,
        last_updated = now()
    where lot_id = p_lot_id
      and coalesce(stock_room_id, -1) = coalesce(p_to_stock_room_id, -1)
      and coalesce(store_id, -1) = coalesce(p_to_store_id, -1)
    returning stock_id, current_quantity into v_to_stock_id, v_new_to_quantity;

    if not found then
      insert into stock (
        lot_id, product_id, store_id, stock_room_id,
        current_quantity, stock_type, last_updated
      )
      values (
        p_lot_id, v_product_id, p_to_store_id, p_to_stock_room_id,
        p_quantity,
        case
          when p_to_store_id is not null then 'STORE'::stock_type
          when p_to_stock_room_id is not null then 'STOCKROOM'::stock_type
        end,
        now()
      )
      returning stock_id, current_quantity into v_to_stock_id, v_new_to_quantity;
    end if;
  else
    update stock
    set current_quantity = current_quantity + p_quantity,
        last_updated = now()
    where lot_id = p_lot_id
      and stock_type = 'NOT ASSIGNED'::stock_type
    returning stock_id, current_quantity into v_to_stock_id, v_new_to_quantity;

    if not found then
      insert into stock (
        lot_id, product_id, current_quantity, stock_type, last_updated
      )
      values (p_lot_id, v_product_id, p_quantity, 'NOT ASSIGNED'::stock_type, now())
      returning stock_id, current_quantity into v_to_stock_id, v_new_to_quantity;
    end if;
  end if;

  ---------------------------------------------------------------------------
  -- 3) Registrar movimiento principal
  ---------------------------------------------------------------------------
  insert into stock_movements (
    lot_id, movement_type, quantity,
    from_stock_room_id, to_stock_room_id,
    from_store_id, to_store_id,
    should_notify_owner, created_at, created_by
  )
  values (
    p_lot_id, p_movement_type::movement_type, p_quantity,
    p_from_stock_room_id, p_to_stock_room_id,
    p_from_store_id, p_to_store_id,
    p_should_notify_owner, now(), p_created_by
  )
  returning stock_movement_id into v_stock_movement_id_out;

  ---------------------------------------------------------------------------
  -- 4) Transferencia de lot_containers_location
  ---------------------------------------------------------------------------
  if p_lot_containers_to_move is not null then
    v_lot_containers_quantity := coalesce((p_lot_containers_to_move->>'quantity')::numeric, 0);
    v_lot_containers_auto := coalesce((p_lot_containers_to_move->>'auto')::boolean, false);
    v_lot_containers_location_id := (p_lot_containers_to_move->>'lot_containers_location_id')::bigint;

    if v_lot_containers_quantity > 0 and v_lot_containers_location_id is not null then
      select coalesce(sum(quantity),0)
      into v_total_before_cont
      from lot_containers_location
      where lot_id = p_lot_id;

      update lot_containers_location
      set quantity = quantity - v_lot_containers_quantity,
          updated_at = now()
      where lot_containers_location_id = v_lot_containers_location_id
      returning lot_containers_location_id, quantity
      into v_from_cont_loc_id, v_from_cont_qty;

      if not found then
        raise exception 'lot_containers_location origen no encontrado (id=%)', v_lot_containers_location_id;
      end if;

      if v_from_cont_qty < 0 then
        raise exception 'Cantidad insuficiente de vacíos en lot_containers_location origen id=%', v_from_cont_loc_id;
      end if;

      update lot_containers_location
      set quantity = quantity + v_lot_containers_quantity,
          updated_at = now()
      where lot_id = p_lot_id
        and coalesce(store_id, -1) = coalesce(p_to_store_id, -1)
        and coalesce(stock_room_id, -1) = coalesce(p_to_stock_room_id, -1)
      returning lot_containers_location_id, quantity
      into v_to_cont_loc_id, v_to_cont_qty;

      if not found then
        insert into lot_containers_location (
          lot_id, quantity, store_id, stock_room_id, created_at, updated_at
        )
        values (
          p_lot_id, v_lot_containers_quantity, p_to_store_id, p_to_stock_room_id, now(), now()
        )
        returning lot_containers_location_id, quantity into v_to_cont_loc_id, v_to_cont_qty;
      end if;

      select coalesce(sum(quantity),0)
      into v_total_after_cont
      from lot_containers_location
      where lot_id = p_lot_id;

      if v_total_before_cont <> v_total_after_cont then
        raise exception 'Conservación de vacíos rota en lot_id=%: antes=%, después=%',
          p_lot_id, v_total_before_cont, v_total_after_cont;
      end if;
    end if;
  end if;

  ---------------------------------------------------------------------------
  -- 5) Validar conservación general de stock
  ---------------------------------------------------------------------------
  select coalesce(sum(current_quantity),0)
  into v_after_total
  from stock
  where lot_id = p_lot_id;

  if v_before_total <> v_after_total then
    raise exception 'Conservación rota en lot_id=%: antes=%, después=%',
      p_lot_id, v_before_total, v_after_total;
  end if;

  ---------------------------------------------------------------------------
  -- 6) Retornar resultado
  ---------------------------------------------------------------------------
  return query
  select v_stock_movement_id_out, v_from_stock_id, v_to_stock_id, v_new_from_quantity, v_new_to_quantity;
end;
$$;


ALTER FUNCTION "public"."transfer_stock"("p_lot_id" bigint, "p_movement_type" "text", "p_quantity" numeric, "p_from_stock_room_id" bigint, "p_to_stock_room_id" bigint, "p_from_store_id" bigint, "p_to_store_id" bigint, "p_should_notify_owner" boolean, "p_lot_containers_to_move" "jsonb", "p_created_by" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."transformation_header"("p_transformation_data" "jsonb") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    v_transformation_id bigint;
begin
    -------------------------------------------------------------------
    -- INSERT Siempre: nunca viene transformation_id desde el cliente
    -------------------------------------------------------------------
    insert into transformations (
        transformation_cost,
        notes,
        created_at
    )
    values (
        (p_transformation_data->>'transformation_cost')::numeric,
        p_transformation_data->>'notes',
        coalesce(
            (p_transformation_data->>'created_at')::timestamptz,
            now()
        )
    )
    returning transformation_id
    into v_transformation_id;

    -------------------------------------------------------------------
    -- Devolver ID para las funciones siguientes
    -------------------------------------------------------------------
    return v_transformation_id;
end;
$$;


ALTER FUNCTION "public"."transformation_header"("p_transformation_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."transformation_items"("p_transformation_id" bigint, "p_items" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    rec jsonb;

    v_origin_stock_id bigint;

    v_stock_result jsonb;
    v_final_lot_id bigint;
    v_final_stock_id bigint;

    v_detail_id bigint;
    v_results jsonb := '[]'::jsonb;
begin
    -------------------------------------------------------------------
    -- 1️⃣ Detectar el stock ORIGEN (debe haber uno)
    -------------------------------------------------------------------
    select (item->>'stock_id')::bigint
    into v_origin_stock_id
    from jsonb_array_elements(p_items) item
    where (item->>'is_origin')::boolean = true
    limit 1;

    if v_origin_stock_id is null then
        raise exception 'No origin stock found in transformation items';
    end if;


    -------------------------------------------------------------------
    -- 2️⃣ Procesar cada item
    -------------------------------------------------------------------
    for rec in
        select * from jsonb_array_elements(p_items)
    loop

        -------------------------------------------------------------------
        -- Aplicar stock (origen o destino)
        -------------------------------------------------------------------
        v_stock_result := public.apply_transformation_stock(
            (rec->>'is_origin')::boolean,
            v_origin_stock_id,                      -- 🔥 origen real
            (rec->>'stock_id')::bigint,
            (rec->>'quantity')::numeric,
            (rec->>'location_id')::bigint,
            rec->'lot'
        );


        -------------------------------------------------------------------
        -- Determinar IDs finales
        -------------------------------------------------------------------
        if (rec->>'is_origin')::boolean = true then

            v_final_stock_id := v_origin_stock_id;

            select lot_id
            into v_final_lot_id
            from stock
            where stock_id = v_origin_stock_id;

        else
            v_final_lot_id := (v_stock_result->>'lot_id')::bigint;
            v_final_stock_id := (v_stock_result->>'stock_id')::bigint;
        end if;


        -------------------------------------------------------------------
        -- Guardar transformation_item
        -------------------------------------------------------------------
        insert into transformation_items (
            transformation_id,
            product_id,
            product_presentation_id,
            lot_id,
            stock_id,
            is_origin,
            quantity,
            bulk_quantity_equivalence,
            final_cost_per_unit,
            final_cost_per_bulk,
            final_cost_total
        )
        values (
            p_transformation_id,
            (rec->>'product_id')::bigint,
            (rec->>'product_presentation_id')::bigint,
            v_final_lot_id,
            v_final_stock_id,
            (rec->>'is_origin')::boolean,
            (rec->>'quantity')::numeric,
            (rec->>'bulk_quantity_equivalence')::numeric,
            (rec->>'final_cost_per_unit')::numeric,
            (rec->>'final_cost_per_bulk')::numeric,
            (rec->>'final_cost_total')::numeric
        )
        returning transformation_item_id
        into v_detail_id;


        -------------------------------------------------------------------
        -- Respuesta acumulada
        -------------------------------------------------------------------
        v_results := v_results || jsonb_build_object(
            'transformation_item_id', v_detail_id,
            'product_id', rec->>'product_id',
            'product_presentation_id', rec->>'product_presentation_id',
            'lot_id', v_final_lot_id,
            'stock_id', v_final_stock_id,
            'quantity', rec->>'quantity',
            'is_origin', rec->>'is_origin'
        );

    end loop;

    return v_results;
end;
$$;


ALTER FUNCTION "public"."transformation_items"("p_transformation_id" bigint, "p_items" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_lot_containers_movements"("p_transfer_order_item_id" bigint, "p_movements" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  item jsonb;
  v_result jsonb := '[]'::jsonb;
  v_movement_id bigint;
  v_prev_qty numeric;
begin
 
  -- Iterate through movement entries
  for item in select * from jsonb_array_elements(p_movements)
  loop
    raise notice '➡ Procesando movimiento: %', item;

    v_movement_id := nullif(item->>'lot_container_movement_id', '')::bigint;
    raise notice '   movement_id = %', v_movement_id;


    --------------------------------------------------------------------
    -- INSERT
    --------------------------------------------------------------------
    if (item->>'is_new')::boolean = true then

      raise notice '🟢 INSERT en lot_containers_movements';

      insert into public.lot_containers_movements (
        quantity,
        from_location_id,
        to_location_id,
        from_provider_id,
        to_provider_id,
        from_client_id,
        to_client_id,
        lot_container_id,
        created_at
      )
      values (
        nullif(item->>'quantity','')::numeric,
        nullif(item->>'from_location_id','')::bigint,
        nullif(item->>'to_location_id','')::bigint,
        nullif(item->>'from_provider_id','')::bigint,
        nullif(item->>'to_provider_id','')::bigint,
        nullif(item->>'from_client_id','')::bigint,
        nullif(item->>'to_client_id','')::bigint,
        nullif(item->>'lot_container_id','')::bigint,
        now()
      )
      returning to_jsonb(lot_containers_movements.*)
      into item;

      raise notice '✔ INSERT OK: %', item;

      v_result := v_result || jsonb_build_array(item);

    --------------------------------------------------------------------
    -- UPDATE
    --------------------------------------------------------------------
    else

      raise notice '🟡 UPDATE en lot_containers_movements';

      select quantity
      into v_prev_qty
      from public.lot_containers_movements
      where lot_container_movement_id = v_movement_id;

      update public.lot_containers_movements
      set 
        quantity = nullif(item->>'quantity','')::numeric,
        from_location_id = nullif(item->>'from_location_id','')::bigint,
        to_location_id = nullif(item->>'to_location_id','')::bigint,
        from_provider_id = nullif(item->>'from_provider_id','')::bigint,
        to_provider_id = nullif(item->>'to_provider_id','')::bigint,
        from_client_id = nullif(item->>'from_client_id','')::bigint,
        to_client_id = nullif(item->>'to_client_id','')::bigint,
        lot_container_id = nullif(item->>'lot_container_id','')::bigint,
        created_at = now()
      where lot_container_movement_id = v_movement_id
      returning to_jsonb(lot_containers_movements.*)
      into item;

      raise notice '✔ UPDATE OK: %', item;

      v_result := v_result || jsonb_build_array(item);

    end if;

  end loop;



  return v_result;
end;
$$;


ALTER FUNCTION "public"."update_lot_containers_movements"("p_transfer_order_item_id" bigint, "p_movements" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_lot_sold_out_status"("p_lot_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_total numeric;
begin

  -- Sumar todo el stock del lote
  select coalesce(sum(quantity), 0)
  into v_total
  from stock
  where lot_id = p_lot_id;


  if v_total <= 0 then

    update lots
    set is_sold_out = true,
        updated_at = now()
    where lot_id = p_lot_id;
  else
    RAISE NOTICE 'ℹ️ Lote % todavía tiene stock (%). No se marca sold out.', p_lot_id, v_total;
  end if;
end;
$$;


ALTER FUNCTION "public"."update_lot_sold_out_status"("p_lot_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_prices"("p_prices" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_results jsonb := '[]'::jsonb;
  rec record;
  v_row jsonb;
begin
  -- Iteramos sobre cada elemento del array
  for rec in
    select jsonb_array_elements(p_prices) as elem
  loop
    if (rec.elem->>'price_id') is not null and (rec.elem->>'price_id') <> 'null' then
      ---------------------------------------------------------------------------
      -- Caso 1: UPDATE de un registro existente
      ---------------------------------------------------------------------------
      update prices
      set
        lot_id             = (rec.elem->>'lot_id')::bigint,
        stock_id           = (rec.elem->>'stock_id')::bigint,
        store_id           = (rec.elem->>'store_id')::bigint,
        price_number       = (rec.elem->>'price_number')::int,
        price         = (rec.elem->>'price')::numeric,
        qty_per_price    = (rec.elem->>'qty_per_price')::numeric,
        profit_percentage  = (rec.elem->>'profit_percentage')::numeric,
        price_type         = (rec.elem->>'price_type')::price_type,
        logic_type         = (rec.elem->>'logic_type')::logic_type,
        observations       = nullif(rec.elem->>'observations',''),
        is_limited_offer   = (rec.elem->>'is_limited_offer')::boolean,
        is_active          = (rec.elem->>'is_active')::boolean,
        valid_from         = nullif(rec.elem->>'valid_from','')::timestamptz,
        valid_until        = nullif(rec.elem->>'valid_until','')::timestamptz,
        updated_at         = now()
      where price_id = (rec.elem->>'price_id')::bigint
      returning row_to_json(prices.*)::jsonb
      into v_row;

      v_results := v_results || jsonb_build_array(v_row);

    else
      ---------------------------------------------------------------------------
      -- Caso 2: INSERT de un nuevo registro
      ---------------------------------------------------------------------------
      insert into prices (
        lot_id,
        stock_id,
        store_id,
        price_number,
        price,
        qty_per_price,
        profit_percentage,
        price_type,
        logic_type,
        observations,
        is_limited_offer,
        is_active,
        valid_from,
        valid_until
      )
      values (
        (rec.elem->>'lot_id')::bigint,
        (rec.elem->>'stock_id')::bigint,
        (rec.elem->>'store_id')::bigint,
        (rec.elem->>'price_number')::int,
        (rec.elem->>'price')::numeric,
        (rec.elem->>'qty_per_price')::numeric,
        (rec.elem->>'profit_percentage')::numeric,
        (rec.elem->>'price_type')::price_type,
        (rec.elem->>'logic_type')::logic_type,
        nullif(rec.elem->>'observations',''),
        (rec.elem->>'is_limited_offer')::boolean,
        (rec.elem->>'is_active')::boolean,
        nullif(rec.elem->>'valid_from','')::timestamptz,
        nullif(rec.elem->>'valid_until','')::timestamptz
      )
      returning row_to_json(prices.*)::jsonb
      into v_row;

      v_results := v_results || jsonb_build_array(v_row);
    end if;
  end loop;

  return v_results;
end;
$$;


ALTER FUNCTION "public"."update_prices"("p_prices" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_prices"("p_prices" "jsonb", "p_delete_ids" bigint[]) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_results jsonb := '[]'::jsonb;
  rec record;
  rec_container record; -- 👈 agregado
  v_row jsonb;
begin
  ---------------------------------------------------------------------------
  -- 0) DELETE de precios que vienen en p_delete_ids
  ---------------------------------------------------------------------------
  if p_delete_ids is not null and array_length(p_delete_ids, 1) > 0 then
    delete from prices
    where price_id = any(p_delete_ids);
  end if;

  ---------------------------------------------------------------------------
  -- 1) INSERT o UPDATE de precios que vienen en p_prices
  ---------------------------------------------------------------------------
  for rec in
    select jsonb_array_elements(p_prices) as elem
  loop
    if (rec.elem->>'price_id') is not null and (rec.elem->>'price_id') <> 'null' then
      ---------------------------------------------------------------------------
      -- Caso 1: UPDATE
      ---------------------------------------------------------------------------
      update prices
      set
        location_id              = (rec.elem->>'location_id')::bigint,
        product_presentation_id = (rec.elem->>'product_presentation_id')::bigint,
        price_number          = (rec.elem->>'price_number')::int,
        price                 = (rec.elem->>'price')::numeric,
        qty_per_price         = (rec.elem->>'qty_per_price')::numeric,
        profit_percentage     = (rec.elem->>'profit_percentage')::numeric,
        price_type            = (rec.elem->>'price_type')::price_type,
        logic_type            = (rec.elem->>'logic_type')::logic_type,
        observations          = nullif(rec.elem->>'observations',''),
        is_limited_offer      = (rec.elem->>'is_limited_offer')::boolean,
        is_active             = (rec.elem->>'is_active')::boolean,
        valid_from            = nullif(rec.elem->>'valid_from','')::timestamptz,
        valid_until           = nullif(rec.elem->>'valid_until','')::timestamptz,
        updated_at            = now()
      where price_id = (rec.elem->>'price_id')::bigint
      returning row_to_json(prices.*)::jsonb
      into v_row;

      v_results := v_results || jsonb_build_array(v_row);

    else
      ---------------------------------------------------------------------------
      -- Caso 2: INSERT
      ---------------------------------------------------------------------------
      insert into prices (
        location_id,
        product_presentation_id,
        price_number,
        price,
        qty_per_price,
        profit_percentage,
        price_type,
        logic_type,
        observations,
        is_limited_offer,
        is_active,
        valid_from,
        valid_until
      )
      values (
        (rec.elem->>'location_id')::bigint,
        (rec.elem->>'product_presentation_id')::bigint,
        (rec.elem->>'price_number')::int,
        (rec.elem->>'price')::numeric,
        (rec.elem->>'qty_per_price')::numeric,
        (rec.elem->>'profit_percentage')::numeric,
        (rec.elem->>'price_type')::price_type,
        (rec.elem->>'logic_type')::logic_type,
        nullif(rec.elem->>'observations',''),
        (rec.elem->>'is_limited_offer')::boolean,
        (rec.elem->>'is_active')::boolean,
        nullif(rec.elem->>'valid_from','')::timestamptz,
        nullif(rec.elem->>'valid_until','')::timestamptz
      )
      returning row_to_json(prices.*)::jsonb
      into v_row;

      v_results := v_results || jsonb_build_array(v_row);
    end if;

 

  end loop;

  return v_results;
end;
$$;


ALTER FUNCTION "public"."update_prices"("p_prices" "jsonb", "p_delete_ids" bigint[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_stock_from_transfer_item"("p_stock_id" bigint, "p_new_qty" numeric, "p_prev_qty" numeric DEFAULT 0) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_delta numeric;
begin
  -- If previous qty is null, assume it's a new item
  p_prev_qty := coalesce(p_prev_qty, 0);

  -- Difference between new and old quantity
  v_delta := p_new_qty - p_prev_qty;

  -- Update reserved quantity for transfers
  update public.stock
  set 
    reserved_for_transferring_quantity = coalesce(reserved_for_transferring_quantity, 0) + v_delta,
    updated_at = now()
  where stock_id = p_stock_id;

end;
$$;


ALTER FUNCTION "public"."update_stock_from_transfer_item"("p_stock_id" bigint, "p_new_qty" numeric, "p_prev_qty" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_stock_waste"("p_stock_id" bigint, "p_quantity" numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_current_qty numeric;
begin
  -- Bloqueo del stock
  select quantity
  into v_current_qty
  from stock
  where stock_id = p_stock_id
  for update;

  if not found then
    raise exception 'Stock not found (id=%)', p_stock_id;
  end if;

  if v_current_qty < p_quantity then
    raise exception
      'Insufficiente stock. Actual: %, Requerido para merma: %',
      v_current_qty,
      p_quantity;
  end if;

  update stock
  set
    quantity = quantity - p_quantity,
    updated_at = now()
  where stock_id = p_stock_id;
end;
$$;


ALTER FUNCTION "public"."update_stock_waste"("p_stock_id" bigint, "p_quantity" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_transfer_order_header"("p_transfer_order" "jsonb") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_transfer_order_id bigint;
begin
  update transfer_orders
  set
    assigned_user_id = nullif(p_transfer_order->>'assigned_user_id','')::uuid,
    from_location_id = nullif(p_transfer_order->>'from_location_id','')::bigint,
    to_location_id = nullif(p_transfer_order->>'to_location_id','')::bigint,
    notes = p_transfer_order->>'notes',
    status = (p_transfer_order->>'status')::movement_status,
    updated_at = now()
  where transfer_order_id = (p_transfer_order->>'transfer_order_id')::bigint
  returning transfer_order_id into v_transfer_order_id;

  if v_transfer_order_id is null then
    raise exception 'Transfer order not found: %', p_transfer_order->>'transfer_order_id';
  end if;

  return v_transfer_order_id;
end;
$$;


ALTER FUNCTION "public"."update_transfer_order_header"("p_transfer_order" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_transfer_order_items"("p_transfer_order_id" bigint, "p_items" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_items jsonb := '[]'::jsonb;
  item jsonb;
  original_item jsonb;
  v_item_id bigint;
  v_prev_qty numeric;
    v_prev_stock_id bigint;
begin
  for item in select * from jsonb_array_elements(p_items)
  loop
    original_item := item;  
    v_item_id := nullif(original_item->>'transfer_order_item_id', '')::bigint;

   -------------------------------------------------------------------
    -- DELETE
    -------------------------------------------------------------------
    if coalesce((original_item->>'is_deleted')::boolean, false) = true then

      select quantity, stock_id
      into v_prev_qty, v_prev_stock_id
      from public.transfer_order_items
      where transfer_order_item_id = v_item_id;

      perform public.update_stock_from_transfer_item(
        v_prev_stock_id,
        0,
        v_prev_qty
      );

      perform public.update_lot_containers_movements(
        v_item_id,
        '[]'::jsonb
      );

      delete from public.transfer_order_items
      where transfer_order_item_id = v_item_id;

      continue;
    end if;

    -------------------------------------------------------------------
    -- INSERT
    -------------------------------------------------------------------
    if (original_item->>'is_new')::boolean = true then

      insert into public.transfer_order_items (
        transfer_order_id,
        product_id,
        product_presentation_id,
        lot_id,
        quantity,
        status,
        is_transferred,
        stock_id,
        created_at,
        updated_at
      )
      values (
        p_transfer_order_id,
        nullif(original_item->>'product_id','')::bigint,
        nullif(original_item->>'product_presentation_id','')::bigint,
        nullif(original_item->>'lot_id','')::bigint,
        nullif(original_item->>'quantity','')::numeric,
        (original_item->>'status')::movement_status,
        coalesce((original_item->>'is_transferred')::boolean, false),
        nullif(original_item->>'stock_id','')::bigint,
        now(),
        now()
      )
      returning to_jsonb(public.transfer_order_items.*)
      into item;

      perform public.update_stock_from_transfer_item(
        (item->>'stock_id')::bigint,
        (original_item->>'quantity')::numeric,
        0
      );

      perform public.update_lot_containers_movements(
        (item->>'transfer_order_item_id')::bigint,
        original_item->'lot_containers_movements'
      );

    -------------------------------------------------------------------
    -- UPDATE
    -------------------------------------------------------------------
    else
      select quantity
      into v_prev_qty
      from public.transfer_order_items
      where transfer_order_item_id = v_item_id;

      update public.transfer_order_items
      set
        product_id = nullif(original_item->>'product_id','')::bigint,
        product_presentation_id = nullif(original_item->>'product_presentation_id','')::bigint,
        lot_id = nullif(original_item->>'lot_id','')::bigint,
        quantity = nullif(original_item->>'quantity','')::numeric,
        status = (original_item->>'status')::movement_status,
        is_transferred = coalesce((original_item->>'is_transferred')::boolean, false),
        stock_id = nullif(original_item->>'stock_id','')::bigint,
        updated_at = now()
      where transfer_order_item_id = v_item_id
      returning to_jsonb(public.transfer_order_items.*)
      into item;

      perform public.update_stock_from_transfer_item(
        (item->>'stock_id')::bigint,
        (original_item->>'quantity')::numeric,
        v_prev_qty
      );

      perform public.update_lot_containers_movements(
        v_item_id,
        original_item->'lot_containers_movements'
      );

    end if;

    v_items := v_items || jsonb_build_array(item);
  end loop;

  return v_items;
end;
$$;


ALTER FUNCTION "public"."update_transfer_order_items"("p_transfer_order_id" bigint, "p_items" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_transfer_order_with_items"("p_transfer_order" "jsonb", "p_transfer_order_items" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_transfer_order_id bigint;
  v_items jsonb;
begin
  -- 1️⃣ Update the header
  v_transfer_order_id := public.update_transfer_order_header(p_transfer_order);

  -- 2️⃣ Update the items
  v_items := public.update_transfer_order_items(v_transfer_order_id, p_transfer_order_items);

  -- 3️⃣ Final response
  return jsonb_build_object(
    'transfer_order_id', v_transfer_order_id,
    'items', v_items
  );
end;
$$;


ALTER FUNCTION "public"."update_transfer_order_with_items"("p_transfer_order" "jsonb", "p_transfer_order_items" "jsonb") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."brands" (
    "brand_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "brand_name" "text" NOT NULL,
    "deleted_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "organization_id" "uuid"
);


ALTER TABLE "public"."brands" OWNER TO "postgres";


ALTER TABLE "public"."brands" ALTER COLUMN "brand_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."brands_brand_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."categories" (
    "category_name" character varying(255) NOT NULL,
    "slug" character varying(255),
    "description" "text",
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "category_id" bigint NOT NULL,
    "organization_id" "uuid" NOT NULL
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


ALTER TABLE "public"."categories" ALTER COLUMN "category_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."categories_category_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."client_transactions" (
    "transaction_id" bigint NOT NULL,
    "client_id" bigint NOT NULL,
    "order_id" bigint,
    "transaction_type" "public"."transaction_type" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "description" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "transaction_date" timestamp with time zone,
    "payment_method" "public"."payment_method",
    "payment_status" "public"."payment_status",
    "balance_after_transaction" numeric,
    CONSTRAINT "client_transactions_transaction_type_check" CHECK ((("transaction_type")::"text" = ANY (ARRAY[('INVOICE'::character varying)::"text", ('PAYMENT'::character varying)::"text", ('CREDIT_NOTE'::character varying)::"text", ('DEBIT_NOTE'::character varying)::"text", ('ADJUSTMENT'::character varying)::"text"])))
);


ALTER TABLE "public"."client_transactions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."client_transactions_transaction_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."client_transactions_transaction_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."client_transactions_transaction_id_seq" OWNED BY "public"."client_transactions"."transaction_id";



CREATE TABLE IF NOT EXISTS "public"."clients" (
    "client_id" bigint NOT NULL,
    "full_name" character varying(150) NOT NULL,
    "email" character varying(150),
    "phone" character varying(50),
    "document_number" character varying(50),
    "address" "text",
    "city" character varying(100),
    "province" character varying(100),
    "postal_code" character varying(20),
    "country" character varying(100) DEFAULT 'Argentina'::character varying,
    "has_credit" boolean DEFAULT false,
    "credit_limit" numeric(12,2) DEFAULT 0,
    "current_balance" numeric(12,2) DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    "last_transaction_date" timestamp with time zone,
    "tax_condition" "public"."tax_condition_type" DEFAULT 'FINAL_CONSUMER'::"public"."tax_condition_type" NOT NULL,
    "billing_enabled" boolean DEFAULT true NOT NULL,
    "available_credit" numeric(15,2) DEFAULT 0 NOT NULL,
    "tax_ident" "text",
    "short_code" smallint,
    "organization_id" "uuid"
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."clients_client_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."clients_client_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."clients_client_id_seq" OWNED BY "public"."clients"."client_id";



CREATE TABLE IF NOT EXISTS "public"."iva" (
    "iva_id" bigint NOT NULL,
    "iva_number" smallint NOT NULL,
    "iva_percentege" smallint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "organization_id" "uuid"
);


ALTER TABLE "public"."iva" OWNER TO "postgres";


ALTER TABLE "public"."iva" ALTER COLUMN "iva_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."iva_iva_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."load_orders" (
    "load_order_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "business_owner_id" "uuid",
    "recieved_by" "uuid",
    "recieved_by_other" "text",
    "invoice_number" bigint,
    "load_order_number" bigint,
    "provider_id" bigint,
    "delivery_date" timestamp with time zone,
    "receptor_id" "uuid",
    "receptor_other" "text",
    "transporter_data" "jsonb",
    "status" "text",
    "observations" "text",
    "total_download_cost" numeric,
    "updated_at" timestamp with time zone,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."load_orders" OWNER TO "postgres";


ALTER TABLE "public"."load_orders" ALTER COLUMN "load_order_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."loading_orders_loading_order_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."locations" (
    "location_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "type" "text" NOT NULL,
    "address" "text",
    "name" "text",
    "deleted_at" timestamp with time zone,
    "organization_id" "uuid"
);


ALTER TABLE "public"."locations" OWNER TO "postgres";


COMMENT ON TABLE "public"."locations" IS 'locations can be stores or sotockrooms';



ALTER TABLE "public"."locations" ALTER COLUMN "location_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."locations_location_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."lot_containers" (
    "lot_container_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "lot_container_name" "text",
    "deleted_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "lot_container_price" bigint,
    "organization_id" "uuid"
);


ALTER TABLE "public"."lot_containers" OWNER TO "postgres";


ALTER TABLE "public"."lot_containers" ALTER COLUMN "lot_container_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."lot_container_lot_container_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."lot_containers_movements" (
    "lot_container_movement_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "quantity" bigint,
    "from_location_id" bigint,
    "to_location_id" bigint,
    "from_provider_id" bigint,
    "to_provider_id" bigint,
    "from_client_id" bigint,
    "to_client_id" bigint,
    "lot_container_id" bigint,
    "status" "public"."movement_status"
);


ALTER TABLE "public"."lot_containers_movements" OWNER TO "postgres";


ALTER TABLE "public"."lot_containers_movements" ALTER COLUMN "lot_container_movement_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."lot_container_movement_lot_container_movement_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."lot_containers_stock" (
    "lot_containers_stock_id" bigint NOT NULL,
    "lot_container_id" bigint,
    "quantity" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "client_id" bigint,
    "provider_id" bigint,
    "updated_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "stock_id" bigint,
    "location_id" bigint,
    "organization_id" "uuid"
);


ALTER TABLE "public"."lot_containers_stock" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lot_traces" (
    "lot_trace_id" bigint NOT NULL,
    "lot_from_id" bigint NOT NULL,
    "lot_to_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."lot_traces" OWNER TO "postgres";


ALTER TABLE "public"."lot_traces" ALTER COLUMN "lot_trace_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."lot_traces_lot_trace_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."lots" (
    "lot_id" smallint NOT NULL,
    "provider_id" bigint,
    "expiration_date" "date",
    "expiration_date_notification" boolean DEFAULT false,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "initial_stock_quantity" numeric,
    "is_sold_out" boolean,
    "is_expired" boolean,
    "load_order_id" bigint,
    "product_id" bigint,
    "purchase_cost_total" numeric,
    "purchase_cost_per_unit" numeric,
    "download_total_cost" numeric,
    "download_cost_per_unit" numeric,
    "final_cost_total" numeric,
    "final_cost_per_unit" numeric,
    "purchase_cost_per_bulk" numeric,
    "download_cost_per_bulk" numeric,
    "final_cost_per_bulk" numeric,
    "bulk_quantity_equivalence" numeric,
    "delivery_cost_total" numeric,
    "delivery_cost_per_unit" numeric,
    "delivery_cost_per_bulk" numeric,
    "productor_commission_type" "public"."commission_type" DEFAULT 'NONE'::"public"."commission_type" NOT NULL,
    "productor_commission_percentage" numeric,
    "productor_commission_unit_value" numeric,
    "purchasing_agent_id" integer,
    "purchasing_agent_commision_type" "public"."commission_type" DEFAULT 'NONE'::"public"."commission_type" NOT NULL,
    "purchasing_agent_commision_percentage" numeric,
    "purchasing_agent_commision_unit_value" numeric,
    "product_presentation_id" bigint,
    "extra_cost_total" numeric,
    "is_finished" boolean
);


ALTER TABLE "public"."lots" OWNER TO "postgres";


ALTER TABLE "public"."lot_containers_stock" ALTER COLUMN "lot_containers_stock_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."lots_lot_containers_lots_lot_containers_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "notification_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text",
    "title" "text",
    "message" "text",
    "order_id" bigint,
    "updated_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "canceled_by" "uuid",
    "location_id" bigint,
    "organization_id" "uuid"
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


ALTER TABLE "public"."notifications" ALTER COLUMN "notification_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."notifications_notification_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "order_item_id" bigint NOT NULL,
    "order_id" bigint NOT NULL,
    "product_id" bigint NOT NULL,
    "quantity" numeric(12,3) NOT NULL,
    "price" numeric(12,2) NOT NULL,
    "total" numeric(12,2) NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "subtotal" bigint,
    "discount" bigint,
    "tax" bigint,
    "is_deleted" boolean,
    "logic_type" "public"."logic_type",
    "price_type" "public"."price_type",
    "product_presentation_id" bigint,
    "stock_id" bigint,
    "status" "public"."movement_status",
    "location_id" bigint,
    "lot_id" smallint,
    "over_sell_quantity" numeric,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."order_items_order_item_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."order_items_order_item_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."order_items_order_item_id_seq" OWNED BY "public"."order_items"."order_item_id";



CREATE TABLE IF NOT EXISTS "public"."payments" (
    "payment_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "order_id" bigint,
    "amount" bigint,
    "payment_method" "public"."payment_method",
    "payment_type" "public"."payment_type",
    "payment_direction" "public"."payment_direction",
    "client_id" bigint,
    "provider_id" bigint,
    "terminal_session_id" bigint
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


ALTER TABLE "public"."payments" ALTER COLUMN "payment_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."order_payments_order_payment_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE SEQUENCE IF NOT EXISTS "public"."orders_order_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."orders_order_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."orders_order_id_seq" OWNED BY "public"."orders"."order_id";



CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "organization_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "organization_name" "text",
    "max_terminals" numeric DEFAULT '1'::numeric
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_presentations" (
    "product_presentation_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "product_presentation_name" "text",
    "short_code" bigint,
    "product_id" bigint,
    "deleted_at" timestamp with time zone,
    "bulk_quantity_equivalence" numeric,
    "updated_at" timestamp with time zone,
    "sell_type" "public"."sell_type",
    "organization_id" "uuid"
);


ALTER TABLE "public"."product_presentations" OWNER TO "postgres";


ALTER TABLE "public"."product_presentations" ALTER COLUMN "product_presentation_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."presentations_presentation_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."prices" (
    "price_number" bigint,
    "is_active" boolean DEFAULT true,
    "valid_from" timestamp with time zone DEFAULT "now"(),
    "valid_until" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "price_id" bigint NOT NULL,
    "is_limited_offer" boolean,
    "price" numeric,
    "price_type" "public"."price_type",
    "logic_type" "public"."logic_type",
    "qty_per_price" numeric,
    "profit_percentage" numeric,
    "observations" "text",
    "product_presentation_id" bigint,
    "location_id" bigint
);


ALTER TABLE "public"."prices" OWNER TO "postgres";


ALTER TABLE "public"."lots" ALTER COLUMN "lot_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."product_lots_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."prices" ALTER COLUMN "price_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."product_prices_product_price_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."products" (
    "product_name" "text" NOT NULL,
    "tags" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "barcode" bigint,
    "short_code" bigint,
    "product_id" bigint NOT NULL,
    "category_id" bigint,
    "sub_category_id" bigint,
    "provider_id" bigint,
    "allow_stock_control" boolean,
    "brand_id" bigint,
    "public_image_id" bigint,
    "product_description" "text",
    "observations" "text",
    "parent_product_id" bigint,
    "lot_control" boolean,
    "iva_id" bigint,
    "organization_id" "uuid"
);


ALTER TABLE "public"."products" OWNER TO "postgres";


COMMENT ON COLUMN "public"."products"."barcode" IS 'barcode';



ALTER TABLE "public"."products" ALTER COLUMN "product_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."products_product_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."providers" (
    "provider_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_At" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "provider_name" "text",
    "short_code" bigint,
    "organization_id" "uuid"
);


ALTER TABLE "public"."providers" OWNER TO "postgres";


ALTER TABLE "public"."providers" ALTER COLUMN "provider_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."providers_provider_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."public_images" (
    "public_image_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "public_image_src" "text" NOT NULL,
    "public_image_category" "text" NOT NULL,
    "public_image_name" "text" NOT NULL
);


ALTER TABLE "public"."public_images" OWNER TO "postgres";


ALTER TABLE "public"."public_images" ALTER COLUMN "public_image_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."public_images_public_image_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."purchasing_agents" (
    "purchasing_agent_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "purchasing_agent_name" "text",
    "business_owner_id" "uuid"
);


ALTER TABLE "public"."purchasing_agents" OWNER TO "postgres";


ALTER TABLE "public"."purchasing_agents" ALTER COLUMN "purchasing_agent_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."purchasing_agent_purchasing_agent_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."stock" (
    "stock_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "lot_id" bigint NOT NULL,
    "quantity" numeric(18,3) DEFAULT 0 NOT NULL,
    "min_notification" numeric(18,3) DEFAULT 0,
    "max_notification" numeric(18,3) DEFAULT 0,
    "transformed_from_product_id" bigint,
    "transformed_to_product_id" bigint,
    "stock_type" "public"."stock_type",
    "product_id" bigint,
    "reserved_for_transferring_quantity" numeric,
    "reserved_for_selling_quantity" numeric,
    "location_id" bigint,
    "is_closed" boolean DEFAULT false,
    "over_sell_quantity" numeric
);


ALTER TABLE "public"."stock" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stock_movements" (
    "stock_movement_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "lot_id" bigint,
    "movement_type" "public"."movement_type",
    "quantity" numeric,
    "to_location_id" bigint,
    "should_notify_owner" boolean,
    "from_location_id" bigint,
    "price" numeric,
    "business_owner_id" "uuid",
    "created_by" "uuid",
    "stock_id" bigint
);


ALTER TABLE "public"."stock_movements" OWNER TO "postgres";


ALTER TABLE "public"."stock_movements" ALTER COLUMN "stock_movement_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."stock_movements_stock_movement_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."stock" ALTER COLUMN "stock_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."stock_stock_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."store_order_sequences" (
    "store_order_sequence_id" bigint NOT NULL,
    "location_id" bigint,
    "last_number" bigint
);


ALTER TABLE "public"."store_order_sequences" OWNER TO "postgres";


ALTER TABLE "public"."store_order_sequences" ALTER COLUMN "store_order_sequence_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."store_order_sequences_store_order_sequence_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."sub_categories" (
    "sub_category_name" character varying(255) NOT NULL,
    "slug" character varying(255),
    "description" "text",
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "sub_category_id" bigint NOT NULL,
    "business_owner_id" "uuid" NOT NULL
);


ALTER TABLE "public"."sub_categories" OWNER TO "postgres";


COMMENT ON TABLE "public"."sub_categories" IS 'This is a duplicate of categories';



ALTER TABLE "public"."sub_categories" ALTER COLUMN "sub_category_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."sub_categories_category_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."terminal_sessions" (
    "terminal_session_id" bigint NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "terminal_id" bigint NOT NULL,
    "opened_by_user_id" "uuid" NOT NULL,
    "opened_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "closed_at" timestamp with time zone,
    "opening_balance" numeric DEFAULT 0 NOT NULL,
    "closing_balance" numeric,
    "status" "text" DEFAULT 'OPEN'::"text" NOT NULL,
    "location_id" bigint
);


ALTER TABLE "public"."terminal_sessions" OWNER TO "postgres";


ALTER TABLE "public"."terminal_sessions" ALTER COLUMN "terminal_session_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."terminal_sessions_terminal_session_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."terminals" (
    "terminal_id" bigint NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."terminals" OWNER TO "postgres";


ALTER TABLE "public"."terminals" ALTER COLUMN "terminal_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."terminals_terminal_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."transfer_order_items" (
    "transfer_order_item_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "transfer_order_id" bigint,
    "product_id" bigint,
    "quantity" numeric,
    "product_presentation_id" bigint,
    "status" "public"."movement_status",
    "stock_id" bigint,
    "lot_containers_movement_id" bigint,
    "updated_at" timestamp with time zone,
    "lot_id" smallint,
    "is_transferred" boolean
);


ALTER TABLE "public"."transfer_order_items" OWNER TO "postgres";


ALTER TABLE "public"."transfer_order_items" ALTER COLUMN "transfer_order_item_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."transfer_order_items_transfer_order_item_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."transfer_orders" (
    "transfer_order_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "assigned_user_id" "uuid",
    "notes" "text",
    "status" "public"."movement_status" DEFAULT 'PENDING'::"public"."movement_status" NOT NULL,
    "from_location_id" bigint,
    "to_location_id" bigint,
    "deleted_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "organization_id" "uuid"
);


ALTER TABLE "public"."transfer_orders" OWNER TO "postgres";


ALTER TABLE "public"."transfer_orders" ALTER COLUMN "transfer_order_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."transfer_orders_transfer_order_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."transformation_items" (
    "transformation_item_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "product_id" bigint,
    "product_presentation_id" bigint,
    "lot_id" bigint,
    "stock_id" bigint,
    "is_origin" boolean DEFAULT false NOT NULL,
    "quantity" numeric,
    "max_quantity" numeric,
    "bulk_quantity_equivalence" numeric,
    "final_cost_per_unit" numeric,
    "final_cost_per_bulk" numeric,
    "final_cost_total" numeric,
    "location_id" bigint,
    "transformation_id" bigint
);


ALTER TABLE "public"."transformation_items" OWNER TO "postgres";


ALTER TABLE "public"."transformation_items" ALTER COLUMN "transformation_item_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."transformation_items_transformation_item_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."transformations" (
    "transformation_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "transformation_cost" numeric,
    "notes" "text"
);


ALTER TABLE "public"."transformations" OWNER TO "postgres";


ALTER TABLE "public"."transformations" ALTER COLUMN "transformation_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."trasnformations_transformation_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" character varying(255) NOT NULL,
    "full_name" character varying(255),
    "phone" character varying(20),
    "address" "jsonb",
    "role" "public"."user_role_enum" DEFAULT 'OWNER'::"public"."user_role_enum" NOT NULL,
    "is_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "business_owner_id" "uuid",
    "is_active" boolean DEFAULT true NOT NULL,
    "short_code" smallint,
    "organization_id" "uuid"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON COLUMN "public"."users"."business_owner_id" IS 'User''s direct manager in the hierarchy';



CREATE TABLE IF NOT EXISTS "public"."website_preferences" (
    "id" "uuid" NOT NULL,
    "theme" character varying(50) DEFAULT 'default'::character varying,
    "primary_color" character varying(7) DEFAULT '#6b99fe'::character varying,
    "secondary_color" character varying(7) DEFAULT '#f4b700'::character varying,
    "logo_url" "text",
    "favicon_url" "text",
    "homepage_layout" "jsonb",
    "custom_css" "text",
    "language" character varying(10) DEFAULT 'es'::character varying,
    "currency" character varying(3) DEFAULT 'USD'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."website_preferences" OWNER TO "postgres";


ALTER TABLE ONLY "public"."client_transactions" ALTER COLUMN "transaction_id" SET DEFAULT "nextval"('"public"."client_transactions_transaction_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."clients" ALTER COLUMN "client_id" SET DEFAULT "nextval"('"public"."clients_client_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."order_items" ALTER COLUMN "order_item_id" SET DEFAULT "nextval"('"public"."order_items_order_item_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."orders" ALTER COLUMN "order_id" SET DEFAULT "nextval"('"public"."orders_order_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_pkey" PRIMARY KEY ("brand_id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_category_id_key" UNIQUE ("category_id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("category_id");



ALTER TABLE ONLY "public"."client_transactions"
    ADD CONSTRAINT "client_transactions_pkey" PRIMARY KEY ("transaction_id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("client_id");



ALTER TABLE ONLY "public"."iva"
    ADD CONSTRAINT "iva_pkey" PRIMARY KEY ("iva_id");



ALTER TABLE ONLY "public"."load_orders"
    ADD CONSTRAINT "load_orders_pkey" PRIMARY KEY ("load_order_id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_pkey" PRIMARY KEY ("location_id");



ALTER TABLE ONLY "public"."lot_containers_movements"
    ADD CONSTRAINT "lot_container_movement_pkey" PRIMARY KEY ("lot_container_movement_id");



ALTER TABLE ONLY "public"."lot_containers"
    ADD CONSTRAINT "lot_container_pkey" PRIMARY KEY ("lot_container_id");



ALTER TABLE ONLY "public"."lot_traces"
    ADD CONSTRAINT "lot_traces_pkey" PRIMARY KEY ("lot_trace_id");



ALTER TABLE ONLY "public"."lot_containers_stock"
    ADD CONSTRAINT "lots_lot_containers_pkey" PRIMARY KEY ("lot_containers_stock_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("order_item_id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("order_id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("organization_id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("payment_id");



ALTER TABLE ONLY "public"."product_presentations"
    ADD CONSTRAINT "presentations_pkey" PRIMARY KEY ("product_presentation_id");



ALTER TABLE ONLY "public"."lots"
    ADD CONSTRAINT "product_lots_pkey" PRIMARY KEY ("lot_id");



ALTER TABLE ONLY "public"."prices"
    ADD CONSTRAINT "product_prices_pkey" PRIMARY KEY ("price_id");



ALTER TABLE ONLY "public"."prices"
    ADD CONSTRAINT "product_prices_product_price_id_key" UNIQUE ("price_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("product_id");



ALTER TABLE ONLY "public"."providers"
    ADD CONSTRAINT "providers_pkey" PRIMARY KEY ("provider_id");



ALTER TABLE ONLY "public"."public_images"
    ADD CONSTRAINT "public_images_pkey" PRIMARY KEY ("public_image_id");



ALTER TABLE ONLY "public"."purchasing_agents"
    ADD CONSTRAINT "purchasing_agent_pkey" PRIMARY KEY ("purchasing_agent_id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("stock_movement_id");



ALTER TABLE ONLY "public"."stock"
    ADD CONSTRAINT "stock_pkey" PRIMARY KEY ("stock_id");



ALTER TABLE ONLY "public"."store_order_sequences"
    ADD CONSTRAINT "store_order_sequences_pkey" PRIMARY KEY ("store_order_sequence_id");



ALTER TABLE ONLY "public"."store_order_sequences"
    ADD CONSTRAINT "store_order_sequences_store_id_key" UNIQUE ("location_id");



ALTER TABLE ONLY "public"."sub_categories"
    ADD CONSTRAINT "sub_categories_category_id_key" UNIQUE ("sub_category_id");



ALTER TABLE ONLY "public"."sub_categories"
    ADD CONSTRAINT "sub_categories_pkey" PRIMARY KEY ("sub_category_id");



ALTER TABLE ONLY "public"."terminal_sessions"
    ADD CONSTRAINT "terminal_sessions_pkey" PRIMARY KEY ("terminal_session_id");



ALTER TABLE ONLY "public"."terminals"
    ADD CONSTRAINT "terminals_pkey" PRIMARY KEY ("terminal_id");



ALTER TABLE ONLY "public"."transfer_order_items"
    ADD CONSTRAINT "transfer_order_items_pkey" PRIMARY KEY ("transfer_order_item_id");



ALTER TABLE ONLY "public"."transfer_orders"
    ADD CONSTRAINT "transfer_orders_pkey" PRIMARY KEY ("transfer_order_id");



ALTER TABLE ONLY "public"."transformation_items"
    ADD CONSTRAINT "transformation_items_pkey" PRIMARY KEY ("transformation_item_id");



ALTER TABLE ONLY "public"."transformations"
    ADD CONSTRAINT "trasnformations_pkey" PRIMARY KEY ("transformation_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."website_preferences"
    ADD CONSTRAINT "website_preferences_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_clients_organization_id" ON "public"."clients" USING "btree" ("organization_id");



CREATE INDEX "idx_foi_created_at" ON "public"."transfer_order_items" USING "btree" ("created_at");



CREATE INDEX "idx_foi_product_id" ON "public"."transfer_order_items" USING "btree" ("product_id");



CREATE INDEX "idx_foi_transfer_order_id" ON "public"."transfer_order_items" USING "btree" ("transfer_order_id");



CREATE INDEX "idx_iva_organization_id" ON "public"."iva" USING "btree" ("organization_id");



CREATE INDEX "idx_locations_organization_id" ON "public"."locations" USING "btree" ("organization_id");



CREATE INDEX "idx_lot_containers_org" ON "public"."lot_containers" USING "btree" ("organization_id");



CREATE INDEX "idx_lot_containers_stock_org" ON "public"."lot_containers_stock" USING "btree" ("organization_id");



CREATE INDEX "idx_notifications_org" ON "public"."notifications" USING "btree" ("organization_id");



CREATE INDEX "idx_orders_org" ON "public"."orders" USING "btree" ("organization_id");



CREATE INDEX "idx_product_presentations_org" ON "public"."product_presentations" USING "btree" ("organization_id");



CREATE INDEX "idx_providers_org" ON "public"."providers" USING "btree" ("organization_id");



CREATE INDEX "idx_transfer_orders_org" ON "public"."transfer_orders" USING "btree" ("organization_id");



CREATE INDEX "idx_user_profiles_type" ON "public"."users" USING "btree" ("role");



CREATE UNIQUE INDEX "one_open_session_per_terminal" ON "public"."terminal_sessions" USING "btree" ("terminal_id") WHERE ("status" = 'OPEN'::"text");



CREATE UNIQUE INDEX "stock_unique" ON "public"."stock" USING "btree" ("lot_id", "product_id", "location_id");



CREATE UNIQUE INDEX "unique_presentation_per_owner_and_product" ON "public"."product_presentations" USING "btree" ("organization_id", "product_id", "product_presentation_name") WHERE ("deleted_at" IS NULL);



CREATE UNIQUE INDEX "unique_shortcode_per_owner" ON "public"."product_presentations" USING "btree" ("organization_id", "product_id", "short_code") WHERE ("deleted_at" IS NULL);



CREATE UNIQUE INDEX "unique_terminal_name_per_org" ON "public"."terminals" USING "btree" ("organization_id", "name");



CREATE OR REPLACE TRIGGER "set_public_orders_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."client_transactions"
    ADD CONSTRAINT "client_transactions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("client_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_transactions"
    ADD CONSTRAINT "client_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("order_id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."transfer_order_items"
    ADD CONSTRAINT "foi_product_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transfer_order_items"
    ADD CONSTRAINT "foi_transfer_order_fk" FOREIGN KEY ("transfer_order_id") REFERENCES "public"."transfer_orders"("transfer_order_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."iva"
    ADD CONSTRAINT "iva_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."load_orders"
    ADD CONSTRAINT "load_orders_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("provider_id");



ALTER TABLE ONLY "public"."load_orders"
    ADD CONSTRAINT "load_orders_receptor_id_fkey" FOREIGN KEY ("receptor_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."load_orders"
    ADD CONSTRAINT "load_orders_recieved_by_fkey" FOREIGN KEY ("recieved_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."load_orders"
    ADD CONSTRAINT "loading_orders_business_owner_id_fkey" FOREIGN KEY ("business_owner_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."lot_containers_movements"
    ADD CONSTRAINT "lot_container_movement_from_client_id_fkey" FOREIGN KEY ("from_client_id") REFERENCES "public"."clients"("client_id");



ALTER TABLE ONLY "public"."lot_containers_movements"
    ADD CONSTRAINT "lot_container_movement_from_provider_id_fkey" FOREIGN KEY ("from_provider_id") REFERENCES "public"."providers"("provider_id");



ALTER TABLE ONLY "public"."lot_containers_movements"
    ADD CONSTRAINT "lot_container_movement_to_client_id_fkey" FOREIGN KEY ("to_client_id") REFERENCES "public"."clients"("client_id");



ALTER TABLE ONLY "public"."lot_containers_movements"
    ADD CONSTRAINT "lot_container_movement_to_provider_id_fkey" FOREIGN KEY ("to_provider_id") REFERENCES "public"."providers"("provider_id");



ALTER TABLE ONLY "public"."lot_containers_movements"
    ADD CONSTRAINT "lot_container_movements_lot_container_id_fkey" FOREIGN KEY ("lot_container_id") REFERENCES "public"."lot_containers"("lot_container_id");



ALTER TABLE ONLY "public"."lot_containers_stock"
    ADD CONSTRAINT "lot_containers_location_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("client_id");



ALTER TABLE ONLY "public"."lot_containers_stock"
    ADD CONSTRAINT "lot_containers_location_lot_container_id_fkey" FOREIGN KEY ("lot_container_id") REFERENCES "public"."lot_containers"("lot_container_id");



ALTER TABLE ONLY "public"."lot_containers_stock"
    ADD CONSTRAINT "lot_containers_location_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("provider_id");



ALTER TABLE ONLY "public"."lot_containers_stock"
    ADD CONSTRAINT "lot_containers_location_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "public"."stock"("stock_id");



ALTER TABLE ONLY "public"."lot_containers_movements"
    ADD CONSTRAINT "lot_containers_movements_from_location_id_fkey" FOREIGN KEY ("from_location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."lot_containers_movements"
    ADD CONSTRAINT "lot_containers_movements_to_location_id_fkey" FOREIGN KEY ("to_location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."lot_containers"
    ADD CONSTRAINT "lot_containers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."lot_containers_stock"
    ADD CONSTRAINT "lot_containers_stock_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."lot_containers_stock"
    ADD CONSTRAINT "lot_containers_stock_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."lot_traces"
    ADD CONSTRAINT "lot_traces_lot_from_fk" FOREIGN KEY ("lot_from_id") REFERENCES "public"."lots"("lot_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."lot_traces"
    ADD CONSTRAINT "lot_traces_lot_to_fk" FOREIGN KEY ("lot_to_id") REFERENCES "public"."lots"("lot_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."lots"
    ADD CONSTRAINT "lots_load_order_id_fkey" FOREIGN KEY ("load_order_id") REFERENCES "public"."load_orders"("load_order_id");



ALTER TABLE ONLY "public"."lots"
    ADD CONSTRAINT "lots_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id");



ALTER TABLE ONLY "public"."lots"
    ADD CONSTRAINT "lots_product_presentation_id_fkey" FOREIGN KEY ("product_presentation_id") REFERENCES "public"."product_presentations"("product_presentation_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_canceled_by_fkey" FOREIGN KEY ("canceled_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("order_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("lot_id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("order_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_product_presentation_id_fkey" FOREIGN KEY ("product_presentation_id") REFERENCES "public"."product_presentations"("product_presentation_id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "public"."stock"("stock_id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "order_payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("order_id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("client_id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("provider_id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_terminal_session_id_fkey" FOREIGN KEY ("terminal_session_id") REFERENCES "public"."terminal_sessions"("terminal_session_id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("client_id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("provider_id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_terminal_session_fk" FOREIGN KEY ("terminal_session_id") REFERENCES "public"."terminal_sessions"("terminal_session_id");



ALTER TABLE ONLY "public"."prices"
    ADD CONSTRAINT "prices_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."prices"
    ADD CONSTRAINT "prices_product_presentation_id_fkey" FOREIGN KEY ("product_presentation_id") REFERENCES "public"."product_presentations"("product_presentation_id");



ALTER TABLE ONLY "public"."product_presentations"
    ADD CONSTRAINT "product_presentations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."product_presentations"
    ADD CONSTRAINT "product_presentations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("brand_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("category_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_iva_id_fkey" FOREIGN KEY ("iva_id") REFERENCES "public"."iva"("iva_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_parent_product_id_fkey" FOREIGN KEY ("parent_product_id") REFERENCES "public"."products"("product_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("provider_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_public_image_id_fkey" FOREIGN KEY ("public_image_id") REFERENCES "public"."public_images"("public_image_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_sub_category_id_fkey" FOREIGN KEY ("sub_category_id") REFERENCES "public"."sub_categories"("sub_category_id");



ALTER TABLE ONLY "public"."providers"
    ADD CONSTRAINT "providers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."purchasing_agents"
    ADD CONSTRAINT "purchasing_agent_business_owner_id_fkey" FOREIGN KEY ("business_owner_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."stock"
    ADD CONSTRAINT "stock_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."stock"
    ADD CONSTRAINT "stock_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("lot_id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_business_owner_id_fkey" FOREIGN KEY ("business_owner_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_from_location_id_fkey" FOREIGN KEY ("from_location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("lot_id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "public"."stock"("stock_id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_to_location_id_fkey" FOREIGN KEY ("to_location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."stock"
    ADD CONSTRAINT "stock_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id");



ALTER TABLE ONLY "public"."store_order_sequences"
    ADD CONSTRAINT "store_order_sequences_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."sub_categories"
    ADD CONSTRAINT "sub_categories_business_owner_id_fkey" FOREIGN KEY ("business_owner_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."terminal_sessions"
    ADD CONSTRAINT "terminal_sessions_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."terminal_sessions"
    ADD CONSTRAINT "terminal_sessions_opened_by_user_fkey" FOREIGN KEY ("opened_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."terminal_sessions"
    ADD CONSTRAINT "terminal_sessions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."terminal_sessions"
    ADD CONSTRAINT "terminal_sessions_terminal_id_fkey" FOREIGN KEY ("terminal_id") REFERENCES "public"."terminals"("terminal_id");



ALTER TABLE ONLY "public"."terminals"
    ADD CONSTRAINT "terminals_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."transfer_order_items"
    ADD CONSTRAINT "transfer_order_items_lot_containers_movement_id_fkey" FOREIGN KEY ("lot_containers_movement_id") REFERENCES "public"."lot_containers_movements"("lot_container_movement_id");



ALTER TABLE ONLY "public"."transfer_order_items"
    ADD CONSTRAINT "transfer_order_items_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("lot_id");



ALTER TABLE ONLY "public"."transfer_order_items"
    ADD CONSTRAINT "transfer_order_items_product_presentation_id_fkey" FOREIGN KEY ("product_presentation_id") REFERENCES "public"."product_presentations"("product_presentation_id");



ALTER TABLE ONLY "public"."transfer_order_items"
    ADD CONSTRAINT "transfer_order_items_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "public"."stock"("stock_id");



ALTER TABLE ONLY "public"."transfer_orders"
    ADD CONSTRAINT "transfer_orders_assigned_user_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transfer_orders"
    ADD CONSTRAINT "transfer_orders_from_location_id_fkey" FOREIGN KEY ("from_location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."transfer_orders"
    ADD CONSTRAINT "transfer_orders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."transfer_orders"
    ADD CONSTRAINT "transfer_orders_to_location_id_fkey" FOREIGN KEY ("to_location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."transformation_items"
    ADD CONSTRAINT "transformation_items_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."transformation_items"
    ADD CONSTRAINT "transformation_items_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("lot_id");



ALTER TABLE ONLY "public"."transformation_items"
    ADD CONSTRAINT "transformation_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id");



ALTER TABLE ONLY "public"."transformation_items"
    ADD CONSTRAINT "transformation_items_product_presentation_id_fkey" FOREIGN KEY ("product_presentation_id") REFERENCES "public"."product_presentations"("product_presentation_id");



ALTER TABLE ONLY "public"."transformation_items"
    ADD CONSTRAINT "transformation_items_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "public"."stock"("stock_id");



ALTER TABLE ONLY "public"."transformation_items"
    ADD CONSTRAINT "transformation_items_transformation_id_fkey" FOREIGN KEY ("transformation_id") REFERENCES "public"."transformations"("transformation_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_business_owner_id_fkey" FOREIGN KEY ("business_owner_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."website_preferences"
    ADD CONSTRAINT "website_preferences_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Role-based select access" ON "public"."users" FOR SELECT TO "authenticated" USING (("role" = ANY (ARRAY['SUPERADMIN'::"public"."user_role_enum", 'OWNER'::"public"."user_role_enum", 'MANAGER'::"public"."user_role_enum"])));



CREATE POLICY "dueño o empleado puede CRUD purchasing_agents" ON "public"."purchasing_agents" USING (((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = 'OWNER'::"public"."user_role_enum") AND ("purchasing_agents"."business_owner_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" <> 'OWNER'::"public"."user_role_enum") AND ("purchasing_agents"."business_owner_id" = "u"."business_owner_id")))))) WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = 'OWNER'::"public"."user_role_enum") AND ("purchasing_agents"."business_owner_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" <> 'OWNER'::"public"."user_role_enum") AND ("purchasing_agents"."business_owner_id" = "u"."business_owner_id"))))));



ALTER TABLE "public"."transformation_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transformations" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."store_order_sequences";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."add_stock"("p_lot" "jsonb", "p_stocks" "jsonb", "p_lot_containers_location" "jsonb", "p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."add_stock"("p_lot" "jsonb", "p_stocks" "jsonb", "p_lot_containers_location" "jsonb", "p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_stock"("p_lot" "jsonb", "p_stocks" "jsonb", "p_lot_containers_location" "jsonb", "p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_stock_to_location"("p_lot_id" bigint, "p_product_id" bigint, "p_location_id" bigint, "p_quantity" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."add_stock_to_location"("p_lot_id" bigint, "p_product_id" bigint, "p_location_id" bigint, "p_quantity" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_stock_to_location"("p_lot_id" bigint, "p_product_id" bigint, "p_location_id" bigint, "p_quantity" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."apply_client_credit_adjustment"("p_client_id" bigint, "p_amount" numeric, "p_credit_direction" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."apply_client_credit_adjustment"("p_client_id" bigint, "p_amount" numeric, "p_credit_direction" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_client_credit_adjustment"("p_client_id" bigint, "p_amount" numeric, "p_credit_direction" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."apply_transformation_stock"("p_is_origin" boolean, "p_stock_id" bigint, "p_quantity" numeric, "p_location_id" bigint, "p_lot" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."apply_transformation_stock"("p_is_origin" boolean, "p_stock_id" bigint, "p_quantity" numeric, "p_location_id" bigint, "p_lot" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_transformation_stock"("p_is_origin" boolean, "p_stock_id" bigint, "p_quantity" numeric, "p_location_id" bigint, "p_lot" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."apply_transformation_stock"("p_is_origin" boolean, "p_origin_stock_id" bigint, "p_stock_id" bigint, "p_quantity" numeric, "p_location_id" bigint, "p_lot" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."apply_transformation_stock"("p_is_origin" boolean, "p_origin_stock_id" bigint, "p_stock_id" bigint, "p_quantity" numeric, "p_location_id" bigint, "p_lot" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_transformation_stock"("p_is_origin" boolean, "p_origin_stock_id" bigint, "p_stock_id" bigint, "p_quantity" numeric, "p_location_id" bigint, "p_lot" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."assign_stock_to_location"("p_from_stock_data" "jsonb", "p_stock_movement" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."assign_stock_to_location"("p_from_stock_data" "jsonb", "p_stock_movement" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_stock_to_location"("p_from_stock_data" "jsonb", "p_stock_movement" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."cancel_order"("p_order" "jsonb", "p_order_items" "jsonb", "p_notification" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."cancel_order"("p_order" "jsonb", "p_order_items" "jsonb", "p_notification" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_order"("p_order" "jsonb", "p_order_items" "jsonb", "p_notification" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_product_has_stock_by_short_code"("p_short_code" bigint, "p_business_owner_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_product_has_stock_by_short_code"("p_short_code" bigint, "p_business_owner_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_product_has_stock_by_short_code"("p_short_code" bigint, "p_business_owner_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_product_has_stock_by_short_code"("p_short_code" bigint, "p_business_owner_id" "uuid", "p_product_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."check_product_has_stock_by_short_code"("p_short_code" bigint, "p_business_owner_id" "uuid", "p_product_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_product_has_stock_by_short_code"("p_short_code" bigint, "p_business_owner_id" "uuid", "p_product_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."check_product_stock_by_short_code"("p_short_code" bigint, "p_business_owner_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_product_stock_by_short_code"("p_short_code" bigint, "p_business_owner_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_product_stock_by_short_code"("p_short_code" bigint, "p_business_owner_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."compensate_over_sell_lots"("p_lot" "jsonb", "p_stocks" "jsonb", "p_lot_containers_location" "jsonb", "p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."compensate_over_sell_lots"("p_lot" "jsonb", "p_stocks" "jsonb", "p_lot_containers_location" "jsonb", "p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."compensate_over_sell_lots"("p_lot" "jsonb", "p_stocks" "jsonb", "p_lot_containers_location" "jsonb", "p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_load_order"("p_load_order" "jsonb", "p_units" "jsonb", "p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_load_order"("p_load_order" "jsonb", "p_units" "jsonb", "p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_load_order"("p_load_order" "jsonb", "p_units" "jsonb", "p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_load_order_with_lots_and_prices"("p_load_order" "jsonb", "p_lots" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_load_order_with_lots_and_prices"("p_load_order" "jsonb", "p_lots" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_load_order_with_lots_and_prices"("p_load_order" "jsonb", "p_lots" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_lot_trace"("p_lot_from_id" bigint, "p_lot_to_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."create_lot_trace"("p_lot_from_id" bigint, "p_lot_to_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_lot_trace"("p_lot_from_id" bigint, "p_lot_to_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_order"("p_order" "jsonb", "p_order_items" "jsonb", "p_client_transaction" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_order"("p_order" "jsonb", "p_order_items" "jsonb", "p_client_transaction" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_order"("p_order" "jsonb", "p_order_items" "jsonb", "p_client_transaction" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_organization_with_owner"("p_user_id" "uuid", "p_email" "text", "p_organization_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_organization_with_owner"("p_user_id" "uuid", "p_email" "text", "p_organization_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_organization_with_owner"("p_user_id" "uuid", "p_email" "text", "p_organization_name" "text") TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_simple_order"("p_organization_id" "uuid", "p_location_id" bigint, "p_client_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."create_simple_order"("p_organization_id" "uuid", "p_location_id" bigint, "p_client_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_simple_order"("p_organization_id" "uuid", "p_location_id" bigint, "p_client_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_stock_movement_waste"("p_lot_id" bigint, "p_stock_id" bigint, "p_movement_type" "public"."movement_type", "p_quantity" numeric, "p_from_location_id" bigint, "p_to_location_id" bigint, "p_should_notify_owner" boolean, "p_created_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_stock_movement_waste"("p_lot_id" bigint, "p_stock_id" bigint, "p_movement_type" "public"."movement_type", "p_quantity" numeric, "p_from_location_id" bigint, "p_to_location_id" bigint, "p_should_notify_owner" boolean, "p_created_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_stock_movement_waste"("p_lot_id" bigint, "p_stock_id" bigint, "p_movement_type" "public"."movement_type", "p_quantity" numeric, "p_from_location_id" bigint, "p_to_location_id" bigint, "p_should_notify_owner" boolean, "p_created_by" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_transformation"("p_transformation_data" "jsonb", "p_transformation_items" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_transformation"("p_transformation_data" "jsonb", "p_transformation_items" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_transformation"("p_transformation_data" "jsonb", "p_transformation_items" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."current_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_delivery_order_item"("p_order_item_id" bigint, "p_stock_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."delete_delivery_order_item"("p_order_item_id" bigint, "p_stock_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_delivery_order_item"("p_order_item_id" bigint, "p_stock_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."deliver_order"("p_order_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."deliver_order"("p_order_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."deliver_order"("p_order_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_order_number"("p_location_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."generate_order_number"("p_location_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_order_number"("p_location_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_last_over_sell_stock"("p_product_id" bigint, "p_product_presentation_id" bigint, "p_location_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_last_over_sell_stock"("p_product_id" bigint, "p_product_presentation_id" bigint, "p_location_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_last_over_sell_stock"("p_product_id" bigint, "p_product_presentation_id" bigint, "p_location_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_lot_ancestors"("p_lot_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_lot_ancestors"("p_lot_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_lot_ancestors"("p_lot_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_lot_descendants"("p_lot_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_lot_descendants"("p_lot_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_lot_descendants"("p_lot_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_lot_lineage"("p_lot_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_lot_lineage"("p_lot_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_lot_lineage"("p_lot_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_lot_performance"("p_lot_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_lot_performance"("p_lot_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_lot_performance"("p_lot_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_lot_universe"("p_lot_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_lot_universe"("p_lot_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_lot_universe"("p_lot_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_stock_with_location_pi_and_pi"("p_product_id" bigint, "p_product_presentation_id" bigint, "p_location_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_stock_with_location_pi_and_pi"("p_product_id" bigint, "p_product_presentation_id" bigint, "p_location_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_stock_with_location_pi_and_pi"("p_product_id" bigint, "p_product_presentation_id" bigint, "p_location_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_products_stock_status_by_short_code"("p_short_code" bigint, "p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_products_stock_status_by_short_code"("p_short_code" bigint, "p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_products_stock_status_by_short_code"("p_short_code" bigint, "p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_sales_history_by_product_or_lot"("p_product_id" bigint, "p_lot_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_sales_history_by_product_or_lot"("p_product_id" bigint, "p_lot_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_sales_history_by_product_or_lot"("p_product_id" bigint, "p_lot_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_sales_history_by_product_or_lots"("p_product_id" bigint, "p_lot_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_sales_history_by_product_or_lots"("p_product_id" bigint, "p_lot_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_sales_history_by_product_or_lots"("p_product_id" bigint, "p_lot_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_stock_sales_history"("p_product_id" bigint, "p_lot_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_stock_sales_history"("p_product_id" bigint, "p_lot_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_stock_sales_history"("p_product_id" bigint, "p_lot_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_top_products_last_30_days"("p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_top_products_last_30_days"("p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_top_products_last_30_days"("p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_top_products_last_month"("p_business_owner_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_top_products_last_month"("p_business_owner_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_top_products_last_month"("p_business_owner_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_stock_movement"("p_lot_id" bigint, "p_stock_id" bigint, "p_movement_type" "public"."movement_type", "p_quantity" numeric, "p_from_location_id" bigint, "p_to_location_id" bigint, "p_should_notify_owner" boolean, "p_created_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_stock_movement"("p_lot_id" bigint, "p_stock_id" bigint, "p_movement_type" "public"."movement_type", "p_quantity" numeric, "p_from_location_id" bigint, "p_to_location_id" bigint, "p_should_notify_owner" boolean, "p_created_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_stock_movement"("p_lot_id" bigint, "p_stock_id" bigint, "p_movement_type" "public"."movement_type", "p_quantity" numeric, "p_from_location_id" bigint, "p_to_location_id" bigint, "p_should_notify_owner" boolean, "p_created_by" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_delivered_items_stock"("p_items" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."process_delivered_items_stock"("p_items" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_delivered_items_stock"("p_items" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."register_client_payments"("p_client_id" bigint, "p_payments" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."register_client_payments"("p_client_id" bigint, "p_payments" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."register_client_payments"("p_client_id" bigint, "p_payments" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."register_order"("p_order" "jsonb", "p_order_items" "jsonb", "p_order_payments" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."register_order"("p_order" "jsonb", "p_order_items" "jsonb", "p_order_payments" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."register_order"("p_order" "jsonb", "p_order_items" "jsonb", "p_order_payments" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."register_order_header"("p_order" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."register_order_header"("p_order" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."register_order_header"("p_order" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."register_order_items"("p_order_id" bigint, "p_items" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."register_order_items"("p_order_id" bigint, "p_items" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."register_order_items"("p_order_id" bigint, "p_items" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."register_order_payments"("p_order_id" bigint, "p_payments" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."register_order_payments"("p_order_id" bigint, "p_payments" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."register_order_payments"("p_order_id" bigint, "p_payments" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."register_payments"("p_order_id" bigint, "p_payments" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."register_payments"("p_order_id" bigint, "p_payments" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."register_payments"("p_order_id" bigint, "p_payments" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."reserve_stock_for_delivery"("p_order_item_id" bigint, "p_product_id" bigint, "p_product_presentation_id" bigint, "p_location_id" bigint, "p_stock_id" bigint, "p_quantity" numeric, "p_over_sell_quantity" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."reserve_stock_for_delivery"("p_order_item_id" bigint, "p_product_id" bigint, "p_product_presentation_id" bigint, "p_location_id" bigint, "p_stock_id" bigint, "p_quantity" numeric, "p_over_sell_quantity" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reserve_stock_for_delivery"("p_order_item_id" bigint, "p_product_id" bigint, "p_product_presentation_id" bigint, "p_location_id" bigint, "p_stock_id" bigint, "p_quantity" numeric, "p_over_sell_quantity" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."resolve_oversell_stock"("p_product_id" bigint, "p_product_presentation_id" bigint, "p_location_id" bigint, "p_over_sell_quantity" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."resolve_oversell_stock"("p_product_id" bigint, "p_product_presentation_id" bigint, "p_location_id" bigint, "p_over_sell_quantity" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."resolve_oversell_stock"("p_product_id" bigint, "p_product_presentation_id" bigint, "p_location_id" bigint, "p_over_sell_quantity" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_current_timestamp_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_current_timestamp_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_current_timestamp_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."stock_from_transfer_item"("p_stock_id" bigint, "p_quantity" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."stock_from_transfer_item"("p_stock_id" bigint, "p_quantity" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."stock_from_transfer_item"("p_stock_id" bigint, "p_quantity" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."stock_to_transfer_item"("p_stock_type" "public"."stock_type", "p_location_id" bigint, "p_quantity" numeric, "p_product_id" bigint, "p_lot_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."stock_to_transfer_item"("p_stock_type" "public"."stock_type", "p_location_id" bigint, "p_quantity" numeric, "p_product_id" bigint, "p_lot_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."stock_to_transfer_item"("p_stock_type" "public"."stock_type", "p_location_id" bigint, "p_quantity" numeric, "p_product_id" bigint, "p_lot_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."stock_to_transfer_item"("p_stock_type" "public"."stock_type", "p_store_id" bigint, "p_stock_room_id" bigint, "p_quantity" numeric, "p_product_id" bigint, "p_lot_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."stock_to_transfer_item"("p_stock_type" "public"."stock_type", "p_store_id" bigint, "p_stock_room_id" bigint, "p_quantity" numeric, "p_product_id" bigint, "p_lot_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."stock_to_transfer_item"("p_stock_type" "public"."stock_type", "p_store_id" bigint, "p_stock_room_id" bigint, "p_quantity" numeric, "p_product_id" bigint, "p_lot_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."subtract_stock_quantity"("p_stock_id" bigint, "p_quantity" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."subtract_stock_quantity"("p_stock_id" bigint, "p_quantity" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subtract_stock_quantity"("p_stock_id" bigint, "p_quantity" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."transfer_order_header"("p_transfer_order" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."transfer_order_header"("p_transfer_order" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."transfer_order_header"("p_transfer_order" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."transfer_order_items"("p_transfer_order_id" bigint, "p_items" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."transfer_order_items"("p_transfer_order_id" bigint, "p_items" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."transfer_order_items"("p_transfer_order_id" bigint, "p_items" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."transfer_order_with_items"("p_transfer_order" "jsonb", "p_transfer_order_items" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."transfer_order_with_items"("p_transfer_order" "jsonb", "p_transfer_order_items" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."transfer_order_with_items"("p_transfer_order" "jsonb", "p_transfer_order_items" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."transfer_stock"("p_lot_id" bigint, "p_movement_type" "text", "p_quantity" numeric, "p_from_stock_room_id" bigint, "p_to_stock_room_id" bigint, "p_from_store_id" bigint, "p_to_store_id" bigint, "p_should_notify_owner" boolean, "p_lot_containers_to_move" "jsonb", "p_created_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."transfer_stock"("p_lot_id" bigint, "p_movement_type" "text", "p_quantity" numeric, "p_from_stock_room_id" bigint, "p_to_stock_room_id" bigint, "p_from_store_id" bigint, "p_to_store_id" bigint, "p_should_notify_owner" boolean, "p_lot_containers_to_move" "jsonb", "p_created_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."transfer_stock"("p_lot_id" bigint, "p_movement_type" "text", "p_quantity" numeric, "p_from_stock_room_id" bigint, "p_to_stock_room_id" bigint, "p_from_store_id" bigint, "p_to_store_id" bigint, "p_should_notify_owner" boolean, "p_lot_containers_to_move" "jsonb", "p_created_by" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."transformation_header"("p_transformation_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."transformation_header"("p_transformation_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."transformation_header"("p_transformation_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."transformation_items"("p_transformation_id" bigint, "p_items" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."transformation_items"("p_transformation_id" bigint, "p_items" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."transformation_items"("p_transformation_id" bigint, "p_items" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_lot_containers_movements"("p_transfer_order_item_id" bigint, "p_movements" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_lot_containers_movements"("p_transfer_order_item_id" bigint, "p_movements" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_lot_containers_movements"("p_transfer_order_item_id" bigint, "p_movements" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_lot_sold_out_status"("p_lot_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."update_lot_sold_out_status"("p_lot_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_lot_sold_out_status"("p_lot_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_prices"("p_prices" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_prices"("p_prices" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_prices"("p_prices" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_prices"("p_prices" "jsonb", "p_delete_ids" bigint[]) TO "anon";
GRANT ALL ON FUNCTION "public"."update_prices"("p_prices" "jsonb", "p_delete_ids" bigint[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_prices"("p_prices" "jsonb", "p_delete_ids" bigint[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_stock_from_transfer_item"("p_stock_id" bigint, "p_new_qty" numeric, "p_prev_qty" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."update_stock_from_transfer_item"("p_stock_id" bigint, "p_new_qty" numeric, "p_prev_qty" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_stock_from_transfer_item"("p_stock_id" bigint, "p_new_qty" numeric, "p_prev_qty" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_stock_waste"("p_stock_id" bigint, "p_quantity" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."update_stock_waste"("p_stock_id" bigint, "p_quantity" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_stock_waste"("p_stock_id" bigint, "p_quantity" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_transfer_order_header"("p_transfer_order" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_transfer_order_header"("p_transfer_order" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_transfer_order_header"("p_transfer_order" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_transfer_order_items"("p_transfer_order_id" bigint, "p_items" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_transfer_order_items"("p_transfer_order_id" bigint, "p_items" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_transfer_order_items"("p_transfer_order_id" bigint, "p_items" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_transfer_order_with_items"("p_transfer_order" "jsonb", "p_transfer_order_items" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_transfer_order_with_items"("p_transfer_order" "jsonb", "p_transfer_order_items" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_transfer_order_with_items"("p_transfer_order" "jsonb", "p_transfer_order_items" "jsonb") TO "service_role";


















GRANT ALL ON TABLE "public"."brands" TO "anon";
GRANT ALL ON TABLE "public"."brands" TO "authenticated";
GRANT ALL ON TABLE "public"."brands" TO "service_role";



GRANT ALL ON SEQUENCE "public"."brands_brand_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."brands_brand_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."brands_brand_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."categories_category_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."categories_category_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."categories_category_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."client_transactions" TO "anon";
GRANT ALL ON TABLE "public"."client_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."client_transactions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."client_transactions_transaction_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."client_transactions_transaction_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."client_transactions_transaction_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON SEQUENCE "public"."clients_client_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."clients_client_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."clients_client_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."iva" TO "anon";
GRANT ALL ON TABLE "public"."iva" TO "authenticated";
GRANT ALL ON TABLE "public"."iva" TO "service_role";



GRANT ALL ON SEQUENCE "public"."iva_iva_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."iva_iva_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."iva_iva_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."load_orders" TO "anon";
GRANT ALL ON TABLE "public"."load_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."load_orders" TO "service_role";



GRANT ALL ON SEQUENCE "public"."loading_orders_loading_order_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."loading_orders_loading_order_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."loading_orders_loading_order_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."locations" TO "anon";
GRANT ALL ON TABLE "public"."locations" TO "authenticated";
GRANT ALL ON TABLE "public"."locations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."locations_location_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."locations_location_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."locations_location_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lot_containers" TO "anon";
GRANT ALL ON TABLE "public"."lot_containers" TO "authenticated";
GRANT ALL ON TABLE "public"."lot_containers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lot_container_lot_container_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lot_container_lot_container_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lot_container_lot_container_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lot_containers_movements" TO "anon";
GRANT ALL ON TABLE "public"."lot_containers_movements" TO "authenticated";
GRANT ALL ON TABLE "public"."lot_containers_movements" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lot_container_movement_lot_container_movement_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lot_container_movement_lot_container_movement_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lot_container_movement_lot_container_movement_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lot_containers_stock" TO "anon";
GRANT ALL ON TABLE "public"."lot_containers_stock" TO "authenticated";
GRANT ALL ON TABLE "public"."lot_containers_stock" TO "service_role";



GRANT ALL ON TABLE "public"."lot_traces" TO "anon";
GRANT ALL ON TABLE "public"."lot_traces" TO "authenticated";
GRANT ALL ON TABLE "public"."lot_traces" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lot_traces_lot_trace_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lot_traces_lot_trace_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lot_traces_lot_trace_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lots" TO "anon";
GRANT ALL ON TABLE "public"."lots" TO "authenticated";
GRANT ALL ON TABLE "public"."lots" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lots_lot_containers_lots_lot_containers_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lots_lot_containers_lots_lot_containers_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lots_lot_containers_lots_lot_containers_seq" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON SEQUENCE "public"."notifications_notification_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notifications_notification_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notifications_notification_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."order_items_order_item_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."order_items_order_item_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."order_items_order_item_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."order_payments_order_payment_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."order_payments_order_payment_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."order_payments_order_payment_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."orders_order_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."orders_order_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."orders_order_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."product_presentations" TO "anon";
GRANT ALL ON TABLE "public"."product_presentations" TO "authenticated";
GRANT ALL ON TABLE "public"."product_presentations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."presentations_presentation_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."presentations_presentation_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."presentations_presentation_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."prices" TO "anon";
GRANT ALL ON TABLE "public"."prices" TO "authenticated";
GRANT ALL ON TABLE "public"."prices" TO "service_role";



GRANT ALL ON SEQUENCE "public"."product_lots_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."product_lots_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."product_lots_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."product_prices_product_price_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."product_prices_product_price_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."product_prices_product_price_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON SEQUENCE "public"."products_product_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."products_product_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."products_product_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."providers" TO "anon";
GRANT ALL ON TABLE "public"."providers" TO "authenticated";
GRANT ALL ON TABLE "public"."providers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."providers_provider_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."providers_provider_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."providers_provider_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."public_images" TO "anon";
GRANT ALL ON TABLE "public"."public_images" TO "authenticated";
GRANT ALL ON TABLE "public"."public_images" TO "service_role";



GRANT ALL ON SEQUENCE "public"."public_images_public_image_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."public_images_public_image_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."public_images_public_image_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."purchasing_agents" TO "anon";
GRANT ALL ON TABLE "public"."purchasing_agents" TO "authenticated";
GRANT ALL ON TABLE "public"."purchasing_agents" TO "service_role";



GRANT ALL ON SEQUENCE "public"."purchasing_agent_purchasing_agent_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."purchasing_agent_purchasing_agent_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."purchasing_agent_purchasing_agent_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."stock" TO "anon";
GRANT ALL ON TABLE "public"."stock" TO "authenticated";
GRANT ALL ON TABLE "public"."stock" TO "service_role";



GRANT ALL ON TABLE "public"."stock_movements" TO "anon";
GRANT ALL ON TABLE "public"."stock_movements" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_movements" TO "service_role";



GRANT ALL ON SEQUENCE "public"."stock_movements_stock_movement_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."stock_movements_stock_movement_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."stock_movements_stock_movement_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."stock_stock_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."stock_stock_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."stock_stock_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."store_order_sequences" TO "anon";
GRANT ALL ON TABLE "public"."store_order_sequences" TO "authenticated";
GRANT ALL ON TABLE "public"."store_order_sequences" TO "service_role";



GRANT ALL ON SEQUENCE "public"."store_order_sequences_store_order_sequence_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."store_order_sequences_store_order_sequence_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."store_order_sequences_store_order_sequence_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sub_categories" TO "anon";
GRANT ALL ON TABLE "public"."sub_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."sub_categories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sub_categories_category_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sub_categories_category_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sub_categories_category_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."terminal_sessions" TO "anon";
GRANT ALL ON TABLE "public"."terminal_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."terminal_sessions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."terminal_sessions_terminal_session_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."terminal_sessions_terminal_session_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."terminal_sessions_terminal_session_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."terminals" TO "anon";
GRANT ALL ON TABLE "public"."terminals" TO "authenticated";
GRANT ALL ON TABLE "public"."terminals" TO "service_role";



GRANT ALL ON SEQUENCE "public"."terminals_terminal_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."terminals_terminal_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."terminals_terminal_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."transfer_order_items" TO "anon";
GRANT ALL ON TABLE "public"."transfer_order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."transfer_order_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."transfer_order_items_transfer_order_item_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."transfer_order_items_transfer_order_item_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."transfer_order_items_transfer_order_item_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."transfer_orders" TO "anon";
GRANT ALL ON TABLE "public"."transfer_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."transfer_orders" TO "service_role";



GRANT ALL ON SEQUENCE "public"."transfer_orders_transfer_order_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."transfer_orders_transfer_order_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."transfer_orders_transfer_order_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."transformation_items" TO "anon";
GRANT ALL ON TABLE "public"."transformation_items" TO "authenticated";
GRANT ALL ON TABLE "public"."transformation_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."transformation_items_transformation_item_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."transformation_items_transformation_item_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."transformation_items_transformation_item_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."transformations" TO "anon";
GRANT ALL ON TABLE "public"."transformations" TO "authenticated";
GRANT ALL ON TABLE "public"."transformations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."trasnformations_transformation_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."trasnformations_transformation_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."trasnformations_transformation_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."website_preferences" TO "anon";
GRANT ALL ON TABLE "public"."website_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."website_preferences" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























