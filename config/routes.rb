Rails.application.routes.draw do
  ActiveAdmin.routes(self)
  devise_for :users, controllers: { sessions: "sessions" }

  # Redirect to localhost from 127.0.0.1 to use same IP address with Vite server
  constraints(host: "127.0.0.1") do
    get "(*path)", to: redirect { |params, req| "#{req.protocol}localhost:#{req.port}/#{params[:path]}" }
  end
  get "/dashboard", to: "dashboard#index", as: :dashboard
  get "/dashboard/courses", to: "courses#index"
  get "/dashboard/courses/:id", to: "courses#show"
  get "/dashboard/courses/:id/quiz", to: "courses#quiz"
  get "/dashboard/exercises", to: "exercises#index"
  get "/dashboard/exercises/:ref", to: "exercises#show"
  get "/dashboard/plan", to: "plan#index"
  get "/dashboard/profile", to: "profile#index"

  # Wrapped in devise_scope so Devise can resolve request.env["devise.mapping"]
  # for this route — without it, SessionsController#new raises
  # AbstractController::ActionNotFound ("Could not find devise mapping").
  devise_scope :user do
    root to: "sessions#new"
  end
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # Defines the root path route ("/")
  # root "posts#index"
end
