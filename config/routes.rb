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
  post "/dashboard/courses/:id/quiz/attempts", to: "quiz_attempts#create"
  get "/dashboard/exercises", to: "exercises#index"
  get "/dashboard/exercises/:ref", to: "exercises#show", format: false, constraints: { ref: /[^\/]+/ }
  patch "/dashboard/exercises/:ref/complete", to: "exercises#complete", constraints: { ref: /[^\/]+/ }
  # An Exercise's official Board: a Coach opens a scratch copy to explain on;
  # Admins edit it, or take it away.
  get "/dashboard/exercises/:ref/board", to: "exercise_boards#show", constraints: { ref: /[^\/]+/ }, as: :exercise_board
  get "/dashboard/exercises/:ref/board/edit", to: "exercise_boards#edit", constraints: { ref: /[^\/]+/ },
                                              as: :edit_exercise_board
  put "/dashboard/exercises/:ref/board", to: "exercise_boards#update", constraints: { ref: /[^\/]+/ }
  delete "/dashboard/exercises/:ref/board", to: "exercise_boards#destroy", constraints: { ref: /[^\/]+/ }
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

  # Removing a Coach from a Club, by its Club Managers.
  scope "/dashboard" do
    resources :clubs, only: [] do
      resources :coaches, controller: "club_coaches", as: :club_coaches, only: :destroy
    end
  end

  # Break Periods: a Club's date ranges with no Classes, managed by its Club Managers.
  scope "/dashboard" do
    resources :clubs, only: [] do
      resources :break_periods, only: %i[index new create edit update destroy], shallow: true
    end
  end
  # A Coach's Boards (Quadro): interactive padel courts to explain an
  # Exercise or a tactic. A new Board is scratch, kept in the browser, until
  # the Coach saves it into their own library.
  scope "/dashboard" do
    resources :boards, only: %i[index new create show update destroy]
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
  # Renaming a group from its page.
  scope "/dashboard" do
    resources :class_groups, only: [] do
      resource :name, controller: "class_group_names", as: :class_group_name, only: :update
    end
  end
  # Regenerating a group's Training Plan, only on request.
  scope "/dashboard" do
    resources :class_groups, only: [] do
      resource :regeneration, controller: "plan_regenerations", as: :plan_regeneration, only: :create
    end
  end
  # Reassigning a group to another Coach of its Club, by its Club Managers.
  scope "/dashboard" do
    resources :class_groups, only: [] do
      resource :reassignment, controller: "class_group_reassignments", as: :class_group_reassignment,
                              only: :update
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
