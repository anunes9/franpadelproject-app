require "rails_helper"

RSpec.describe BoardDocument do
  # A serve: A with the ball, the Coach, a cone, and in Step 2 the ball
  # carried off back glass 2, with a striped landing zone, a run, text and ink.
  def serve
    {
      "version" => 1,
      "view" => "full",
      "labels" => "sectors",
      "pieces" => [
        { "id" => "a", "kind" => "player", "label" => "A" },
        { "id" => "p", "kind" => "coach" },
        { "id" => "b", "kind" => "ball" },
        { "id" => "k", "kind" => "cone" }
      ],
      "steps" => [
        {
          "caption" => "Serviço",
          "positions" => {
            "a" => { "x" => 1.5, "y" => 6.4 }, "p" => { "x" => 1.5, "y" => 3.4 },
            "b" => { "x" => 2.5, "y" => 6.6 }, "k" => { "x" => 8.5, "y" => 4.2 }
          },
          "marks" => [
            { "id" => "m1", "kind" => "ballPath",
              "points" => [{ "x" => 2.5, "y" => 6.6 }, { "x" => 15.2, "y" => 2.4 },
                           { "x" => 20, "y" => 3.1, "glass" => { "wall" => "back", "number" => 2 } }] },
            { "id" => "m2", "kind" => "zone", "shape" => "rect", "fill" => "striped",
              "x" => 15.6, "y" => 1.6, "w" => 1.35, "h" => 1.65 },
            { "id" => "m3", "kind" => "zone", "shape" => "circle", "fill" => "outline", "cx" => 13, "cy" => 7, "r" => 0.9 },
            { "id" => "m4", "kind" => "arrow", "from" => { "x" => 1.5, "y" => 6.4 }, "to" => { "x" => 6, "y" => 6.4 } },
            { "id" => "m5", "kind" => "text", "x" => 2.9, "y" => 5.4, "text" => "serviço" },
            { "id" => "m6", "kind" => "ink", "points" => [[11, 1], [11.4, 1.5], [12.1, 2.2]] }
          ]
        }
      ]
    }
  end

  it "accepts a Board with every kind of piece and marking" do
    expect(described_class.problems(serve)).to eq([])
  end

  it "refuses what isn't a version 1 Board" do
    expect(described_class.problems(nil)).to eq(["not an object"])
    expect(described_class.problems(serve.merge("version" => 2))).to eq(["unknown version"])
    expect(described_class.problems(serve.merge("labels" => "zones"))).to eq(["unknown labels"])
    expect(described_class.problems(serve.merge("steps" => []))).to eq(["no steps"])
  end

  it "places each player letter, the Coach and the ball at most once" do
    twice = serve
    twice["pieces"] << { "id" => "a2", "kind" => "player", "label" => "A" }
    twice["steps"][0]["positions"]["a2"] = { "x" => 3, "y" => 3 }

    expect(described_class.problems(twice)).to include("a player letter is used twice")
  end

  it "needs every piece on the court in every Step" do
    missing = serve
    missing["steps"][0]["positions"].delete("k")
    off = serve
    off["steps"][0]["positions"]["a"] = { "x" => 25, "y" => 5 }

    expect(described_class.problems(missing)).to eq(["positions don't match the pieces"])
    expect(described_class.problems(off)).to eq(["a piece is off the court"])
  end

  it "only bounces off glass panels that exist" do
    path = serve
    path["steps"][0]["marks"][0]["points"][2]["glass"] = { "wall" => "side", "number" => 3 }

    expect(described_class.problems(path)).to eq(["unknown glass panel"])
  end

  it "refuses unknown markings and text that is blank or too long" do
    marks = serve
    marks["steps"][0]["marks"] << { "id" => "x", "kind" => "laser" }
    marks["steps"][0]["marks"] << { "id" => "t", "kind" => "text", "x" => 1, "y" => 1, "text" => "x" * 41 }

    expect(described_class.problems(marks)).to eq(["unknown mark kind", "bad text"])
  end

  it "takes captions and text in Portuguese and English, as on an Exercise's Board" do
    both = serve
    both["steps"][0]["caption"] = { "pt" => "Serviço", "en" => "Serve" }
    both["steps"][0]["marks"][4]["text"] = { "pt" => "serviço", "en" => "" }
    expect(described_class.problems(both)).to eq([])

    both["steps"][0]["marks"][4]["text"] = { "pt" => " ", "en" => "" }
    both["steps"][0]["caption"] = { "pt" => "Serviço" }
    expect(described_class.problems(both)).to eq(["bad caption", "bad text"])
  end

  it "knows a document too large to keep" do
    huge = serve
    huge["steps"][0]["caption"] = "x" * 300.kilobytes

    expect(described_class.too_large?(huge)).to be(true)
    expect(described_class.too_large?(serve)).to be(false)
  end
end
