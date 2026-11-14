# The fixed list of padel Strokes rated in Evaluations (see GLOSSARY.md,
# Stroke), in the order they are shown. Each Module lists the Strokes it works
# on (CourseModule#strokes). The keys are what the database and the course
# JSON store: never rename them. Their names, in Portuguese and English, are
# in the frontend's translations (evaluations.strokes).
module Stroke
  KEYS = %w[
    serve return forehand backhand forehand_volley backhand_volley
    bandeja vibora smash lob chiquita drop_shot
    forehand_back_wall backhand_back_wall side_wall bajada
  ].freeze
end
