-- Clinical tool metadata enrichment
-- Run after clinical_tools.sql

alter table public.clinical_tools
  add column if not exists target_condition text,
  add column if not exists item_count integer,
  add column if not exists administration_note text,
  add column if not exists interpretation_guide text;

update public.clinical_tools
set
  target_condition = 'Depression',
  item_count = 9,
  administration_note = 'Self-report, symptoms over the last 2 weeks.',
  interpretation_guide = '0-4 Minimal, 5-9 Mild, 10-14 Moderate, 15-19 Moderately severe, 20-27 Severe.'
where code = 'PHQ9';

update public.clinical_tools
set
  target_condition = 'Anxiety',
  item_count = 7,
  administration_note = 'Self-report, symptoms over the last 2 weeks.',
  interpretation_guide = '0-4 Minimal, 5-9 Mild, 10-14 Moderate, 15-21 Severe anxiety.'
where code = 'GAD7';

update public.clinical_tools
set
  target_condition = 'Somatic symptoms',
  item_count = 15,
  administration_note = 'Self-report, symptom burden over recent weeks.',
  interpretation_guide = '0-4 Minimal, 5-9 Low, 10-14 Medium, 15-30 High somatic symptom severity.'
where code = 'PHQ15';

update public.clinical_tools
set
  target_condition = 'Depression, Anxiety, Stress',
  item_count = 21,
  administration_note = 'Self-report, symptoms over the past week.',
  interpretation_guide = 'Depression, Anxiety and Stress are interpreted per subscale (7 items each).'
where code = 'DASS21';

update public.clinical_tools
set
  target_condition = 'Psychological wellbeing',
  item_count = 5,
  administration_note = 'Self-report positive wellbeing, last 2 weeks.',
  interpretation_guide = 'Raw 0-25 (can convert to 0-100 by multiplying by 4). Lower score indicates lower wellbeing.'
where code = 'WHO5';

update public.clinical_tools
set
  target_condition = 'Perceived stress',
  item_count = 10,
  administration_note = 'Self-report over the last month; includes reverse-scored items.',
  interpretation_guide = '0-13 Low, 14-26 Moderate, 27-40 High perceived stress.'
where code = 'PSS10';

update public.clinical_tools
set
  target_condition = 'Insomnia',
  item_count = 7,
  administration_note = 'Self-report over the last 2 weeks.',
  interpretation_guide = '0-7 None, 8-14 Subthreshold, 15-21 Moderate clinical, 22-28 Severe clinical insomnia.'
where code = 'ISI';

update public.clinical_tools
set
  target_condition = 'Burnout',
  item_count = 19,
  administration_note = 'Covers personal, work-related and client-related burnout dimensions.',
  interpretation_guide = 'Average score bands often read as <25 Low, 25-49 Mild, 50-74 Moderate, >=75 High burnout.'
where code = 'CBI';

update public.clinical_tools
set
  target_condition = 'Functioning & disability',
  item_count = 12,
  administration_note = 'Self-report limitations over the last 30 days.',
  interpretation_guide = 'Higher score indicates greater disability across functioning domains.'
where code = 'WHODAS12';
