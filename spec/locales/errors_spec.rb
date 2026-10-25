require "rails_helper"

# The server's fallback error messages exist in both of the Client's languages.
RSpec.describe "Error message locales" do
  def keys(tree, prefix = [])
    tree.flat_map { |key, value| value.is_a?(Hash) ? keys(value, prefix + [key]) : [(prefix + [key]).join(".")] }
  end

  it "has a PT message for every EN error code" do
    en = keys(YAML.load_file(Rails.root.join("config/locales/errors.en.yml"))["en"])
    pt = keys(YAML.load_file(Rails.root.join("config/locales/errors.pt.yml"))["pt"])

    expect(pt).to match_array(en)
  end

  it "localizes a refusal's message in PT" do
    I18n.with_locale(:pt) do
      group = ClassGroup.new
      group.errors.add(:start_time, :crosses_midnight)

      expect(group.errors.messages_for(:start_time)).to eq(["tem de permitir que a aula termine até à meia-noite"])
    end
  end
end
