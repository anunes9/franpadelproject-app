require "rails_helper"

RSpec.describe "Renaming a Class Group", type: :request do
  let(:club) { create(:club) }
  let(:coach) { create(:user, :coach, club: club) }
  let!(:serve) { create(:course_module, level: :beginner, position: 1, title: "Serve") }
  let(:group) do
    ClassGroup.new(coach: coach, players: create_list(:player, 2, club: club), level: "beginner",
                   starts_on: Date.new(2026, 9, 7), cadence: 1, weekdays: ["tuesday"],
                   start_time: "18:00", duration: 60).tap { |g| g.create_with_plan || raise("refused") }
  end
  let(:group_path) { "/dashboard/class_groups/#{group.id}" }

  def page_props
    node = Nokogiri::HTML(response.body).at("[data-page]")
    JSON.parse(node.name == "script" ? node.text : node["data-page"])["props"]
  end

  def rename(name, headers: {})
    patch "#{group_path}/name", params: { class_group: { name: name } }, headers: headers
  end

  it "renames the group for its Coach, changing nothing else, and the page shows the name" do
    sign_in coach
    plan = group.training_classes.map(&:attributes)

    rename(" Fim de tarde ")

    expect(response).to redirect_to(group_path)
    expect(group.reload.name).to eq("Fim de tarde")
    expect(group.training_classes.reload.map(&:attributes)).to eq(plan)
    follow_redirect!
    expect(page_props["classGroup"]["name"]).to eq("Fim de tarde")
  end

  it "returns to the page it was asked from, its plan view kept" do
    sign_in coach

    rename("Fim de tarde", headers: { "Referer" => "http://www.example.com#{group_path}?view=list" })

    expect(response).to redirect_to("#{group_path}?view=list")
  end

  it "removes the name when given a blank one, so the group shows by its Level" do
    group.update!(name: "Fim de tarde")
    sign_in coach

    rename("  ")

    expect(group.reload.name).to be_nil
  end

  it "refuses a name over 60 characters, keeping the old one" do
    group.update!(name: "Fim de tarde")
    sign_in coach

    rename("a" * 61)

    expect(response).to redirect_to(group_path)
    expect(group.reload.name).to eq("Fim de tarde")
    follow_redirect!
    expect(page_props["errors"]["name"]).to eq([{ "code" => "too_long", "message" => "is too long (maximum is 60 characters)" }])
  end

  it "lets a Club Manager of the group's Club rename it" do
    manager = create(:user, :club_manager)
    create(:club_membership, user: manager, club: club)
    sign_in manager

    rename("Noite")

    expect(group.reload.name).to eq("Noite")
  end

  it "404s for another Coach, changing nothing" do
    sign_in create(:user, :coach, club: club)

    rename("Noite")

    expect(response).to have_http_status(:not_found)
    expect(group.reload.name).to be_nil
  end

  it "requires authentication" do
    rename("Noite")

    expect(response).to redirect_to("/users/sign_in")
    expect(group.reload.name).to be_nil
  end
end
