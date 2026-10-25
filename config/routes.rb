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
  patch "/dashboard/courses/:id/complete", to: "courses#complete"
  get "/dashboard/courses/:id/quiz", to: "courses#quiz"
  get "/dashboard/exercises", to: "exercises#index"
  get "/dashboard/exercises/:ref", to: "exercises#show", format: false, constraints: { ref: /[^\/]+/ }
  patch "/dashboard/exercises/:ref/complete", to: "exercises#complete", constraints: { ref: /[^\/]+/ }
  scope "/dashboard" do
    resources :clubs, only: %i[show] do
      resources :players, only: %i[index new create edit update], shallow: true
    end
  end
  # Coach invitations: a Club Manager invites from a Club; the Coach accepts
  # through the emailed link, signed out.
  scope "/dashboard" do
    resources :clubs, only: [] do
      resources :coach_invitations, only: %i[new create]
    end
  end
  get "/invitations/:token", to: "coach_invitation_acceptances#show", as: :accept_coach_invitation
  patch "/invitations/:token", to: "coach_invitation_acceptances#update"

  # Break Periods: a Club's date ranges with no Classes, managed by its Club Managers.
  scope "/dashboard" do
    resources :clubs, only: [] do
      resources :break_periods, only: %i[index new create edit update destroy], shallow: true
    end
  end
  # Class Groups and their Training Plans: a Coach's own groups, also visible
  # to the Club Managers of the Coach's Club.
  scope "/dashboard" do
    resources :class_groups, only: %i[index new create show]
  end
  # Editing a Class Group's Players and schedule, at /dashboard/class_groups/:id/edit.
  scope "/dashboard" do
    resources :class_groups, controller: "class_group_edits", only: %i[edit update]
  end
  # A Class's page, and editing a Training Plan: adding a Class to a group,
  # and moving, skipping or marking done one Class, at /dashboard/classes/:id.
  scope "/dashboard" do
    resources :class_groups, only: [] do
      resources :classes, controller: "training_classes", as: :training_classes, only: %i[show create update],
                          shallow: true do
        member do
          patch :skip
          patch :unskip
          patch :done
          patch :undone
        end
      end
    end
  end
  # The Exercises a Coach picks for a Class from its Module.
  post "/dashboard/classes/:class_id/exercises/:ref", to: "class_exercises#create", as: :class_exercise,
                                                      format: false, constraints: { ref: /[^\/]+/ }
  delete "/dashboard/classes/:class_id/exercises/:ref", to: "class_exercises#destroy",
                                                        format: false, constraints: { ref: /[^\/]+/ }
  get "/dashboard/profile", to: "profile#index"
  patch "/dashboard/profile", to: "profile#update"
  patch "/locale", to: "locales#update"

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
