# Rails treats SVG as a binary/attachment-only content type by default (to
# block inline SVG XSS from arbitrary user uploads). Our exercise diagrams are
# curated, non-user-uploaded design assets, so allow them to render inline as
# <img> like any other image instead of always downloading as an attachment.
ActiveStorage.content_types_to_serve_as_binary -= %w[image/svg+xml]
ActiveStorage.content_types_allowed_inline += %w[image/svg+xml]
