insert into public.plans (plan_id, name, creem_product_id, monthly_price_id, yearly_price_id, limits)
values
  (
    'starter',
    'Starter',
    'creem_prod_starter',
    'creem_price_starter_monthly',
    'creem_price_starter_yearly',
    '{"instances": 1, "regions": ["ap-singapore"]}'::jsonb
  ),
  (
    'pro',
    'Pro',
    'creem_prod_pro',
    'creem_price_pro_monthly',
    'creem_price_pro_yearly',
    '{"instances": 3, "regions": ["ap-singapore", "ap-jakarta"]}'::jsonb
  ),
  (
    'scale',
    'Scale',
    'creem_prod_scale',
    'creem_price_scale_monthly',
    'creem_price_scale_yearly',
    '{"instances": 10, "regions": ["ap-singapore", "ap-jakarta", "ap-hongkong"]}'::jsonb
  )
on conflict (plan_id)
do update set
  name = excluded.name,
  creem_product_id = excluded.creem_product_id,
  monthly_price_id = excluded.monthly_price_id,
  yearly_price_id = excluded.yearly_price_id,
  limits = excluded.limits,
  active = true,
  updated_at = timezone('utc', now());


