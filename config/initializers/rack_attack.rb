class Rack::Attack
  # Share the throttle counters with Rails.cache (solid_cache) so they're consistent
  # across Puma workers/dynos instead of being tracked per-process in memory.
  Rack::Attack.cache.store = Rails.cache

  # Vulnerability scanners and bots endlessly probe variations of these paths on every
  # public site; none of them are real routes here. Reject them outright instead of
  # letting them fall through to routing and show up as ActionController::RoutingError
  # noise in the logs.
  SCANNER_PATH_PATTERNS = [
    /\.php$/i,                        # xmlrpc.php, tracking.php, wp-login.php, ...
    %r{/wp-(admin|includes|content|login)}i,
    %r{\.(env|git)(/|$)}i,
    %r{^/_internal/},
    %r{^/\.(amper|rt)/},
    /telegram_redirect/i,
    /captcha_validated/i,
    %r{^/(setup|cgi-bin|phpmyadmin)(/|$)},
  ].freeze

  blocklist("scanner paths") do |req|
    SCANNER_PATH_PATTERNS.any? { |pattern| req.path.match?(pattern) }
  end

  # Backstop for anything the pattern list above misses: no legitimate client needs
  # this many requests from a single IP in five minutes.
  throttle("requests by ip", limit: 300, period: 5.minutes) do |req|
    req.ip
  end

  self.blocklisted_responder = ->(_req) { [ 403, { "Content-Type" => "text/plain" }, [ "Forbidden\n" ] ] }
  self.throttled_responder = ->(_req) { [ 429, { "Content-Type" => "text/plain" }, [ "Too many requests\n" ] ] }
end
