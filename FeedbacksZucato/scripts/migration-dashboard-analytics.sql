CREATE OR REPLACE FUNCTION public.dashboard_feedback_stats()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT rating, sentiment
    FROM feedbacks
  ),
  totals AS (
    SELECT
      COUNT(*)::int AS total,
      COALESCE(ROUND(AVG(rating)::numeric, 2), 0)::numeric AS avg_rating,
      COUNT(*) FILTER (WHERE sentiment = 'positivo')::int AS positivo,
      COUNT(*) FILTER (WHERE sentiment = 'negativo')::int AS negativo,
      COUNT(*) FILTER (WHERE sentiment = 'neutro')::int AS neutro
    FROM base
  ),
  distribution AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'rating', rating,
        'total', total
      )
      ORDER BY rating
    ) AS items
    FROM (
      SELECT
        gs AS rating,
        COUNT(base.rating)::int AS total
      FROM generate_series(1, 10) AS gs
      LEFT JOIN base ON base.rating = gs
      GROUP BY gs
    ) ranked
  )
  SELECT jsonb_build_object(
    'total', totals.total,
    'avgRating', totals.avg_rating,
    'positivoPercent', CASE WHEN totals.total > 0 THEN ROUND((totals.positivo::numeric / totals.total::numeric) * 100, 1)::text ELSE '0' END,
    'negativoPercent', CASE WHEN totals.total > 0 THEN ROUND((totals.negativo::numeric / totals.total::numeric) * 100, 1)::text ELSE '0' END,
    'sentimentBreakdown', jsonb_build_object(
      'positivo', totals.positivo,
      'negativo', totals.negativo,
      'neutro', totals.neutro
    ),
    'clinicRatingDistribution', COALESCE(distribution.items, '[]'::jsonb)
  )
  FROM totals, distribution;
$$;

CREATE OR REPLACE FUNCTION public.dashboard_dentist_performance()
RETURNS TABLE (
  dentist_name text,
  total int,
  avg_rating numeric,
  aproveitamento numeric,
  positivo int,
  negativo int,
  neutro int
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT dentist_name, dentist_rating, dentist_sentiment
    FROM feedbacks
    WHERE dentist_name IS NOT NULL
  ),
  grouped AS (
    SELECT
      dentist_name,
      COUNT(*)::int AS total,
      COALESCE(ROUND(AVG(dentist_rating)::numeric, 2), 0)::numeric AS avg_rating,
      COUNT(*) FILTER (WHERE dentist_sentiment = 'positivo')::int AS positivo,
      COUNT(*) FILTER (WHERE dentist_sentiment = 'negativo')::int AS negativo,
      COUNT(*) FILTER (WHERE dentist_sentiment = 'neutro')::int AS neutro
    FROM base
    GROUP BY GROUPING SETS ((dentist_name), ())
  )
  SELECT
    COALESCE(dentist_name, 'Todos os dentistas') AS dentist_name,
    total,
    avg_rating,
    CASE
      WHEN total > 0 THEN ROUND((((positivo + (neutro * 0.5)) / total::numeric) * 100), 1)
      ELSE 0
    END AS aproveitamento,
    positivo,
    negativo,
    neutro
  FROM grouped
  ORDER BY CASE WHEN dentist_name IS NULL THEN 0 ELSE 1 END, dentist_name;
$$;

CREATE OR REPLACE FUNCTION public.dashboard_feedback_evolution(input_days int DEFAULT 30)
RETURNS TABLE (
  date text,
  media numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    TO_CHAR(DATE(created_at), 'DD/MM/YYYY') AS date,
    ROUND(AVG(rating)::numeric, 2) AS media
  FROM feedbacks
  WHERE created_at >= NOW() - make_interval(days => GREATEST(input_days, 1))
  GROUP BY DATE(created_at)
  ORDER BY DATE(created_at);
$$;

CREATE OR REPLACE FUNCTION public.dashboard_page_view_stats(
  input_page text DEFAULT 'index',
  input_date_from timestamptz DEFAULT NULL,
  input_date_to timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH filtered AS (
    SELECT created_at
    FROM page_views
    WHERE page = COALESCE(NULLIF(input_page, ''), 'index')
      AND (input_date_from IS NULL OR created_at >= input_date_from)
      AND (input_date_to IS NULL OR created_at <= input_date_to)
  ),
  totals AS (
    SELECT COUNT(*)::int AS total
    FROM filtered
  ),
  grouped AS (
    SELECT
      TO_CHAR(DATE(created_at), 'DD/MM/YYYY') AS date,
      COUNT(*)::int AS total
    FROM filtered
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) DESC
  )
  SELECT jsonb_build_object(
    'total', totals.total,
    'page', COALESCE(NULLIF(input_page, ''), 'index'),
    'byDate', COALESCE((SELECT jsonb_object_agg(grouped.date, grouped.total) FROM grouped), '{}'::jsonb)
  )
  FROM totals;
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_feedback_stats() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dashboard_dentist_performance() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dashboard_feedback_evolution(int) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dashboard_page_view_stats(text, timestamptz, timestamptz) TO anon, authenticated, service_role;