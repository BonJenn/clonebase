-- Phase 6: Vibecoding Sandbox — AI-generated templates

-- Track whether a template is hand-built or AI-generated
ALTER TABLE app_templates
  ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'static' CHECK (source_type IN ('static', 'generated'));

-- Stores AI-generated template source code
CREATE TABLE IF NOT EXISTS generated_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES app_templates(id) ON DELETE CASCADE,
  -- Source code for each file
  page_code text NOT NULL,
  admin_code text,
  api_handler_code text,
  component_files jsonb DEFAULT '{}',
  -- Generation metadata
  generation_prompt text,
  conversation_history jsonb DEFAULT '[]',
  model_used text DEFAULT 'claude-sonnet-4-20250514',
  -- Versioning
  version int NOT NULL DEFAULT 1,
  is_current boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_generated_templates_template ON generated_templates(template_id);
CREATE INDEX idx_generated_templates_current ON generated_templates(template_id, is_current) WHERE is_current = true;

-- RLS
ALTER TABLE generated_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can manage their generated templates"
  ON generated_templates FOR ALL
  USING (
    EXISTS (SELECT 1 FROM app_templates WHERE id = template_id AND creator_id = auth.uid())
  );

CREATE POLICY "Published generated templates are publicly readable"
  ON generated_templates FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM app_templates WHERE id = template_id AND status = 'published' AND visibility = 'public')
  );
