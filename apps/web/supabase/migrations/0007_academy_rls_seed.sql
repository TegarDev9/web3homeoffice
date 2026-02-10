alter table public.academy_rooms enable row level security;
alter table public.academy_tools enable row level security;
alter table public.academy_pc_stations enable row level security;
alter table public.academy_user_progress enable row level security;
alter table public.academy_activity_logs enable row level security;

create or replace function public.has_active_subscription(user_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.user_id = user_uuid
      and s.status in ('trialing', 'active')
  );
$$;

create policy "academy_rooms_public_read" on public.academy_rooms
for select
using (is_public_preview = true or public.has_active_subscription(auth.uid()) or public.is_admin(auth.uid()));

create policy "academy_rooms_admin_all" on public.academy_rooms
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "academy_tools_preview_or_member_read" on public.academy_tools
for select
using (
  is_member_only = false
  or public.has_active_subscription(auth.uid())
  or public.is_admin(auth.uid())
);

create policy "academy_tools_admin_all" on public.academy_tools
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "academy_pc_preview_or_member_read" on public.academy_pc_stations
for select
using (
  exists (
    select 1
    from public.academy_rooms r
    where r.id = room_id and r.is_public_preview = true
  )
  or public.has_active_subscription(auth.uid())
  or public.is_admin(auth.uid())
);

create policy "academy_pc_admin_all" on public.academy_pc_stations
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "academy_progress_select_self" on public.academy_user_progress
for select
using (auth.uid() = user_id);

create policy "academy_progress_insert_self" on public.academy_user_progress
for insert
with check (
  auth.uid() = user_id
  and public.has_active_subscription(auth.uid())
);

create policy "academy_progress_update_self" on public.academy_user_progress
for update
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and public.has_active_subscription(auth.uid())
);

create policy "academy_progress_admin_all" on public.academy_user_progress
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "academy_activity_logs_select_self_or_admin" on public.academy_activity_logs
for select
using (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "academy_activity_logs_insert_system_or_admin" on public.academy_activity_logs
for insert
with check (public.is_admin(auth.uid()) or auth.role() = 'service_role');

create policy "academy_activity_logs_admin_all" on public.academy_activity_logs
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

insert into public.academy_rooms (
  id,
  slug,
  title_id,
  title_en,
  summary_id,
  summary_en,
  theme,
  position,
  marker,
  sort_order,
  is_public_preview
)
values
  (
    'nft-digital-ownership',
    'nft-digital-ownership',
    'NFT & Kepemilikan Digital',
    'NFT & Digital Ownership',
    'Koleksi digital, membership, tiket event, lisensi, dan aset in-game.',
    'Digital collectibles, membership passes, event tickets, licenses, and in-game assets.',
    '{"accent":"#20d4ff","icon":"Fingerprint"}'::jsonb,
    '[0,0,0]'::jsonb,
    'NO',
    1,
    true
  ),
  (
    'gaming-gamefi-metaverse',
    'gaming-gamefi-metaverse',
    'Gaming (GameFi) & Metaverse',
    'Gaming (GameFi) & Metaverse',
    'Kepemilikan item game di wallet, marketplace item, dan model play-to-own.',
    'Wallet-owned game items, item marketplaces, and play-to-own mechanics.',
    '{"accent":"#69f0ae","icon":"Gamepad2"}'::jsonb,
    '[10,0,0]'::jsonb,
    'GM',
    2,
    true
  ),
  (
    'social-creator-economy',
    'social-creator-economy',
    'Social / Creator Economy (SocialFi)',
    'Social / Creator Economy (SocialFi)',
    'Monetisasi konten on-chain: membership, tipping, collectible post, dan komunitas.',
    'On-chain creator monetization: memberships, tipping, collectible posts, and communities.',
    '{"accent":"#ff79c6","icon":"Users"}'::jsonb,
    '[-10,0,0]'::jsonb,
    'SF',
    3,
    true
  ),
  (
    'dao-governance',
    'dao-governance',
    'DAO & Governance',
    'DAO & Governance',
    'Komunitas memiliki dan mengelola bersama melalui proposal, voting, dan treasury.',
    'Community ownership and shared governance with proposals, voting, and treasury ops.',
    '{"accent":"#ffd166","icon":"Vote"}'::jsonb,
    '[0,0,10]'::jsonb,
    'DG',
    4,
    true
  ),
  (
    'identity-did-reputation',
    'identity-did-reputation',
    'Identity (DID) & Reputasi',
    'Identity (DID) & Reputation',
    'Identitas terverifikasi, verifiable credentials, dan proof-of-personhood.',
    'Verified identity, verifiable credentials, and proof-of-personhood systems.',
    '{"accent":"#8be9fd","icon":"BadgeCheck"}'::jsonb,
    '[0,0,-10]'::jsonb,
    'ID',
    5,
    true
  ),
  (
    'infrastructure-dev-tooling',
    'infrastructure-dev-tooling',
    'Infrastructure & Developer Tooling',
    'Infrastructure & Developer Tooling',
    'Chain/L2, wallet UX, indexer, RPC, account abstraction, tooling, dan SDK.',
    'Chains/L2s, wallet UX, indexers, RPC, account abstraction, smart-contract tooling, and SDKs.',
    '{"accent":"#20d4ff","icon":"ServerCog"}'::jsonb,
    '[20,0,0]'::jsonb,
    'IN',
    6,
    true
  ),
  (
    'oracles-interoperability-bridges',
    'oracles-interoperability-bridges',
    'Oracles, Interoperability & Bridges',
    'Oracles, Interoperability & Bridges',
    'Data dunia nyata ke blockchain dan komunikasi aman antar-chain.',
    'Real-world data ingestion and secure cross-chain communication.',
    '{"accent":"#ffb86c","icon":"Waypoints"}'::jsonb,
    '[-20,0,0]'::jsonb,
    'OB',
    7,
    true
  ),
  (
    'storage-compute',
    'storage-compute',
    'Storage / Compute Terdesentralisasi',
    'Decentralized Storage / Compute',
    'Penyimpanan file, hosting konten, dan compute workload terdistribusi.',
    'File storage, content hosting, and distributed compute workloads.',
    '{"accent":"#50fa7b","icon":"Database"}'::jsonb,
    '[10,0,10]'::jsonb,
    'SC',
    8,
    true
  ),
  (
    'depin',
    'depin',
    'DePIN',
    'DePIN',
    'Infrastruktur fisik berbasis insentif token: wireless, sensor, mapping, compute, storage.',
    'Token-incentivized physical infra networks: wireless, sensors, mapping, compute, and storage.',
    '{"accent":"#ff79c6","icon":"Antenna"}'::jsonb,
    '[-10,0,10]'::jsonb,
    'DP',
    9,
    true
  ),
  (
    'rwa',
    'rwa',
    'RWA (Real-World Assets)',
    'RWA (Real-World Assets)',
    'Tokenisasi aset dunia nyata seperti invoice, obligasi, komoditas, dan properti.',
    'Tokenization patterns for invoices, bonds, commodities, and real estate.',
    '{"accent":"#f1fa8c","icon":"Landmark"}'::jsonb,
    '[10,0,-10]'::jsonb,
    'RW',
    10,
    true
  ),
  (
    'payments-stablecoins',
    'payments-stablecoins',
    'Payments & Stablecoins',
    'Payments & Stablecoins',
    'Pembayaran lintas negara, payroll, settlement, dan micropayment berbasis stablecoin.',
    'Cross-border payments, payroll, settlement, and stablecoin micropayment flows.',
    '{"accent":"#8be9fd","icon":"Wallet"}'::jsonb,
    '[-10,0,-10]'::jsonb,
    'PS',
    11,
    true
  ),
  (
    'prediction-information-markets',
    'prediction-information-markets',
    'Prediction / Information Markets',
    'Prediction / Information Markets',
    'Eksplorasi market prediksi dan mekanisme discovery informasi on-chain.',
    'Explore prediction markets and on-chain information discovery mechanics.',
    '{"accent":"#bd93f9","icon":"ChartLine"}'::jsonb,
    '[0,0,20]'::jsonb,
    'PM',
    12,
    true
  )
on conflict (id) do update
set
  slug = excluded.slug,
  title_id = excluded.title_id,
  title_en = excluded.title_en,
  summary_id = excluded.summary_id,
  summary_en = excluded.summary_en,
  theme = excluded.theme,
  position = excluded.position,
  marker = excluded.marker,
  sort_order = excluded.sort_order,
  is_public_preview = excluded.is_public_preview,
  updated_at = timezone('utc', now());

insert into public.academy_tools (
  room_id,
  tool_key,
  name_id,
  name_en,
  description_id,
  description_en,
  category,
  difficulty,
  is_member_only,
  action_kind,
  action_payload,
  sort_order
)
values
  ('nft-digital-ownership', 'nft-membership-pass', 'Membership Pass Canvas', 'Membership Pass Canvas', 'Template membership NFT untuk komunitas atau kelas premium.', 'Template a membership NFT model for communities or premium classes.', 'nft', 'beginner', false, 'demo', '{"demo":"membership-pass"}'::jsonb, 1),
  ('nft-digital-ownership', 'nft-ticketing-flow', 'Event Ticket Flow', 'Event Ticket Flow', 'Rancang lifecycle tiket event on-chain dari mint sampai verifikasi.', 'Design end-to-end on-chain event ticket lifecycle from mint to verification.', 'nft', 'intermediate', true, 'internal', '{"route":"/billing"}'::jsonb, 2),
  ('nft-digital-ownership', 'nft-license-playbook', 'Digital License Playbook', 'Digital License Playbook', 'Contoh lisensi kreator dan distribusi hak digital berbasis token.', 'Sample creator licensing and tokenized digital rights distribution.', 'nft', 'intermediate', true, 'demo', '{"demo":"license-playbook"}'::jsonb, 3),

  ('gaming-gamefi-metaverse', 'gamefi-item-ownership', 'Item Ownership Blueprint', 'Item Ownership Blueprint', 'Model item game yang dimiliki wallet pemain.', 'Wallet-owned in-game item model blueprint.', 'gaming', 'beginner', false, 'demo', '{"demo":"item-ownership"}'::jsonb, 1),
  ('gaming-gamefi-metaverse', 'gamefi-marketplace-design', 'Marketplace Design Studio', 'Marketplace Design Studio', 'Desain alur listing, transfer, dan fee marketplace item.', 'Design listing, transfer, and fee flows for item marketplaces.', 'gaming', 'intermediate', true, 'demo', '{"demo":"marketplace-design"}'::jsonb, 2),
  ('gaming-gamefi-metaverse', 'gamefi-play-to-own-loop', 'Play-to-Own Loop', 'Play-to-Own Loop', 'Simulasi ekonomi play-to-own yang berkelanjutan.', 'Simulate sustainable play-to-own game loop economics.', 'gaming', 'advanced', true, 'demo', '{"demo":"play-to-own-loop"}'::jsonb, 3),

  ('social-creator-economy', 'socialfi-membership-layers', 'Membership Layer Builder', 'Membership Layer Builder', 'Rancang tier membership kreator dengan benefit yang jelas.', 'Design creator membership tiers with clear benefits.', 'socialfi', 'beginner', false, 'demo', '{"demo":"membership-layers"}'::jsonb, 1),
  ('social-creator-economy', 'socialfi-tip-flow', 'On-Chain Tipping Flow', 'On-Chain Tipping Flow', 'Eksperimen alur tip langsung ke wallet kreator.', 'Prototype direct creator tipping flows to wallet.', 'socialfi', 'intermediate', true, 'demo', '{"demo":"tip-flow"}'::jsonb, 2),
  ('social-creator-economy', 'socialfi-collectible-post', 'Collectible Post Lab', 'Collectible Post Lab', 'Buat konsep post collectible untuk engagement komunitas.', 'Draft collectible post mechanics for community engagement.', 'socialfi', 'intermediate', true, 'demo', '{"demo":"collectible-post"}'::jsonb, 3),

  ('dao-governance', 'dao-proposal-template', 'Proposal Template', 'Proposal Template', 'Kerangka proposal DAO yang jelas dan terukur.', 'Clear and measurable DAO proposal template.', 'dao', 'beginner', false, 'demo', '{"demo":"proposal-template"}'::jsonb, 1),
  ('dao-governance', 'dao-voting-simulator', 'Voting Simulator', 'Voting Simulator', 'Simulasi voting dengan quorum, threshold, dan periode voting.', 'Simulate voting with quorum, threshold, and voting periods.', 'dao', 'intermediate', true, 'demo', '{"demo":"voting-simulator"}'::jsonb, 2),
  ('dao-governance', 'dao-treasury-grant-workflow', 'Treasury Grant Workflow', 'Treasury Grant Workflow', 'Rancang alur treasury dan grant untuk komunitas builder.', 'Design treasury and grant workflows for builder communities.', 'dao', 'advanced', true, 'demo', '{"demo":"treasury-grants"}'::jsonb, 3),

  ('identity-did-reputation', 'did-credential-basics', 'Credential Basics', 'Credential Basics', 'Pengenalan verifiable credentials dan use case identitas.', 'Understand verifiable credentials and identity use-cases.', 'identity', 'beginner', false, 'demo', '{"demo":"credential-basics"}'::jsonb, 1),
  ('identity-did-reputation', 'did-proof-of-personhood', 'Proof-of-Personhood Patterns', 'Proof-of-Personhood Patterns', 'Bandingkan pola anti-sybil untuk komunitas terbuka.', 'Compare anti-sybil proof-of-personhood patterns for open communities.', 'identity', 'intermediate', true, 'demo', '{"demo":"proof-of-personhood"}'::jsonb, 2),
  ('identity-did-reputation', 'did-reputation-scorecard', 'Reputation Scorecard', 'Reputation Scorecard', 'Rancang reputasi berbasis aktivitas dan kredensial.', 'Design activity and credential-based reputation scorecards.', 'identity', 'advanced', true, 'demo', '{"demo":"reputation-scorecard"}'::jsonb, 3),

  ('infrastructure-dev-tooling', 'infra-wallet-ux-checklist', 'Wallet UX Checklist', 'Wallet UX Checklist', 'Checklist UX wallet untuk onboarding user non-teknis.', 'Wallet UX checklist for non-technical user onboarding.', 'infrastructure', 'beginner', false, 'demo', '{"demo":"wallet-ux-checklist"}'::jsonb, 1),
  ('infrastructure-dev-tooling', 'infra-aa-sandbox', 'Account Abstraction Sandbox', 'Account Abstraction Sandbox', 'Eksplorasi skenario gas sponsorship dan smart accounts.', 'Explore gas sponsorship and smart-account scenarios.', 'infrastructure', 'intermediate', true, 'demo', '{"demo":"aa-sandbox"}'::jsonb, 2),
  ('infrastructure-dev-tooling', 'infra-sdk-indexer-map', 'SDK & Indexer Map', 'SDK & Indexer Map', 'Peta integrasi SDK, RPC, dan indexer untuk produk production-ready.', 'Map SDK, RPC, and indexer integrations for production products.', 'infrastructure', 'advanced', true, 'demo', '{"demo":"sdk-indexer-map"}'::jsonb, 3),

  ('oracles-interoperability-bridges', 'oracle-data-ingest-preview', 'Oracle Data Ingest', 'Oracle Data Ingest', 'Preview alur data dunia nyata menuju smart contract.', 'Preview real-world data ingestion into smart contracts.', 'oracles', 'beginner', false, 'demo', '{"demo":"oracle-ingest"}'::jsonb, 1),
  ('oracles-interoperability-bridges', 'oracle-bridge-risk-matrix', 'Bridge Risk Matrix', 'Bridge Risk Matrix', 'Evaluasi trust assumptions dan risiko bridge antar-chain.', 'Evaluate trust assumptions and bridge risk surfaces.', 'oracles', 'intermediate', true, 'demo', '{"demo":"bridge-risk-matrix"}'::jsonb, 2),
  ('oracles-interoperability-bridges', 'oracle-crosschain-message-lab', 'Cross-Chain Message Lab', 'Cross-Chain Message Lab', 'Uji konsep message passing lintas chain.', 'Test cross-chain message passing concepts.', 'oracles', 'advanced', true, 'demo', '{"demo":"cross-chain-messages"}'::jsonb, 3),

  ('storage-compute', 'storage-content-addressing', 'Content Addressing 101', 'Content Addressing 101', 'Prinsip CID dan immutable storage untuk aset digital.', 'CID principles and immutable storage for digital assets.', 'storage', 'beginner', false, 'demo', '{"demo":"content-addressing"}'::jsonb, 1),
  ('storage-compute', 'storage-hosting-patterns', 'Decentralized Hosting Patterns', 'Decentralized Hosting Patterns', 'Bandingkan pola hosting konten terdesentralisasi.', 'Compare decentralized content hosting patterns.', 'storage', 'intermediate', true, 'demo', '{"demo":"hosting-patterns"}'::jsonb, 2),
  ('storage-compute', 'storage-compute-workload-map', 'Compute Workload Map', 'Compute Workload Map', 'Mapping workload compute untuk aplikasi AI/Web3 hybrid.', 'Map compute workloads for AI/Web3 hybrid applications.', 'storage', 'advanced', true, 'demo', '{"demo":"compute-workload-map"}'::jsonb, 3),

  ('depin', 'depin-network-incentive-preview', 'DePIN Incentive Primer', 'DePIN Incentive Primer', 'Dasar desain insentif node fisik dan partisipasi jaringan.', 'DePIN basics for physical node incentives and participation.', 'depin', 'beginner', false, 'demo', '{"demo":"depin-primer"}'::jsonb, 1),
  ('depin', 'depin-sensor-topology', 'Sensor Topology Lab', 'Sensor Topology Lab', 'Rancang topologi sensor/wireless untuk use case komunitas.', 'Design sensor/wireless topologies for community use-cases.', 'depin', 'intermediate', true, 'demo', '{"demo":"sensor-topology"}'::jsonb, 2),
  ('depin', 'depin-reward-economics', 'Reward Economics Simulator', 'Reward Economics Simulator', 'Simulasi reward model dan dampaknya ke kualitas jaringan.', 'Simulate reward models and their effects on network quality.', 'depin', 'advanced', true, 'demo', '{"demo":"reward-economics"}'::jsonb, 3),

  ('rwa', 'rwa-tokenization-primer', 'RWA Tokenization Primer', 'RWA Tokenization Primer', 'Framework awal tokenisasi aset dunia nyata.', 'Foundational framework for tokenizing real-world assets.', 'rwa', 'beginner', false, 'demo', '{"demo":"rwa-primer"}'::jsonb, 1),
  ('rwa', 'rwa-compliance-checklist', 'Compliance Checklist', 'Compliance Checklist', 'Checklist kepatuhan dasar sebelum go-to-market.', 'Baseline compliance checklist before go-to-market.', 'rwa', 'intermediate', true, 'demo', '{"demo":"rwa-compliance"}'::jsonb, 2),
  ('rwa', 'rwa-liquidity-routing', 'Liquidity Routing Design', 'Liquidity Routing Design', 'Rancang skenario likuiditas untuk aset tokenized.', 'Design liquidity routing for tokenized assets.', 'rwa', 'advanced', true, 'demo', '{"demo":"rwa-liquidity"}'::jsonb, 3),

  ('payments-stablecoins', 'payments-stablecoin-flow', 'Stablecoin Flow Builder', 'Stablecoin Flow Builder', 'Bangun alur pembayaran lintas negara berbasis stablecoin.', 'Build cross-border stablecoin payment flows.', 'payments', 'beginner', false, 'demo', '{"demo":"stablecoin-flow"}'::jsonb, 1),
  ('payments-stablecoins', 'payments-payroll-runbook', 'Payroll Runbook', 'Payroll Runbook', 'Rancang payroll process untuk tim global.', 'Design stablecoin payroll processes for global teams.', 'payments', 'intermediate', true, 'demo', '{"demo":"payroll-runbook"}'::jsonb, 2),
  ('payments-stablecoins', 'payments-micropayment-sim', 'Micropayment Simulator', 'Micropayment Simulator', 'Simulasi settlement mikro untuk konten dan API economy.', 'Simulate micro-settlement for content and API economies.', 'payments', 'advanced', true, 'demo', '{"demo":"micropayment-sim"}'::jsonb, 3),

  ('prediction-information-markets', 'prediction-market-mechanics', 'Market Mechanics 101', 'Market Mechanics 101', 'Pahami dasar market prediction dan struktur outcome.', 'Understand fundamentals of prediction market outcomes.', 'prediction', 'beginner', false, 'demo', '{"demo":"market-mechanics"}'::jsonb, 1),
  ('prediction-information-markets', 'prediction-liquidity-model', 'Liquidity Model Lab', 'Liquidity Model Lab', 'Eksperimen model likuiditas untuk market kecil-menengah.', 'Experiment with liquidity models for small-mid prediction markets.', 'prediction', 'intermediate', true, 'demo', '{"demo":"liquidity-model"}'::jsonb, 2),
  ('prediction-information-markets', 'prediction-resolution-governance', 'Resolution Governance', 'Resolution Governance', 'Rancang mekanisme resolusi sengketa pasar informasi.', 'Design market resolution and dispute governance mechanics.', 'prediction', 'advanced', true, 'demo', '{"demo":"resolution-governance"}'::jsonb, 3)
on conflict (tool_key) do update
set
  room_id = excluded.room_id,
  name_id = excluded.name_id,
  name_en = excluded.name_en,
  description_id = excluded.description_id,
  description_en = excluded.description_en,
  category = excluded.category,
  difficulty = excluded.difficulty,
  is_member_only = excluded.is_member_only,
  action_kind = excluded.action_kind,
  action_payload = excluded.action_payload,
  sort_order = excluded.sort_order,
  updated_at = timezone('utc', now());

insert into public.academy_pc_stations (
  room_id,
  label,
  model_key,
  position,
  rotation,
  specs
)
values
  ('nft-digital-ownership', 'Main PC', 'pc-neon-v1', '[1.8,0.6,2.0]'::jsonb, '[0,0,0]'::jsonb, '{"cpu":"vCPU 4","ram":"8GB","gpu":"none"}'::jsonb),
  ('gaming-gamefi-metaverse', 'Main PC', 'pc-neon-v1', '[11.8,0.6,2.0]'::jsonb, '[0,0,0]'::jsonb, '{"cpu":"vCPU 8","ram":"16GB","gpu":"entry"}'::jsonb),
  ('social-creator-economy', 'Main PC', 'pc-neon-v1', '[-8.2,0.6,2.0]'::jsonb, '[0,0,0]'::jsonb, '{"cpu":"vCPU 4","ram":"8GB","gpu":"none"}'::jsonb),
  ('dao-governance', 'Main PC', 'pc-neon-v1', '[1.8,0.6,12.0]'::jsonb, '[0,0,0]'::jsonb, '{"cpu":"vCPU 4","ram":"8GB","gpu":"none"}'::jsonb),
  ('identity-did-reputation', 'Main PC', 'pc-neon-v1', '[1.8,0.6,-8.0]'::jsonb, '[0,0,0]'::jsonb, '{"cpu":"vCPU 4","ram":"8GB","gpu":"none"}'::jsonb),
  ('infrastructure-dev-tooling', 'Main PC', 'pc-neon-v1', '[21.8,0.6,2.0]'::jsonb, '[0,0,0]'::jsonb, '{"cpu":"vCPU 8","ram":"16GB","gpu":"none"}'::jsonb),
  ('oracles-interoperability-bridges', 'Main PC', 'pc-neon-v1', '[-18.2,0.6,2.0]'::jsonb, '[0,0,0]'::jsonb, '{"cpu":"vCPU 8","ram":"16GB","gpu":"none"}'::jsonb),
  ('storage-compute', 'Main PC', 'pc-neon-v1', '[11.8,0.6,12.0]'::jsonb, '[0,0,0]'::jsonb, '{"cpu":"vCPU 8","ram":"32GB","gpu":"optional"}'::jsonb),
  ('depin', 'Main PC', 'pc-neon-v1', '[-8.2,0.6,12.0]'::jsonb, '[0,0,0]'::jsonb, '{"cpu":"vCPU 8","ram":"16GB","gpu":"none"}'::jsonb),
  ('rwa', 'Main PC', 'pc-neon-v1', '[11.8,0.6,-8.0]'::jsonb, '[0,0,0]'::jsonb, '{"cpu":"vCPU 4","ram":"8GB","gpu":"none"}'::jsonb),
  ('payments-stablecoins', 'Main PC', 'pc-neon-v1', '[-8.2,0.6,-8.0]'::jsonb, '[0,0,0]'::jsonb, '{"cpu":"vCPU 4","ram":"8GB","gpu":"none"}'::jsonb),
  ('prediction-information-markets', 'Main PC', 'pc-neon-v1', '[1.8,0.6,22.0]'::jsonb, '[0,0,0]'::jsonb, '{"cpu":"vCPU 4","ram":"8GB","gpu":"none"}'::jsonb)
on conflict (room_id, label) do update
set
  model_key = excluded.model_key,
  position = excluded.position,
  rotation = excluded.rotation,
  specs = excluded.specs,
  updated_at = timezone('utc', now());

create or replace view public.academy_rooms_with_tools as
select
  r.id,
  r.slug,
  r.title_id,
  r.title_en,
  r.summary_id,
  r.summary_en,
  r.theme,
  r.position,
  r.marker,
  r.sort_order,
  r.is_public_preview,
  r.created_at,
  r.updated_at,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', t.id,
          'tool_key', t.tool_key,
          'name_id', t.name_id,
          'name_en', t.name_en,
          'description_id', t.description_id,
          'description_en', t.description_en,
          'category', t.category,
          'difficulty', t.difficulty,
          'is_member_only', t.is_member_only,
          'action_kind', t.action_kind,
          'action_payload', t.action_payload,
          'sort_order', t.sort_order
        )
        order by t.sort_order asc
      )
      from public.academy_tools t
      where t.room_id = r.id
    ),
    '[]'::jsonb
  ) as tools
from public.academy_rooms r;
